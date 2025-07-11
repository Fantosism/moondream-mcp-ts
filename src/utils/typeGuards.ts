/**
 * Type guard utilities for runtime type checking
 */

import { CaptionLength, AltTextStyle, Operation, DeviceType } from '@/types/models';

// Primitive type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

// Domain-specific type guards
export function isCaptionLength(value: unknown): value is CaptionLength {
  return isString(value) && ['short', 'normal', 'detailed'].includes(value);
}

export function isAltTextStyle(value: unknown): value is AltTextStyle {
  return isString(value) && ['concise', 'descriptive', 'detailed'].includes(value);
}

export function isOperation(value: unknown): value is Operation {
  return isString(value) && ['caption', 'query', 'detect', 'point', 'alt-text'].includes(value);
}

export function isDeviceType(value: unknown): value is DeviceType {
  return isString(value) && ['cpu', 'cuda', 'mps', 'webgpu'].includes(value);
}

// Error type guards
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function hasMessage(value: unknown): value is { message: string } {
  return isObject(value) && 'message' in value && isString(value.message);
}

export function hasErrorCode(value: unknown): value is { errorCode: string } {
  return isObject(value) && 'errorCode' in value && isString(value.errorCode);
}

// Utility type guards
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

export function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= min && value <= max;
}

export function isFloatInRange(value: unknown, min: number, max: number): value is number {
  return isNumber(value) && value >= min && value <= max;
}

// JSON type guards
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  
  try {
    JSON.parse(JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function isValidJson(value: unknown): value is Record<string, unknown> | unknown[] {
  if (!isString(value)) return false;
  
  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) || isArray(parsed);
  } catch {
    return false;
  }
}

// URL type guards
export function isUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isHttpUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  
  try {
    const url = new URL(value);
    return url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isHttpsUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

// File path type guards
export function isValidFilePath(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  // Basic file path validation
  const dangerousPatterns = [
    /\.\./,           // Directory traversal
    /\/\.\./,         // Directory traversal with slash
    /\.\.\\/,         // Directory traversal with backslash
    /~\//,            // Home directory access
    /\$\{[^}]*\}/,    // Variable expansion
    /\$\([^)]*\)/,    // Command substitution
    /`[^`]*`/,        // Backtick command substitution
    /\|/,             // Pipe operator
    /;/,              // Command separator
    /&/,              // Background process
    />/,              // Output redirection
    /</,              // Input redirection
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(value));
}

// Image format type guards
export function isSupportedImageFormat(value: unknown): value is string {
  if (!isString(value)) return false;
  
  const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'tif'];
  return supportedFormats.includes(value.toLowerCase());
}

// Content type guards
export function isImageContentType(value: unknown): value is string {
  if (!isString(value)) return false;
  
  const imageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/tif'
  ];
  
  return imageTypes.includes(value.toLowerCase());
}

// Buffer type guards
export function isBuffer(value: unknown): value is Buffer {
  return Buffer.isBuffer(value);
}

export function isValidImageBuffer(value: unknown): value is Buffer {
  if (!isBuffer(value)) return false;
  
  // Check for common image format headers
  if (value.length < 4) return false;
  
  // PNG signature
  if (value[0] === 0x89 && value[1] === 0x50 && value[2] === 0x4E && value[3] === 0x47) {
    return true;
  }
  
  // JPEG signature
  if (value[0] === 0xFF && value[1] === 0xD8) {
    return true;
  }
  
  // WebP signature
  if (value.length >= 12 && 
      value.slice(0, 4).toString() === 'RIFF' && 
      value.slice(8, 12).toString() === 'WEBP') {
    return true;
  }
  
  // BMP signature
  if (value[0] === 0x42 && value[1] === 0x4D) {
    return true;
  }
  
  // TIFF signatures
  if ((value[0] === 0x49 && value[1] === 0x49) || 
      (value[0] === 0x4D && value[1] === 0x4D)) {
    return true;
  }
  
  return false;
}

// Assertion helpers
export function assertIsString(value: unknown, errorMessage?: string): asserts value is string {
  if (!isString(value)) {
    throw new Error(errorMessage || `Expected string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown, errorMessage?: string): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(errorMessage || `Expected number, got ${typeof value}`);
  }
}

export function assertIsBoolean(value: unknown, errorMessage?: string): asserts value is boolean {
  if (!isBoolean(value)) {
    throw new Error(errorMessage || `Expected boolean, got ${typeof value}`);
  }
}

export function assertIsObject(value: unknown, errorMessage?: string): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(errorMessage || `Expected object, got ${typeof value}`);
  }
}

export function assertIsArray(value: unknown, errorMessage?: string): asserts value is unknown[] {
  if (!isArray(value)) {
    throw new Error(errorMessage || `Expected array, got ${typeof value}`);
  }
}

// Result type guards for MCP operations
export function isCaptionResult(value: unknown): value is { caption: string; confidence?: number } {
  return isObject(value) && 'caption' in value && isString(value.caption);
}

export function isQueryResult(value: unknown): value is { answer: string; confidence?: number } {
  return isObject(value) && 'answer' in value && isString(value.answer);
}

export function isDetectionResult(value: unknown): value is { objects: unknown[]; totalFound: number } {
  return isObject(value) && 'objects' in value && isArray(value.objects) && 
         'totalFound' in value && isNumber(value.totalFound);
}

export function isPointingResult(value: unknown): value is { points: unknown[]; totalFound: number } {
  return isObject(value) && 'points' in value && isArray(value.points) && 
         'totalFound' in value && isNumber(value.totalFound);
}

export function isAltTextResult(value: unknown): value is { altText: string; wordCount?: number } {
  return isObject(value) && 'altText' in value && isString(value.altText);
}

// Analysis result type guard
export function isAnalysisResult(value: unknown): value is { success: boolean; errorMessage?: string; processingTimeMs?: number } {
  return isObject(value) && 'success' in value && isBoolean(value.success);
}