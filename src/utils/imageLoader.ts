import { promises as fs } from 'fs';
import sharp from 'sharp';
import { Config, ImageProcessingError, NetworkError } from '@/types';
import { isUrlPath } from './validation';

// Error code constants
const ERROR_CODES = {
  ABORT: 'AbortError',
  FILE_NOT_FOUND: 'ENOENT',
  PERMISSION_DENIED: 'EACCES',
} as const;

export interface ImageBuffer {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
  format: string;
  sharpInstance?: sharp.Sharp;
  originalBuffer?: Buffer; // Original image data for cloud API
}

export function cleanupImageBuffer(imageBuffer: ImageBuffer): void {
  if (imageBuffer.sharpInstance) {
    // Sharp instances don't have explicit cleanup, but we can remove the reference
    imageBuffer.sharpInstance = undefined;
  }
  // Force garbage collection hint for large buffers
  if (imageBuffer.data.length > 1024 * 1024) {
    // > 1MB
    if (globalThis.gc) {
      globalThis.gc();
    }
  }
}

export async function loadImage(imagePath: string, config: Config): Promise<ImageBuffer> {
  const startTime = Date.now();

  try {
    let buffer: Buffer;

    if (isUrlPath(imagePath)) {
      buffer = await loadImageFromUrl(imagePath, config);
    } else {
      buffer = await loadImageFromFile(imagePath, config);
    }

    // Validate file size
    const fileSizeMb = buffer.length / (1024 * 1024);
    if (fileSizeMb > config.maxFileSizeMb) {
      throw new ImageProcessingError(
        `Image file size (${fileSizeMb.toFixed(2)}MB) exceeds maximum allowed size (${config.maxFileSizeMb}MB)`
      );
    }

    // Process image with Sharp
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    // Validate image format
    const format = metadata.format?.toUpperCase() || 'UNKNOWN';
    validateImageFormat(format, config.supportedFormats);

    // Convert to RGB and get image data
    const { data, info } = await sharpInstance
      .removeAlpha() // Remove alpha channel
      .toColorspace('srgb') // Ensure sRGB color space
      .raw()
      .toBuffer({ resolveWithObject: true });

    const imageBuffer: ImageBuffer = {
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
      format,
      sharpInstance: sharp(buffer), // Keep original for preprocessing
      originalBuffer: buffer, // Keep original for cloud API
    };

    const processingTime = Date.now() - startTime;
    console.log(`Image loaded in ${processingTime}ms`);

    return imageBuffer;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Image loading failed after ${processingTime}ms:`, error);
    throw error;
  }
}

async function loadImageFromUrl(url: string, config: Config): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutSeconds * 1000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': config.userAgent,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      throw new ImageProcessingError(
        `URL does not point to an image (content-type: ${contentType})`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof Error && error.name === ERROR_CODES.ABORT) {
      throw new NetworkError('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadImageFromFile(filePath: string, config: Config): Promise<Buffer> {
  try {
    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      throw new ImageProcessingError(`Path is not a file: ${filePath}`);
    }

    const fileSizeMb = stats.size / (1024 * 1024);
    if (fileSizeMb > config.maxFileSizeMb) {
      throw new ImageProcessingError(
        `File size (${fileSizeMb.toFixed(2)}MB) exceeds maximum allowed size (${config.maxFileSizeMb}MB)`
      );
    }

    return await fs.readFile(filePath);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === ERROR_CODES.FILE_NOT_FOUND) {
        throw new ImageProcessingError(`File not found: ${filePath}`);
      }
      if (nodeError.code === ERROR_CODES.PERMISSION_DENIED) {
        throw new ImageProcessingError(`Permission denied: ${filePath}`);
      }
    }
    throw error;
  }
}

export function validateImageFormat(format: string, supportedFormats: string[]): void {
  if (!supportedFormats.includes(format)) {
    throw new ImageProcessingError(
      `Unsupported image format: ${format}. Supported formats: ${supportedFormats.join(', ')}`
    );
  }
}

export async function preprocessImage(
  imageBuffer: ImageBuffer,
  config: Config
): Promise<ImageBuffer> {
  const [maxWidth, maxHeight] = config.maxImageSize;

  // Check if resizing is needed
  if (imageBuffer.width <= maxWidth && imageBuffer.height <= maxHeight) {
    return imageBuffer;
  }

  if (!imageBuffer.sharpInstance) {
    throw new ImageProcessingError('Sharp instance not available for preprocessing');
  }

  try {
    // Resize image maintaining aspect ratio
    const { data, info } = await imageBuffer.sharpInstance
      .resize(maxWidth, maxHeight, {
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true, // Don't enlarge smaller images
        kernel: sharp.kernel.lanczos3, // High quality resampling
      })
      .removeAlpha() // Remove alpha channel
      .toColorspace('srgb') // Ensure sRGB color space
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
      format: imageBuffer.format,
      sharpInstance: imageBuffer.sharpInstance,
    };
  } catch (error) {
    throw new ImageProcessingError(`Failed to preprocess image: ${error}`);
  }
}
