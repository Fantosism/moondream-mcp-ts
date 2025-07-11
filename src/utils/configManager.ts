import { Config, ConfigOptions, DEFAULT_CONFIG, SecurityValidationConfig } from '../types/config';
import { DeviceType } from '../types/models';
import { ValidationError } from '../types/errors';

export function createConfigFromEnv(): Config {
  const config: Config = { ...DEFAULT_CONFIG };

  // Model settings
  if (process.env.MOONDREAM_MODEL_NAME) {
    config.modelName = process.env.MOONDREAM_MODEL_NAME;
  }

  if (process.env.MOONDREAM_MODEL_REVISION) {
    config.modelRevision = process.env.MOONDREAM_MODEL_REVISION;
  }

  if (process.env.MOONDREAM_TRUST_REMOTE_CODE) {
    config.trustRemoteCode = process.env.MOONDREAM_TRUST_REMOTE_CODE.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_MODEL_CACHE_DIR) {
    config.modelCacheDir = process.env.MOONDREAM_MODEL_CACHE_DIR;
  }

  if (process.env.MOONDREAM_MODEL_DOWNLOAD_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_MODEL_DOWNLOAD_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.modelDownloadTimeoutSeconds = timeout;
    }
  }

  if (process.env.MOONDREAM_MODEL_LOAD_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_MODEL_LOAD_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.modelLoadTimeoutSeconds = timeout;
    }
  }

  if (process.env.MOONDREAM_ENABLE_MODEL_WARMUP) {
    config.enableModelWarmup = process.env.MOONDREAM_ENABLE_MODEL_WARMUP.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_MODEL_WARMUP_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_MODEL_WARMUP_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.modelWarmupTimeoutSeconds = timeout;
    }
  }

  // Model execution mode settings
  if (process.env.MOONDREAM_MODEL_MODE) {
    const mode = process.env.MOONDREAM_MODEL_MODE.toLowerCase();
    if (['local', 'cloud', 'hybrid'].includes(mode)) {
      config.modelMode = mode as 'local' | 'cloud' | 'hybrid';
    }
  }

  if (process.env.MOONDREAM_API_KEY) {
    config.apiKey = process.env.MOONDREAM_API_KEY;
  }

  if (process.env.MOONDREAM_API_ENDPOINT) {
    config.apiEndpoint = process.env.MOONDREAM_API_ENDPOINT;
  }

  // Device settings
  if (process.env.MOONDREAM_DEVICE) {
    const device = process.env.MOONDREAM_DEVICE.toLowerCase();
    if (device === 'auto') {
      config.device = detectBestDevice();
    } else if (['cpu', 'cuda', 'mps'].includes(device)) {
      config.device = device as DeviceType;
    }
  }

  if (process.env.MOONDREAM_GPU_MEMORY_FRACTION) {
    const fraction = parseFloat(process.env.MOONDREAM_GPU_MEMORY_FRACTION);
    if (!isNaN(fraction) && fraction > 0 && fraction <= 1) {
      config.gpuMemoryFraction = fraction;
    }
  }

  if (process.env.MOONDREAM_MEMORY_LIMIT_MB) {
    const limitMb = parseInt(process.env.MOONDREAM_MEMORY_LIMIT_MB);
    if (!isNaN(limitMb) && limitMb > 0) {
      config.memoryLimitMb = limitMb;
    }
  }

  // Image processing settings
  if (process.env.MOONDREAM_MAX_IMAGE_SIZE) {
    const size = parseInt(process.env.MOONDREAM_MAX_IMAGE_SIZE);
    if (!isNaN(size) && size > 0) {
      config.maxImageSize = [size, size];
    }
  }

  if (process.env.MOONDREAM_MAX_FILE_SIZE_MB) {
    const size = parseInt(process.env.MOONDREAM_MAX_FILE_SIZE_MB);
    if (!isNaN(size) && size > 0) {
      config.maxFileSizeMb = size;
    }
  }

  if (process.env.MOONDREAM_MAX_IMAGE_PIXELS) {
    const pixels = parseInt(process.env.MOONDREAM_MAX_IMAGE_PIXELS);
    if (!isNaN(pixels) && pixels > 0) {
      config.maxImagePixels = pixels;
    }
  }

  if (process.env.MOONDREAM_IMAGE_PREPROCESSING_ENABLED) {
    config.imagePreprocessingEnabled =
      process.env.MOONDREAM_IMAGE_PREPROCESSING_ENABLED.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_IMAGE_RESIZE_QUALITY) {
    const quality = process.env.MOONDREAM_IMAGE_RESIZE_QUALITY.toLowerCase();
    if (['low', 'medium', 'high'].includes(quality)) {
      config.imageResizeQuality = quality as 'low' | 'medium' | 'high';
    }
  }

  if (process.env.MOONDREAM_IMAGE_COMPRESSION_QUALITY) {
    const quality = parseInt(process.env.MOONDREAM_IMAGE_COMPRESSION_QUALITY);
    if (!isNaN(quality) && quality >= 1 && quality <= 100) {
      config.imageCompressionQuality = quality;
    }
  }

  if (process.env.MOONDREAM_ENABLE_IMAGE_OPTIMIZATION) {
    config.enableImageOptimization =
      process.env.MOONDREAM_ENABLE_IMAGE_OPTIMIZATION.toLowerCase() === 'true';
  }

  // Performance settings
  if (process.env.MOONDREAM_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.timeoutSeconds = timeout;
    }
  }

  if (process.env.MOONDREAM_MAX_CONCURRENT_REQUESTS) {
    const maxConcurrent = parseInt(process.env.MOONDREAM_MAX_CONCURRENT_REQUESTS);
    if (!isNaN(maxConcurrent) && maxConcurrent > 0) {
      config.maxConcurrentRequests = maxConcurrent;
    }
  }

  if (process.env.MOONDREAM_ENABLE_STREAMING) {
    config.enableStreaming = process.env.MOONDREAM_ENABLE_STREAMING.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_MAX_BATCH_SIZE) {
    const batchSize = parseInt(process.env.MOONDREAM_MAX_BATCH_SIZE);
    if (!isNaN(batchSize) && batchSize > 0) {
      config.maxBatchSize = batchSize;
    }
  }

  if (process.env.MOONDREAM_BATCH_CONCURRENCY) {
    const concurrency = parseInt(process.env.MOONDREAM_BATCH_CONCURRENCY);
    if (!isNaN(concurrency) && concurrency > 0) {
      config.batchConcurrency = concurrency;
    }
  }

  if (process.env.MOONDREAM_ENABLE_BATCH_PROGRESS) {
    config.enableBatchProgress =
      process.env.MOONDREAM_ENABLE_BATCH_PROGRESS.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_BATCH_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_BATCH_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.batchTimeoutSeconds = timeout;
    }
  }

  if (process.env.MOONDREAM_WORKER_THREADS) {
    const threads = parseInt(process.env.MOONDREAM_WORKER_THREADS);
    if (!isNaN(threads) && threads > 0) {
      config.workerThreads = threads;
    }
  }

  if (process.env.MOONDREAM_ENABLE_MEMORY_MONITORING) {
    config.enableMemoryMonitoring =
      process.env.MOONDREAM_ENABLE_MEMORY_MONITORING.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_MEMORY_WARNING_THRESHOLD_MB) {
    const threshold = parseInt(process.env.MOONDREAM_MEMORY_WARNING_THRESHOLD_MB);
    if (!isNaN(threshold) && threshold > 0) {
      config.memoryWarningThresholdMb = threshold;
    }
  }

  // Network settings
  if (process.env.MOONDREAM_REQUEST_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_REQUEST_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.requestTimeoutSeconds = timeout;
    }
  }

  if (process.env.MOONDREAM_MAX_REDIRECTS) {
    const redirects = parseInt(process.env.MOONDREAM_MAX_REDIRECTS);
    if (!isNaN(redirects) && redirects >= 0) {
      config.maxRedirects = redirects;
    }
  }

  if (process.env.MOONDREAM_USER_AGENT) {
    config.userAgent = process.env.MOONDREAM_USER_AGENT;
  }

  if (process.env.MOONDREAM_CONNECT_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_CONNECT_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.connectTimeoutSeconds = timeout;
    }
  }

  if (process.env.MOONDREAM_READ_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.MOONDREAM_READ_TIMEOUT_SECONDS);
    if (!isNaN(timeout) && timeout > 0) {
      config.readTimeoutSeconds = timeout;
    }
  }

  if (process.env.MOONDREAM_RETRY_ATTEMPTS) {
    const attempts = parseInt(process.env.MOONDREAM_RETRY_ATTEMPTS);
    if (!isNaN(attempts) && attempts >= 0) {
      config.retryAttempts = attempts;
    }
  }

  if (process.env.MOONDREAM_RETRY_BACKOFF_SECONDS) {
    const backoff = parseInt(process.env.MOONDREAM_RETRY_BACKOFF_SECONDS);
    if (!isNaN(backoff) && backoff > 0) {
      config.retryBackoffSeconds = backoff;
    }
  }

  if (process.env.MOONDREAM_ENABLE_SSL_VERIFICATION) {
    config.enableSslVerification =
      process.env.MOONDREAM_ENABLE_SSL_VERIFICATION.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_PROXY_URL) {
    config.proxyUrl = process.env.MOONDREAM_PROXY_URL;
  }

  // Security settings
  if (process.env.MOONDREAM_ENABLE_CORS) {
    config.enableCors = process.env.MOONDREAM_ENABLE_CORS.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_CORS_ORIGINS) {
    config.corsOrigins = process.env.MOONDREAM_CORS_ORIGINS.split(',').map(origin => origin.trim());
  }

  if (process.env.MOONDREAM_ENABLE_RATE_LIMITING) {
    config.enableRateLimiting = process.env.MOONDREAM_ENABLE_RATE_LIMITING.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE) {
    const limit = parseInt(process.env.MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE);
    if (!isNaN(limit) && limit > 0) {
      config.rateLimitRequestsPerMinute = limit;
    }
  }

  if (process.env.MOONDREAM_ENABLE_REQUEST_VALIDATION) {
    config.enableRequestValidation =
      process.env.MOONDREAM_ENABLE_REQUEST_VALIDATION.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_MAX_REQUEST_SIZE_MB) {
    const size = parseInt(process.env.MOONDREAM_MAX_REQUEST_SIZE_MB);
    if (!isNaN(size) && size > 0) {
      config.maxRequestSizeMb = size;
    }
  }

  if (process.env.MOONDREAM_ENABLE_SANITIZATION) {
    config.enableSanitization = process.env.MOONDREAM_ENABLE_SANITIZATION.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_BLOCKED_DOMAINS) {
    config.blockedDomains = process.env.MOONDREAM_BLOCKED_DOMAINS.split(',').map(domain =>
      domain.trim()
    );
  }

  if (process.env.MOONDREAM_ALLOWED_DOMAINS) {
    config.allowedDomains = process.env.MOONDREAM_ALLOWED_DOMAINS.split(',').map(domain =>
      domain.trim()
    );
  }

  // Logging settings
  if (process.env.MOONDREAM_LOG_LEVEL) {
    const level = process.env.MOONDREAM_LOG_LEVEL.toLowerCase();
    if (['debug', 'info', 'warn', 'error'].includes(level)) {
      config.logLevel = level as 'debug' | 'info' | 'warn' | 'error';
    }
  }

  if (process.env.MOONDREAM_LOG_FORMAT) {
    const format = process.env.MOONDREAM_LOG_FORMAT.toLowerCase();
    if (['json', 'text', 'structured'].includes(format)) {
      config.logFormat = format as 'json' | 'text' | 'structured';
    }
  }

  if (process.env.MOONDREAM_LOG_FILE_PATH) {
    config.logFilePath = process.env.MOONDREAM_LOG_FILE_PATH;
  }

  if (process.env.MOONDREAM_ENABLE_PERFORMANCE_LOGGING) {
    config.enablePerformanceLogging =
      process.env.MOONDREAM_ENABLE_PERFORMANCE_LOGGING.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_ENABLE_ACCESS_LOGGING) {
    config.enableAccessLogging =
      process.env.MOONDREAM_ENABLE_ACCESS_LOGGING.toLowerCase() === 'true';
  }

  // Cache settings
  if (process.env.MOONDREAM_ENABLE_CACHING) {
    config.enableCaching = process.env.MOONDREAM_ENABLE_CACHING.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_CACHE_TYPE) {
    const type = process.env.MOONDREAM_CACHE_TYPE.toLowerCase();
    if (['memory', 'redis', 'file'].includes(type)) {
      config.cacheType = type as 'memory' | 'redis' | 'file';
    }
  }

  if (process.env.MOONDREAM_CACHE_TTL_SECONDS) {
    const ttl = parseInt(process.env.MOONDREAM_CACHE_TTL_SECONDS);
    if (!isNaN(ttl) && ttl > 0) {
      config.cacheTtlSeconds = ttl;
    }
  }

  if (process.env.MOONDREAM_CACHE_MAX_SIZE_MB) {
    const size = parseInt(process.env.MOONDREAM_CACHE_MAX_SIZE_MB);
    if (!isNaN(size) && size > 0) {
      config.cacheMaxSizeMb = size;
    }
  }

  if (process.env.MOONDREAM_ENABLE_MODEL_CACHING) {
    config.enableModelCaching = process.env.MOONDREAM_ENABLE_MODEL_CACHING.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_ENABLE_RESULT_CACHING) {
    config.enableResultCaching =
      process.env.MOONDREAM_ENABLE_RESULT_CACHING.toLowerCase() === 'true';
  }

  // Development settings
  if (process.env.MOONDREAM_DEBUG_MODE) {
    config.debugMode = process.env.MOONDREAM_DEBUG_MODE.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_ENABLE_DEBUG_LOGGING) {
    config.enableDebugLogging = process.env.MOONDREAM_ENABLE_DEBUG_LOGGING.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_SAVE_DEBUG_IMAGES) {
    config.saveDebugImages = process.env.MOONDREAM_SAVE_DEBUG_IMAGES.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_DEBUG_IMAGE_DIR) {
    config.debugImageDir = process.env.MOONDREAM_DEBUG_IMAGE_DIR;
  }

  if (process.env.MOONDREAM_MOCK_MODE) {
    config.mockMode = process.env.MOONDREAM_MOCK_MODE.toLowerCase() === 'true';
  }

  if (process.env.MOONDREAM_MOCK_DELAY_MS) {
    const delay = parseInt(process.env.MOONDREAM_MOCK_DELAY_MS);
    if (!isNaN(delay) && delay >= 0) {
      config.mockDelayMs = delay;
    }
  }

  validateConfig(config);
  return config;
}

export function createConfig(options: ConfigOptions = {}): Config {
  const config: Config = { ...DEFAULT_CONFIG };

  // Apply options - Model settings
  if (options.modelName) config.modelName = options.modelName;
  if (options.modelRevision) config.modelRevision = options.modelRevision;
  if (options.trustRemoteCode !== undefined) config.trustRemoteCode = options.trustRemoteCode;
  if (options.modelCacheDir) config.modelCacheDir = options.modelCacheDir;
  if (options.modelDownloadTimeoutSeconds)
    config.modelDownloadTimeoutSeconds = options.modelDownloadTimeoutSeconds;
  if (options.modelLoadTimeoutSeconds)
    config.modelLoadTimeoutSeconds = options.modelLoadTimeoutSeconds;
  if (options.enableModelWarmup !== undefined) config.enableModelWarmup = options.enableModelWarmup;
  if (options.modelWarmupTimeoutSeconds)
    config.modelWarmupTimeoutSeconds = options.modelWarmupTimeoutSeconds;

  // Device settings
  if (options.device) {
    if (options.device === 'auto') {
      config.device = detectBestDevice();
    } else {
      config.device = options.device;
    }
  }
  if (options.gpuMemoryFraction) config.gpuMemoryFraction = options.gpuMemoryFraction;
  if (options.memoryLimitMb) config.memoryLimitMb = options.memoryLimitMb;

  // Image processing settings
  if (options.maxImageSize) config.maxImageSize = options.maxImageSize;
  if (options.maxFileSizeMb) config.maxFileSizeMb = options.maxFileSizeMb;
  if (options.maxImagePixels) config.maxImagePixels = options.maxImagePixels;
  if (options.imagePreprocessingEnabled !== undefined)
    config.imagePreprocessingEnabled = options.imagePreprocessingEnabled;
  if (options.imageResizeQuality) config.imageResizeQuality = options.imageResizeQuality;
  if (options.imageCompressionQuality)
    config.imageCompressionQuality = options.imageCompressionQuality;
  if (options.enableImageOptimization !== undefined)
    config.enableImageOptimization = options.enableImageOptimization;

  // Performance settings
  if (options.timeoutSeconds) config.timeoutSeconds = options.timeoutSeconds;
  if (options.maxConcurrentRequests) config.maxConcurrentRequests = options.maxConcurrentRequests;
  if (options.enableStreaming !== undefined) config.enableStreaming = options.enableStreaming;
  if (options.maxBatchSize) config.maxBatchSize = options.maxBatchSize;
  if (options.batchConcurrency) config.batchConcurrency = options.batchConcurrency;
  if (options.enableBatchProgress !== undefined)
    config.enableBatchProgress = options.enableBatchProgress;
  if (options.batchTimeoutSeconds) config.batchTimeoutSeconds = options.batchTimeoutSeconds;
  if (options.workerThreads) config.workerThreads = options.workerThreads;
  if (options.enableMemoryMonitoring !== undefined)
    config.enableMemoryMonitoring = options.enableMemoryMonitoring;
  if (options.memoryWarningThresholdMb)
    config.memoryWarningThresholdMb = options.memoryWarningThresholdMb;

  // Network settings
  if (options.requestTimeoutSeconds) config.requestTimeoutSeconds = options.requestTimeoutSeconds;
  if (options.maxRedirects) config.maxRedirects = options.maxRedirects;
  if (options.userAgent) config.userAgent = options.userAgent;
  if (options.connectTimeoutSeconds) config.connectTimeoutSeconds = options.connectTimeoutSeconds;
  if (options.readTimeoutSeconds) config.readTimeoutSeconds = options.readTimeoutSeconds;
  if (options.retryAttempts) config.retryAttempts = options.retryAttempts;
  if (options.retryBackoffSeconds) config.retryBackoffSeconds = options.retryBackoffSeconds;
  if (options.enableSslVerification !== undefined)
    config.enableSslVerification = options.enableSslVerification;
  if (options.proxyUrl) config.proxyUrl = options.proxyUrl;

  // Security settings
  if (options.enableCors !== undefined) config.enableCors = options.enableCors;
  if (options.corsOrigins) config.corsOrigins = options.corsOrigins;
  if (options.enableRateLimiting !== undefined)
    config.enableRateLimiting = options.enableRateLimiting;
  if (options.rateLimitRequestsPerMinute)
    config.rateLimitRequestsPerMinute = options.rateLimitRequestsPerMinute;
  if (options.enableRequestValidation !== undefined)
    config.enableRequestValidation = options.enableRequestValidation;
  if (options.maxRequestSizeMb) config.maxRequestSizeMb = options.maxRequestSizeMb;
  if (options.enableSanitization !== undefined)
    config.enableSanitization = options.enableSanitization;
  if (options.blockedDomains) config.blockedDomains = options.blockedDomains;
  if (options.allowedDomains) config.allowedDomains = options.allowedDomains;

  // Logging settings
  if (options.logLevel) config.logLevel = options.logLevel;
  if (options.logFormat) config.logFormat = options.logFormat;
  if (options.logFilePath) config.logFilePath = options.logFilePath;
  if (options.enablePerformanceLogging !== undefined)
    config.enablePerformanceLogging = options.enablePerformanceLogging;
  if (options.enableAccessLogging !== undefined)
    config.enableAccessLogging = options.enableAccessLogging;

  // Cache settings
  if (options.enableCaching !== undefined) config.enableCaching = options.enableCaching;
  if (options.cacheType) config.cacheType = options.cacheType;
  if (options.cacheTtlSeconds) config.cacheTtlSeconds = options.cacheTtlSeconds;
  if (options.cacheMaxSizeMb) config.cacheMaxSizeMb = options.cacheMaxSizeMb;
  if (options.enableModelCaching !== undefined)
    config.enableModelCaching = options.enableModelCaching;
  if (options.enableResultCaching !== undefined)
    config.enableResultCaching = options.enableResultCaching;

  // Development settings
  if (options.debugMode !== undefined) config.debugMode = options.debugMode;
  if (options.enableDebugLogging !== undefined)
    config.enableDebugLogging = options.enableDebugLogging;
  if (options.saveDebugImages !== undefined) config.saveDebugImages = options.saveDebugImages;
  if (options.debugImageDir) config.debugImageDir = options.debugImageDir;
  if (options.mockMode !== undefined) config.mockMode = options.mockMode;
  if (options.mockDelayMs) config.mockDelayMs = options.mockDelayMs;

  validateConfig(config);
  return config;
}

export function detectBestDevice(): DeviceType {
  // In a real implementation, this would check for CUDA/MPS availability
  // For now, we'll default to CPU since this is a TypeScript implementation
  // that likely won't have direct GPU access
  return 'cpu';
}

export function validateConfig(config: Config): void {
  if (!config.modelName || config.modelName.trim().length === 0) {
    throw new ValidationError('Model name is required');
  }

  if (!config.modelRevision || config.modelRevision.trim().length === 0) {
    throw new ValidationError('Model revision is required');
  }

  if (!['cpu', 'cuda', 'mps'].includes(config.device)) {
    throw new ValidationError('Invalid device type');
  }

  if (config.maxImageSize[0] <= 0 || config.maxImageSize[1] <= 0) {
    throw new ValidationError('Max image size must be positive');
  }

  if (config.maxFileSizeMb <= 0) {
    throw new ValidationError('Max file size must be positive');
  }

  if (config.timeoutSeconds <= 0) {
    throw new ValidationError('Timeout must be positive');
  }

  if (config.maxConcurrentRequests <= 0) {
    throw new ValidationError('Max concurrent requests must be positive');
  }

  if (config.maxBatchSize <= 0) {
    throw new ValidationError('Max batch size must be positive');
  }

  if (config.batchConcurrency <= 0) {
    throw new ValidationError('Batch concurrency must be positive');
  }

  if (config.requestTimeoutSeconds <= 0) {
    throw new ValidationError('Request timeout must be positive');
  }

  if (config.maxRedirects < 0) {
    throw new ValidationError('Max redirects cannot be negative');
  }
}

export function getDeviceInfo(config: Config): string {
  switch (config.device) {
    case 'cpu':
      return 'CPU (Universal compatibility)';
    case 'cuda':
      return 'CUDA (NVIDIA GPU acceleration)';
    case 'mps':
      return 'MPS (Apple Silicon GPU acceleration)';
    default:
      return 'Unknown device';
  }
}

export function createSecurityValidationConfig(config: Config): SecurityValidationConfig {
  return {
    allowedDomains: config.allowedDomains,
    blockedDomains: config.blockedDomains,
    maxPathLength: 2048,
    enableNetworkValidation: config.enableRequestValidation,
    enablePathTraversalCheck: config.enableSanitization,
    enableExecutableCheck: config.enableSanitization,
    enableContentTypeValidation: config.enableRequestValidation,
    maxFileSizeMb: config.maxFileSizeMb,
  };
}
