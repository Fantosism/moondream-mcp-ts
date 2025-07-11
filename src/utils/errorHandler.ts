import { StandardError } from '../types/models';
import { MoondreamError } from '../types/errors';

// Type guard for Error objects
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type guard for objects with message property
function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

export function createErrorResponse(
  errorCode: string,
  errorMessage: string,
  operation?: string,
  imagePath?: string
): StandardError {
  return {
    success: false,
    errorMessage: sanitizeErrorMessage(errorMessage),
    errorCode,
    errorContext: {
      operation,
      imagePath,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    metadata: {
      operation,
      imagePath,
      timestamp: new Date().toISOString(),
      errorResponse: true,
    },
  };
}

export function sanitizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error.substring(0, 500); // Truncate long messages
  }

  if (isError(error)) {
    return error.message.substring(0, 500);
  }

  if (hasMessage(error)) {
    return error.message.substring(0, 500);
  }

  return 'Unknown error occurred';
}

export function getErrorCodeForException(error: unknown): string {
  if (error instanceof MoondreamError) {
    return error.errorCode;
  }

  if (!isError(error)) {
    return 'UNKNOWN_ERROR';
  }

  // Map common Node.js errors to codes
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return 'TIMEOUT_ERROR';
  }

  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return 'NETWORK_ERROR';
  }

  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return 'VALIDATION_ERROR';
  }

  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'INVALID_INPUT';
  }

  if (error.message.includes('ENOENT') || error.message.includes('file not found')) {
    return 'FILE_NOT_FOUND';
  }

  if (error.message.includes('EACCES') || error.message.includes('permission')) {
    return 'PERMISSION_DENIED';
  }

  return 'UNKNOWN_ERROR';
}

export function formatResultAsJson(result: any): string {
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return JSON.stringify({
      success: false,
      errorMessage: 'Failed to serialize result',
      errorCode: 'SERIALIZATION_ERROR',
    });
  }
}

export function createBatchSummary(
  results: Array<{ success: boolean }>,
  operation: string,
  totalTimeMs: number
): Record<string, unknown> {
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  return {
    operation,
    totalProcessed: results.length,
    totalSuccessful: successful,
    totalFailed: failed,
    totalProcessingTimeMs: totalTimeMs,
    successRate: results.length > 0 ? (successful / results.length) * 100 : 0,
    averageProcessingTimeMs: results.length > 0 ? totalTimeMs / results.length : 0,
  };
}

export function measureTimeMs(startTime: number): number {
  return Date.now() - startTime;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);
}
