import { DeviceType } from './models';

export interface SecurityValidationConfig {
  allowedDomains: string[];
  blockedDomains: string[];
  maxPathLength: number;
  enableNetworkValidation: boolean;
  enablePathTraversalCheck: boolean;
  enableExecutableCheck: boolean;
  enableContentTypeValidation: boolean;
  maxFileSizeMb: number;
}

export interface Config {
  // Model settings
  modelName: string;
  modelRevision: string;
  trustRemoteCode: boolean;
  modelCacheDir: string;
  modelDownloadTimeoutSeconds: number;
  modelLoadTimeoutSeconds: number;
  enableModelWarmup: boolean;
  modelWarmupTimeoutSeconds: number;

  // Model execution mode
  modelMode: 'local' | 'cloud' | 'hybrid';
  apiKey?: string;
  apiEndpoint: string;

  // Device settings
  device: DeviceType;
  deviceAutoDetect: boolean;
  gpuMemoryFraction: number;
  memoryLimitMb: number;

  // Image processing settings
  maxImageSize: [number, number];
  supportedFormats: string[];
  maxFileSizeMb: number;
  maxImagePixels: number;
  imagePreprocessingEnabled: boolean;
  imageResizeQuality: 'low' | 'medium' | 'high';
  imageCompressionQuality: number;
  enableImageOptimization: boolean;

  // Performance settings
  timeoutSeconds: number;
  maxConcurrentRequests: number;
  enableStreaming: boolean;
  maxBatchSize: number;
  batchConcurrency: number;
  enableBatchProgress: boolean;
  batchTimeoutSeconds: number;
  workerThreads: number;
  enableMemoryMonitoring: boolean;
  memoryWarningThresholdMb: number;

  // Network settings
  requestTimeoutSeconds: number;
  maxRedirects: number;
  userAgent: string;
  connectTimeoutSeconds: number;
  readTimeoutSeconds: number;
  retryAttempts: number;
  retryBackoffSeconds: number;
  enableSslVerification: boolean;
  proxyUrl?: string;

  // Security settings
  enableCors: boolean;
  corsOrigins: string[];
  enableRateLimiting: boolean;
  rateLimitRequestsPerMinute: number;
  enableRequestValidation: boolean;
  maxRequestSizeMb: number;
  enableSanitization: boolean;
  blockedDomains: string[];
  allowedDomains: string[];

  // Logging settings
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFormat: 'json' | 'text' | 'structured';
  logFilePath?: string;
  enablePerformanceLogging: boolean;
  enableAccessLogging: boolean;

  // Cache settings
  enableCaching: boolean;
  cacheType: 'memory' | 'redis' | 'file';
  cacheTtlSeconds: number;
  cacheMaxSizeMb: number;
  enableModelCaching: boolean;
  enableResultCaching: boolean;

  // Development settings
  debugMode: boolean;
  enableDebugLogging: boolean;
  saveDebugImages: boolean;
  debugImageDir: string;
  mockMode: boolean;
  mockDelayMs: number;
}

export interface ConfigOptions {
  // Model settings
  modelName?: string;
  modelRevision?: string;
  trustRemoteCode?: boolean;
  modelCacheDir?: string;
  modelDownloadTimeoutSeconds?: number;
  modelLoadTimeoutSeconds?: number;
  enableModelWarmup?: boolean;
  modelWarmupTimeoutSeconds?: number;

  // Model execution mode
  modelMode?: 'local' | 'cloud' | 'hybrid';
  apiKey?: string;
  apiEndpoint?: string;

  // Device settings
  device?: DeviceType | 'auto';
  gpuMemoryFraction?: number;
  memoryLimitMb?: number;

  // Image processing settings
  maxImageSize?: [number, number];
  maxFileSizeMb?: number;
  maxImagePixels?: number;
  imagePreprocessingEnabled?: boolean;
  imageResizeQuality?: 'low' | 'medium' | 'high';
  imageCompressionQuality?: number;
  enableImageOptimization?: boolean;

  // Performance settings
  timeoutSeconds?: number;
  maxConcurrentRequests?: number;
  enableStreaming?: boolean;
  maxBatchSize?: number;
  batchConcurrency?: number;
  enableBatchProgress?: boolean;
  batchTimeoutSeconds?: number;
  workerThreads?: number;
  enableMemoryMonitoring?: boolean;
  memoryWarningThresholdMb?: number;

  // Network settings
  requestTimeoutSeconds?: number;
  maxRedirects?: number;
  userAgent?: string;
  connectTimeoutSeconds?: number;
  readTimeoutSeconds?: number;
  retryAttempts?: number;
  retryBackoffSeconds?: number;
  enableSslVerification?: boolean;
  proxyUrl?: string;

  // Security settings
  enableCors?: boolean;
  corsOrigins?: string[];
  enableRateLimiting?: boolean;
  rateLimitRequestsPerMinute?: number;
  enableRequestValidation?: boolean;
  maxRequestSizeMb?: number;
  enableSanitization?: boolean;
  blockedDomains?: string[];
  allowedDomains?: string[];

  // Logging settings
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logFormat?: 'json' | 'text' | 'structured';
  logFilePath?: string;
  enablePerformanceLogging?: boolean;
  enableAccessLogging?: boolean;

  // Cache settings
  enableCaching?: boolean;
  cacheType?: 'memory' | 'redis' | 'file';
  cacheTtlSeconds?: number;
  cacheMaxSizeMb?: number;
  enableModelCaching?: boolean;
  enableResultCaching?: boolean;

  // Development settings
  debugMode?: boolean;
  enableDebugLogging?: boolean;
  saveDebugImages?: boolean;
  debugImageDir?: string;
  mockMode?: boolean;
  mockDelayMs?: number;
}

export const DEFAULT_CONFIG: Config = {
  // Model settings
  modelName: 'vikhyatk/moondream2',
  modelRevision: '2025-01-09',
  trustRemoteCode: true,
  modelCacheDir: '/tmp/moondream_models',
  modelDownloadTimeoutSeconds: 300,
  modelLoadTimeoutSeconds: 120,
  enableModelWarmup: true,
  modelWarmupTimeoutSeconds: 30,

  // Model execution mode
  modelMode: 'cloud',
  apiEndpoint: 'https://api.moondream.ai/v1',

  // Device settings
  device: 'cpu',
  deviceAutoDetect: true,
  gpuMemoryFraction: 0.8,
  memoryLimitMb: 4096,

  // Image processing settings
  maxImageSize: [2048, 2048],
  supportedFormats: ['JPEG', 'PNG', 'WebP', 'BMP', 'TIFF'],
  maxFileSizeMb: 50,
  maxImagePixels: 33177600, // 30MP
  imagePreprocessingEnabled: true,
  imageResizeQuality: 'high',
  imageCompressionQuality: 85,
  enableImageOptimization: true,

  // Performance settings
  timeoutSeconds: 120,
  maxConcurrentRequests: 5,
  enableStreaming: true,
  maxBatchSize: 10,
  batchConcurrency: 3,
  enableBatchProgress: true,
  batchTimeoutSeconds: 600,
  workerThreads: 4,
  enableMemoryMonitoring: true,
  memoryWarningThresholdMb: 3072,

  // Network settings
  requestTimeoutSeconds: 30,
  maxRedirects: 5,
  userAgent: 'Moondream-MCP-TS/1.0.0',
  connectTimeoutSeconds: 10,
  readTimeoutSeconds: 30,
  retryAttempts: 3,
  retryBackoffSeconds: 2,
  enableSslVerification: true,

  // Security settings
  enableCors: false,
  corsOrigins: [],
  enableRateLimiting: true,
  rateLimitRequestsPerMinute: 60,
  enableRequestValidation: true,
  maxRequestSizeMb: 100,
  enableSanitization: true,
  blockedDomains: [],
  allowedDomains: [],

  // Logging settings
  logLevel: 'info',
  logFormat: 'structured',
  enablePerformanceLogging: true,
  enableAccessLogging: true,

  // Cache settings
  enableCaching: true,
  cacheType: 'memory',
  cacheTtlSeconds: 3600,
  cacheMaxSizeMb: 1024,
  enableModelCaching: true,
  enableResultCaching: false,

  // Development settings
  debugMode: false,
  enableDebugLogging: false,
  saveDebugImages: false,
  debugImageDir: '/tmp/debug_images',
  mockMode: false,
  mockDelayMs: 100,
};
