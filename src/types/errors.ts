export class MoondreamError extends Error {
  public readonly errorCode: string;
  public readonly errorContext: Record<string, unknown>;

  constructor(message: string, errorCode: string, errorContext: Record<string, unknown> = {}) {
    super(message);
    this.name = 'MoondreamError';
    this.errorCode = errorCode;
    this.errorContext = errorContext;
  }
}

export class ModelLoadError extends MoondreamError {
  constructor(message: string, errorContext: Record<string, unknown> = {}) {
    super(message, 'MODEL_LOAD_ERROR', errorContext);
    this.name = 'ModelLoadError';
  }
}

export class ModelNotLoadedError extends MoondreamError {
  constructor(message: string, errorContext: Record<string, any> = {}) {
    super(message, 'MODEL_NOT_LOADED_ERROR', errorContext);
    this.name = 'ModelNotLoadedError';
  }
}

export class ImageProcessingError extends MoondreamError {
  constructor(message: string, errorContext: Record<string, unknown> = {}) {
    super(message, 'IMAGE_PROCESSING_ERROR', errorContext);
    this.name = 'ImageProcessingError';
  }
}

export class InferenceError extends MoondreamError {
  constructor(message: string, errorContext: Record<string, unknown> = {}) {
    super(message, 'INFERENCE_ERROR', errorContext);
    this.name = 'InferenceError';
  }
}

export class ValidationError extends MoondreamError {
  constructor(message: string, errorCode: string = 'VALIDATION_ERROR', errorContext: Record<string, unknown> = {}) {
    super(message, errorCode, errorContext);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends MoondreamError {
  constructor(message: string, errorContext: Record<string, unknown> = {}) {
    super(message, 'NETWORK_ERROR', errorContext);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends MoondreamError {
  constructor(message: string, errorContext: Record<string, unknown> = {}) {
    super(message, 'TIMEOUT_ERROR', errorContext);
    this.name = 'TimeoutError';
  }
}

// Comprehensive error codes matching Python implementation
export const ERROR_CODES = {
  // Path and file errors
  EMPTY_PATH: 'EMPTY_PATH',
  INVALID_PATH: 'INVALID_PATH',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_QUESTION: 'MISSING_QUESTION',
  MISSING_OBJECT_NAME: 'MISSING_OBJECT_NAME',
  QUESTION_TOO_LONG: 'QUESTION_TOO_LONG',
  OBJECT_NAME_TOO_LONG: 'OBJECT_NAME_TOO_LONG',
  INVALID_OPERATION: 'INVALID_OPERATION',
  INVALID_LENGTH: 'INVALID_LENGTH',
  DANGEROUS_CHARACTERS: 'DANGEROUS_CHARACTERS',
  
  // Batch processing errors
  BATCH_SIZE_EXCEEDED: 'BATCH_SIZE_EXCEEDED',
  INVALID_IMAGE_PATHS: 'INVALID_IMAGE_PATHS',
  BATCH_OPERATION_ERROR: 'BATCH_OPERATION_ERROR',
  BATCH_PROCESSING_ERROR: 'BATCH_PROCESSING_ERROR',
  
  // Network and URL errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_URL: 'INVALID_URL',
  URL_TIMEOUT: 'URL_TIMEOUT',
  HTTP_ERROR: 'HTTP_ERROR',
  
  // Image processing errors
  IMAGE_PROCESSING_ERROR: 'IMAGE_PROCESSING_ERROR',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  IMAGE_DECODE_ERROR: 'IMAGE_DECODE_ERROR',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  
  // Model and inference errors
  MODEL_LOAD_ERROR: 'MODEL_LOAD_ERROR',
  MODEL_NOT_LOADED_ERROR: 'MODEL_NOT_LOADED_ERROR',
  INFERENCE_ERROR: 'INFERENCE_ERROR',
  OPERATION_ERROR: 'OPERATION_ERROR',
  
  // Generic errors
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Standardized error response interface
export interface StandardErrorResponse {
  success: false;
  error_message: string;
  error_code: ErrorCode;
  error_context?: Record<string, unknown>;
  timestamp: string;
  operation?: string;
}

// Factory function for creating standardized error responses
export function createStandardError(
  errorCode: ErrorCode,
  message: string,
  operation?: string,
  context?: Record<string, unknown>
): StandardErrorResponse {
  return {
    success: false,
    error_message: message,
    error_code: errorCode,
    error_context: context,
    timestamp: new Date().toISOString(),
    operation,
  };
}
