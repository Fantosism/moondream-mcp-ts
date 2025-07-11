import { Config, ModelLoadError, InferenceError } from '@/types';
import { getLogger } from './logger';
import { ImageBuffer } from './imageLoader';
import { LocalModelClient } from './localModelClient';
import { CloudApiClient } from './cloudApiClient';
import { ModelHealthChecker, HealthCheckResult } from './modelHealthChecker';

export class HybridModelClient {
  private localClient: LocalModelClient;
  private cloudClient: CloudApiClient;
  private config: Config;
  private logger = getLogger();
  private isInitialized = false;
  private healthChecker: ModelHealthChecker;

  constructor(config: Config) {
    this.config = config;
    this.localClient = new LocalModelClient(config);
    this.cloudClient = new CloudApiClient(config);
    this.healthChecker = new ModelHealthChecker(config);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info(
      'Initializing hybrid model client',
      {
        modelMode: this.config.modelMode,
      },
      'hybrid-model'
    );

    try {
      switch (this.config.modelMode) {
        case 'local':
          await this.localClient.initialize();
          break;
        case 'cloud':
          await this.cloudClient.initialize();
          break;
        case 'hybrid':
          // Try local first, fall back to cloud if local fails
          try {
            await this.localClient.initialize();
            this.logger.info('Local model initialized successfully', {}, 'hybrid-model');
          } catch (error) {
            this.logger.warn(
              'Local model initialization failed, cloud fallback available',
              {
                error: error instanceof Error ? error.message : String(error),
              },
              'hybrid-model'
            );

            // Initialize cloud client as fallback
            await this.cloudClient.initialize();
            this.logger.info('Cloud API initialized as fallback', {}, 'hybrid-model');
          }
          break;
      }

      this.isInitialized = true;
      this.logger.info(
        'Hybrid model client initialized successfully',
        {
          modelMode: this.config.modelMode,
        },
        'hybrid-model'
      );

      // Start periodic health checks if enabled
      if (this.config.enableMemoryMonitoring) {
        this.healthChecker.startPeriodicHealthChecks(this, 60000); // Every minute
      }
    } catch (error) {
      this.logger.error(
        'Failed to initialize hybrid model client',
        {
          error: error instanceof Error ? error.message : String(error),
          modelMode: this.config.modelMode,
        },
        'hybrid-model'
      );

      throw new ModelLoadError(
        `Failed to initialize hybrid model client: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async caption(
    imageBuffer: ImageBuffer,
    length: 'short' | 'normal' | 'detailed'
  ): Promise<{ caption: string; confidence: number }> {
    return this.executeWithFallback(
      async client => client.caption(imageBuffer, length),
      'caption',
      { length }
    );
  }

  async query(
    imageBuffer: ImageBuffer,
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    return this.executeWithFallback(async client => client.query(imageBuffer, question), 'query', {
      question,
    });
  }

  async detect(imageBuffer: ImageBuffer, objectName: string): Promise<{ objects: any[] }> {
    return this.executeWithFallback(
      async client => client.detect(imageBuffer, objectName),
      'detect',
      { objectName }
    );
  }

  async point(imageBuffer: ImageBuffer, objectName: string): Promise<{ points: any[] }> {
    return this.executeWithFallback(
      async client => client.point(imageBuffer, objectName),
      'point',
      { objectName }
    );
  }

  async cleanup(): Promise<void> {
    // Stop health checks
    this.healthChecker.stopPeriodicHealthChecks();

    await Promise.all([this.localClient.cleanup(), this.cloudClient.cleanup()]);
    this.isInitialized = false;
    this.logger.info('Hybrid model client cleaned up', {}, 'hybrid-model');
  }

  private async executeWithFallback<T>(
    operation: (client: LocalModelClient | CloudApiClient) => Promise<T>,
    operationName: string,
    context: Record<string, any>
  ): Promise<T> {
    if (!this.isInitialized) {
      throw new ModelLoadError('Hybrid model client not initialized. Call initialize() first.');
    }

    switch (this.config.modelMode) {
      case 'local':
        return this.executeLocal(operation, operationName, context);
      case 'cloud':
        return this.executeCloud(operation, operationName, context);
      case 'hybrid':
        return this.executeHybrid(operation, operationName, context);
      default:
        throw new InferenceError(`Invalid model mode: ${this.config.modelMode}`);
    }
  }

  private async executeLocal<T>(
    operation: (client: LocalModelClient) => Promise<T>,
    operationName: string,
    context: Record<string, any>
  ): Promise<T> {
    try {
      return await operation(this.localClient);
    } catch (error) {
      this.logger.error(
        `Local ${operationName} failed`,
        {
          error: error instanceof Error ? error.message : String(error),
          ...context,
        },
        'hybrid-model'
      );
      throw error;
    }
  }

  private async executeCloud<T>(
    operation: (client: CloudApiClient) => Promise<T>,
    operationName: string,
    context: Record<string, any>
  ): Promise<T> {
    try {
      return await operation(this.cloudClient);
    } catch (error) {
      this.logger.error(
        `Cloud ${operationName} failed`,
        {
          error: error instanceof Error ? error.message : String(error),
          ...context,
        },
        'hybrid-model'
      );
      throw error;
    }
  }

  private async executeHybrid<T>(
    operation: (client: LocalModelClient | CloudApiClient) => Promise<T>,
    operationName: string,
    context: Record<string, any>
  ): Promise<T> {
    // Try local first if available
    if (this.localClient.isModelLoaded()) {
      try {
        this.logger.debug(`Executing ${operationName} on local model`, context, 'hybrid-model');
        return await operation(this.localClient);
      } catch (error) {
        this.logger.warn(
          `Local ${operationName} failed, falling back to cloud`,
          {
            error: error instanceof Error ? error.message : String(error),
            ...context,
          },
          'hybrid-model'
        );

        // Fall through to cloud execution
      }
    }

    // Use cloud as fallback
    if (this.cloudClient.isConnected()) {
      try {
        this.logger.debug(`Executing ${operationName} on cloud API`, context, 'hybrid-model');
        return await operation(this.cloudClient);
      } catch (error) {
        this.logger.error(
          `Cloud ${operationName} failed`,
          {
            error: error instanceof Error ? error.message : String(error),
            ...context,
          },
          'hybrid-model'
        );
        throw error;
      }
    }

    throw new InferenceError(
      `No available backends for ${operationName}. Local model not loaded and cloud API not connected.`
    );
  }

  getStatus(): {
    mode: string;
    localAvailable: boolean;
    cloudAvailable: boolean;
    initialized: boolean;
    health?: HealthCheckResult;
  } {
    return {
      mode: this.config.modelMode,
      localAvailable: this.localClient.isModelLoaded(),
      cloudAvailable: this.cloudClient.isConnected(),
      initialized: this.isInitialized,
      health: this.healthChecker.getLastHealthCheck(),
    };
  }

  isReady(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    switch (this.config.modelMode) {
      case 'local':
        return this.localClient.isModelLoaded();
      case 'cloud':
        return this.cloudClient.isConnected();
      case 'hybrid':
        return this.localClient.isModelLoaded() || this.cloudClient.isConnected();
      default:
        return false;
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    return this.healthChecker.performHealthCheck(this);
  }

  getHealthStatus(): HealthCheckResult | undefined {
    return this.healthChecker.getLastHealthCheck();
  }

  isHealthy(): boolean {
    return this.healthChecker.isHealthy();
  }
}
