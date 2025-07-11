import { Config } from '@/types';
import { getLogger } from './logger';
import { HybridModelClient } from './hybridModelClient';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  details: {
    localModel: {
      available: boolean;
      responseTime?: number;
      error?: string;
    };
    cloudApi: {
      available: boolean;
      responseTime?: number;
      error?: string;
    };
    overallResponseTime: number;
    mode: string;
  };
}

export class ModelHealthChecker {
  private config: Config;
  private logger = getLogger();
  private lastHealthCheck?: HealthCheckResult;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: Config) {
    this.config = config;
  }

  async performHealthCheck(client: HybridModelClient): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    this.logger.debug('Starting health check', {}, 'health-checker');

    const result: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: startTime,
      details: {
        localModel: { available: false },
        cloudApi: { available: false },
        overallResponseTime: 0,
        mode: this.config.modelMode,
      },
    };

    // Check local model health
    if (this.config.modelMode === 'local' || this.config.modelMode === 'hybrid') {
      await this.checkLocalModelHealth(client, result);
    }

    // Check cloud API health
    if (this.config.modelMode === 'cloud' || this.config.modelMode === 'hybrid') {
      await this.checkCloudApiHealth(client, result);
    }

    // Determine overall health status
    result.details.overallResponseTime = Date.now() - startTime;
    result.status = this.determineOverallHealth(result);

    this.lastHealthCheck = result;

    this.logger.info('Health check completed', {
      status: result.status,
      responseTime: result.details.overallResponseTime,
      localAvailable: result.details.localModel.available,
      cloudAvailable: result.details.cloudApi.available,
    }, 'health-checker');

    return result;
  }

  private async checkLocalModelHealth(
    client: HybridModelClient,
    result: HealthCheckResult
  ): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Create a small test image buffer for health check
      const testImageBuffer = this.createTestImageBuffer();
      
      // Perform a simple caption operation as health check
      await client.caption(testImageBuffer, 'short');
      
      const responseTime = Date.now() - startTime;
      
      result.details.localModel = {
        available: true,
        responseTime,
      };

      this.logger.debug('Local model health check passed', {
        responseTime,
      }, 'health-checker');

    } catch (error) {
      result.details.localModel = {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };

      this.logger.warn('Local model health check failed', {
        error: error instanceof Error ? error.message : String(error),
      }, 'health-checker');
    }
  }

  private async checkCloudApiHealth(
    client: HybridModelClient,
    result: HealthCheckResult
  ): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Create a small test image buffer for health check
      const testImageBuffer = this.createTestImageBuffer();
      
      // Perform a simple caption operation as health check
      await client.caption(testImageBuffer, 'short');
      
      const responseTime = Date.now() - startTime;
      
      result.details.cloudApi = {
        available: true,
        responseTime,
      };

      this.logger.debug('Cloud API health check passed', {
        responseTime,
      }, 'health-checker');

    } catch (error) {
      result.details.cloudApi = {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };

      this.logger.warn('Cloud API health check failed', {
        error: error instanceof Error ? error.message : String(error),
      }, 'health-checker');
    }
  }

  private determineOverallHealth(result: HealthCheckResult): 'healthy' | 'degraded' | 'unhealthy' {
    const { localModel, cloudApi, mode } = result.details;

    switch (mode) {
      case 'local':
        return localModel.available ? 'healthy' : 'unhealthy';
        
      case 'cloud':
        return cloudApi.available ? 'healthy' : 'unhealthy';
        
      case 'hybrid':
        if (localModel.available && cloudApi.available) {
          return 'healthy';
        } else if (localModel.available || cloudApi.available) {
          return 'degraded';
        } else {
          return 'unhealthy';
        }
        
      default:
        return 'unhealthy';
    }
  }

  private createTestImageBuffer(): { data: Buffer; format: string; width: number; height: number; channels: number } {
    // Create a minimal 1x1 pixel PNG for health checks
    // This is a valid PNG with minimal data
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);

    return {
      data: pngData,
      format: 'png',
      width: 1,
      height: 1,
      channels: 4, // RGBA
    };
  }

  startPeriodicHealthChecks(client: HybridModelClient, intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      this.stopPeriodicHealthChecks();
    }

    this.logger.info('Starting periodic health checks', {
      intervalMs,
    }, 'health-checker');

    this.healthCheckInterval = globalThis.setInterval(async () => {
      try {
        await this.performHealthCheck(client);
      } catch (error) {
        this.logger.error('Health check failed', {
          error: error instanceof Error ? error.message : String(error),
        }, 'health-checker');
      }
    }, intervalMs);
  }

  stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      globalThis.clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.info('Stopped periodic health checks', {}, 'health-checker');
    }
  }

  getLastHealthCheck(): HealthCheckResult | undefined {
    return this.lastHealthCheck;
  }

  isHealthy(): boolean {
    return this.lastHealthCheck?.status === 'healthy';
  }

  isDegraded(): boolean {
    return this.lastHealthCheck?.status === 'degraded';
  }

  isUnhealthy(): boolean {
    return this.lastHealthCheck?.status === 'unhealthy';
  }
}