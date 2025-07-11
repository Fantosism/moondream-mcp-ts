import {
  Config,
  CaptionResult,
  QueryResult,
  DetectionResult,
  PointingResult,
  AltTextResult,
  CaptionLength,
  ModelNotLoadedError,
  MoondreamError,
} from '@/types';
import { loadImage, preprocessImage, withTimeout, sanitizeErrorMessage } from '@/utils';
import { HybridModelClient } from './hybridModelClient';
import { getLogger } from './logger';
export class MoondreamClient {
  private config: Config;
  private hybridClient: HybridModelClient;
  private logger = getLogger();

  constructor(config: Config) {
    this.config = config;
    this.hybridClient = new HybridModelClient(config);
  }

  async initialize(): Promise<void> {
    if (this.config.mockMode) {
      this.logger.info(
        'Mock mode enabled - skipping real model initialization',
        {},
        'moondream-client'
      );
      return;
    }
    await this.hybridClient.initialize();
  }

  async captionImage(
    imagePath: string,
    length: CaptionLength = 'normal',
    stream: boolean = false
  ): Promise<CaptionResult> {
    const startTime = Date.now();

    try {
      // Handle mock mode
      if (this.config.mockMode) {
        await new Promise(resolve => setTimeout(resolve, this.config.mockDelayMs));
        const mockCaptions = {
          short: 'A photo',
          normal: 'A photo showing various objects',
          detailed: 'A detailed photo showing various objects with good lighting and composition',
        };

        const processingTime = Date.now() - startTime;
        return {
          success: true,
          caption: mockCaptions[length],
          confidence: 0.85,
          length,
          processingTimeMs: processingTime,
          metadata: {
            imagePath,
            modelName: this.config.modelName,
            device: this.config.device,
            imageFormat: 'mock',
            streamingEnabled: stream,
          },
        };
      }

      const imageBuffer = await loadImage(imagePath, this.config);
      const preprocessedImage = await preprocessImage(imageBuffer, this.config);

      const result = await withTimeout(
        this.hybridClient.caption(preprocessedImage, length),
        this.config.timeoutSeconds * 1000
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        caption: result.caption,
        confidence: result.confidence,
        length,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          modelName: this.config.modelName,
          device: this.config.device,
          imageFormat: preprocessedImage.format,
          streamingEnabled: stream,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = sanitizeErrorMessage(error);
      const errorCode = error instanceof MoondreamError ? error.errorCode : 'CAPTION_ERROR';

      return {
        success: false,
        errorMessage,
        errorCode,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          modelName: this.config.modelName,
          device: this.config.device,
        },
      };
    }
  }

  async queryImage(imagePath: string, question: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const imageBuffer = await loadImage(imagePath, this.config);
      const preprocessedImage = await preprocessImage(imageBuffer, this.config);

      const result = await withTimeout(
        this.hybridClient.query(preprocessedImage, question),
        this.config.timeoutSeconds * 1000
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        answer: result.answer,
        question,
        confidence: result.confidence,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          modelName: this.config.modelName,
          device: this.config.device,
          imageFormat: preprocessedImage.format,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = sanitizeErrorMessage(error);
      const errorCode = error instanceof MoondreamError ? error.errorCode : 'QUERY_ERROR';

      return {
        success: false,
        errorMessage,
        errorCode,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          question,
          modelName: this.config.modelName,
          device: this.config.device,
        },
      };
    }
  }

  async detectObjects(imagePath: string, objectName: string): Promise<DetectionResult> {
    const startTime = Date.now();

    try {
      const imageBuffer = await loadImage(imagePath, this.config);
      const preprocessedImage = await preprocessImage(imageBuffer, this.config);

      const result = await withTimeout(
        this.hybridClient.detect(preprocessedImage, objectName),
        this.config.timeoutSeconds * 1000
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        objects: result.objects,
        objectName,
        totalFound: result.objects.length,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          modelName: this.config.modelName,
          device: this.config.device,
          imageFormat: preprocessedImage.format,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = sanitizeErrorMessage(error);
      const errorCode = error instanceof MoondreamError ? error.errorCode : 'DETECTION_ERROR';

      return {
        success: false,
        objects: [],
        totalFound: 0,
        errorMessage,
        errorCode,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          objectName,
          modelName: this.config.modelName,
          device: this.config.device,
        },
      };
    }
  }

  async pointObjects(imagePath: string, objectName: string): Promise<PointingResult> {
    const startTime = Date.now();

    try {
      const imageBuffer = await loadImage(imagePath, this.config);
      const preprocessedImage = await preprocessImage(imageBuffer, this.config);

      const result = await withTimeout(
        this.hybridClient.point(preprocessedImage, objectName),
        this.config.timeoutSeconds * 1000
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        points: result.points,
        objectName,
        totalFound: result.points.length,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          modelName: this.config.modelName,
          device: this.config.device,
          imageFormat: preprocessedImage.format,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = sanitizeErrorMessage(error);
      const errorCode = error instanceof MoondreamError ? error.errorCode : 'POINTING_ERROR';

      return {
        success: false,
        points: [],
        totalFound: 0,
        errorMessage,
        errorCode,
        processingTimeMs: processingTime,
        metadata: {
          imagePath,
          objectName,
          modelName: this.config.modelName,
          device: this.config.device,
        },
      };
    }
  }

  async cleanup(): Promise<void> {
    await this.hybridClient.cleanup();
  }

  // Alt-text generation method
  async generateAltText(
    imagePath: string,
    style: 'concise' | 'descriptive' | 'detailed' = 'descriptive',
    maxLength: number = 125,
    options: {
      includeColors?: boolean;
      includeObjects?: boolean;
      includeActions?: boolean;
      includeContext?: boolean;
    } = {}
  ): Promise<AltTextResult> {
    if (!this.hybridClient.isReady()) {
      throw new ModelNotLoadedError('Model not ready. Call initialize() first.');
    }

    try {
      const startTime = Date.now();

      // Load and preprocess image
      const imageBuffer = await loadImage(imagePath, this.config);
      const preprocessedImage = await preprocessImage(imageBuffer, this.config);

      // Generate specialized alt-text prompt
      const prompt = this.buildAltTextPrompt(style, maxLength, options);

      // Use query inference with the alt-text prompt
      const result = await this.hybridClient.query(preprocessedImage, prompt);

      // Process the result to make it accessibility-friendly
      const processedAltText = this.processAltTextResult(result.answer, maxLength);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        altText: processedAltText,
        style,
        wordCount: processedAltText.split(/\s+/).length,
        accessibility: {
          includesColors: options.includeColors ?? true,
          includesObjects: options.includeObjects ?? true,
          includesActions: options.includeActions ?? true,
          includesContext: options.includeContext ?? true,
        },
        processingTimeMs: processingTime,
        metadata: {
          operation: 'alt-text',
          imagePath,
          style,
          maxLength,
          originalAnswer: result.answer,
          confidence: result.confidence,
        },
      };
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error);
      return {
        success: false,
        errorMessage: `Alt-text generation failed: ${errorMessage}`,
        errorCode: 'ALT_TEXT_GENERATION_ERROR',
        processingTimeMs: 0,
        metadata: {
          operation: 'alt-text',
          imagePath,
          style,
          maxLength,
        },
      };
    }
  }

  private buildAltTextPrompt(
    style: 'concise' | 'descriptive' | 'detailed',
    maxLength: number,
    options: {
      includeColors?: boolean;
      includeObjects?: boolean;
      includeActions?: boolean;
      includeContext?: boolean;
    }
  ): string {
    let basePrompt = 'Generate accessible alt-text for visually impaired users. ';

    switch (style) {
      case 'concise':
        basePrompt += 'Keep it brief and essential. ';
        break;
      case 'descriptive':
        basePrompt += 'Provide a clear, informative description. ';
        break;
      case 'detailed':
        basePrompt += 'Include comprehensive details about the scene. ';
        break;
    }

    const includeInstructions = [];
    if (options.includeColors) {
      includeInstructions.push('important colors');
    }
    if (options.includeObjects) {
      includeInstructions.push('key objects and people');
    }
    if (options.includeActions) {
      includeInstructions.push('actions or activities');
    }
    if (options.includeContext) {
      includeInstructions.push('setting and context');
    }

    if (includeInstructions.length > 0) {
      basePrompt += `Focus on ${includeInstructions.join(', ')}. `;
    }

    basePrompt += `Keep under ${maxLength} characters. `;
    basePrompt += 'Write in present tense, be objective. ';
    basePrompt += 'Start directly with the description, no prefixes like "This image shows".';

    return basePrompt;
  }

  private processAltTextResult(rawText: string, maxLength: number): string {
    let processed = rawText.trim();

    // Remove common prefixes that screen readers don't need
    const unnecessaryPrefixes = [
      'This image shows',
      'This image depicts',
      'The image shows',
      'The image depicts',
      'In this image',
      'The picture shows',
      'This picture shows',
      'Based on the image',
      'I can see',
      'The photo shows',
      'This photo shows',
    ];

    for (const prefix of unnecessaryPrefixes) {
      if (processed.toLowerCase().startsWith(prefix.toLowerCase())) {
        processed = processed.substring(prefix.length).trim();
        processed = processed.charAt(0).toUpperCase() + processed.slice(1);
        break;
      }
    }

    // Remove trailing period
    if (processed.endsWith('.')) {
      processed = processed.slice(0, -1);
    }

    // Truncate if needed
    if (processed.length > maxLength) {
      const truncated = processed.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.7) {
        processed = truncated.substring(0, lastSpace);
      } else {
        processed = truncated;
      }
    }

    return processed;
  }
}
