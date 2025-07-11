import { Config, NetworkError, InferenceError } from '@/types';
import { getLogger } from './logger';
import { ImageBuffer } from './imageLoader';

export class CloudApiClient {
  private config: Config;
  private logger = getLogger();

  constructor(config: Config) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Validate API configuration
    if (!this.config.apiKey) {
      throw new Error(
        'API key is required for cloud mode. Set MOONDREAM_API_KEY environment variable.'
      );
    }

    if (!this.config.apiEndpoint) {
      throw new Error(
        'API endpoint is required for cloud mode. Set MOONDREAM_API_ENDPOINT environment variable.'
      );
    }

    // Test API connectivity
    try {
      await this.testConnection();
      this.logger.info(
        'Cloud API connection established',
        {
          endpoint: this.config.apiEndpoint,
        },
        'cloud-api'
      );
    } catch (error) {
      this.logger.error(
        'Failed to connect to cloud API',
        {
          error: error instanceof Error ? error.message : String(error),
          endpoint: this.config.apiEndpoint,
        },
        'cloud-api'
      );
      throw error;
    }
  }

  async caption(
    imageBuffer: ImageBuffer,
    length: 'short' | 'normal' | 'detailed'
  ): Promise<{ caption: string; confidence: number }> {
    const startTime = Date.now();

    try {
      const response = await this.makeApiRequest('/caption', {
        image_url: `data:image/jpeg;base64,${this.bufferToBase64(this.getImageBuffer(imageBuffer))}`,
        length: length === 'detailed' ? 'long' : length,
      });

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'cloud-caption-inference',
        inferenceTime,
        {
          length,
          captionLength: response.caption?.length || 0,
        },
        'cloud-api'
      );

      return {
        caption: response.caption || '',
        confidence: response.confidence || 0.85,
      };
    } catch (error) {
      this.logger.error(
        'Cloud caption inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'cloud-api'
      );

      throw new InferenceError(
        `Cloud caption inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async query(
    imageBuffer: ImageBuffer,
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    const startTime = Date.now();

    try {
      const response = await this.makeApiRequest('/query', {
        image: this.bufferToBase64(imageBuffer.data),
        question: question,
      });

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'cloud-query-inference',
        inferenceTime,
        {
          questionLength: question.length,
          answerLength: response.answer?.length || 0,
        },
        'cloud-api'
      );

      return {
        answer: response.answer || '',
        confidence: response.confidence || 0.78,
      };
    } catch (error) {
      this.logger.error(
        'Cloud query inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
          question,
        },
        'cloud-api'
      );

      throw new InferenceError(
        `Cloud query inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async detect(imageBuffer: ImageBuffer, objectName: string): Promise<{ objects: any[] }> {
    const startTime = Date.now();

    try {
      const response = await this.makeApiRequest('/detect', {
        image_url: `data:image/jpeg;base64,${this.bufferToBase64(this.getImageBuffer(imageBuffer))}`,
        object: objectName,
      });

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'cloud-detection-inference',
        inferenceTime,
        {
          objectName,
          objectsFound: response.objects?.length || 0,
        },
        'cloud-api'
      );

      return {
        objects: response.objects || [],
      };
    } catch (error) {
      this.logger.error(
        'Cloud detection inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
          objectName,
        },
        'cloud-api'
      );

      throw new InferenceError(
        `Cloud detection inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async point(imageBuffer: ImageBuffer, objectName: string): Promise<{ points: any[] }> {
    const startTime = Date.now();

    try {
      const response = await this.makeApiRequest('/point', {
        image_url: `data:image/jpeg;base64,${this.bufferToBase64(this.getImageBuffer(imageBuffer))}`,
        object: objectName,
      });

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'cloud-pointing-inference',
        inferenceTime,
        {
          objectName,
          pointsFound: response.points?.length || 0,
        },
        'cloud-api'
      );

      return {
        points: response.points || [],
      };
    } catch (error) {
      this.logger.error(
        'Cloud pointing inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
          objectName,
        },
        'cloud-api'
      );

      throw new InferenceError(
        `Cloud pointing inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for cloud API
    this.logger.info('Cloud API client cleaned up', {}, 'cloud-api');
  }

  private async testConnection(): Promise<void> {
    try {
      // Simple health check - try to get API info
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(this.config.apiEndpoint, {
        method: 'GET',
        headers: {
          'X-Moondream-Auth': this.config.apiKey!,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 404) {
        // 404 is ok for base endpoint, but other errors are not
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('API connection timeout');
      }
      throw error;
    }
  }

  private async makeApiRequest(endpoint: string, data: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutSeconds * 1000
    );

    try {
      const response = await fetch(`${this.config.apiEndpoint}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-Moondream-Auth': this.config.apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new NetworkError(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }

      throw error;
    }
  }

  private bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  private getImageBuffer(imageBuffer: ImageBuffer): Buffer {
    // Use original buffer for cloud API to preserve image format
    return imageBuffer.originalBuffer || imageBuffer.data;
  }

  isConnected(): boolean {
    return !!(this.config.apiKey && this.config.apiEndpoint);
  }
}
