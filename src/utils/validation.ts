import { CaptionLength, Operation } from '../types/models';
import { ValidationError, ERROR_CODES } from '../types/errors';
import {
  isString,
  isNonEmptyString,
  isCaptionLength,
  isOperation,
  isObject,
  isArray,
} from './typeGuards';

export function validateImagePath(
  imagePath: unknown,
  config?: { allowedDomains?: string[]; blockedDomains?: string[]; maxPathLength?: number }
): string {
  if (!isNonEmptyString(imagePath)) {
    throw new ValidationError(
      'Image path is required and must be a non-empty string',
      ERROR_CODES.EMPTY_PATH
    );
  }

  const trimmed = imagePath.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Image path cannot be empty', ERROR_CODES.EMPTY_PATH);
  }

  const maxLength = config?.maxPathLength || 2048;
  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `Image path is too long (maximum ${maxLength} characters)`,
      ERROR_CODES.INVALID_PATH
    );
  }

  // Check if it's a URL or local path
  if (isUrlPath(trimmed)) {
    validateUrl(trimmed);

    // Apply domain filtering if configured
    if (config?.allowedDomains && config.allowedDomains.length > 0) {
      validateDomainWhitelist(trimmed, config.allowedDomains);
    }
    if (config?.blockedDomains && config.blockedDomains.length > 0) {
      validateDomainBlacklist(trimmed, config.blockedDomains);
    }
  } else {
    validateLocalPath(trimmed);
  }

  return trimmed;
}

export function validateCaptionLength(length: unknown): CaptionLength {
  if (!isString(length) || !length.trim()) {
    return 'normal'; // Default value
  }

  const trimmed = length.trim().toLowerCase();

  if (!isCaptionLength(trimmed)) {
    throw new ValidationError(`Invalid caption length. Must be one of: short, normal, detailed`);
  }

  return trimmed;
}

export function validateOperation(operation: unknown): Operation {
  if (!isNonEmptyString(operation)) {
    throw new ValidationError('Operation is required and must be a non-empty string');
  }

  const trimmed = operation.trim().toLowerCase();

  if (!isOperation(trimmed)) {
    throw new ValidationError(
      `Invalid operation. Must be one of: caption, query, detect, point, alt-text`
    );
  }

  return trimmed;
}

export function validateImagePathsList(pathsJson: unknown): string[] {
  if (!isNonEmptyString(pathsJson)) {
    throw new ValidationError('Image paths JSON is required and must be a non-empty string');
  }

  let paths: unknown;
  try {
    paths = JSON.parse(pathsJson);
  } catch {
    throw new ValidationError('Invalid JSON format for image paths');
  }

  if (!isArray(paths)) {
    throw new ValidationError('Image paths must be an array');
  }

  if (paths.length === 0) {
    throw new ValidationError('At least one image path is required');
  }

  if (paths.length > 10) {
    throw new ValidationError('Maximum 10 image paths allowed');
  }

  return paths.map(path => validateImagePath(path));
}

export function validateJsonParameters(paramsJson: unknown): Record<string, unknown> {
  if (!isString(paramsJson) || !paramsJson.trim()) {
    return {};
  }

  try {
    const params = JSON.parse(paramsJson);
    if (!isObject(params)) {
      throw new ValidationError('Parameters must be a valid JSON object');
    }
    return params;
  } catch {
    throw new ValidationError('Invalid JSON format for parameters');
  }
}

export function sanitizeString(
  value: unknown,
  maxLength: number = 1000,
  allowedChars: string = 'a-zA-Z0-9\\s\\-_.,!?'
): string {
  const stringValue = isString(value) ? value : String(value);

  let sanitized = stringValue.trim();

  // Remove potentially dangerous characters
  const regex = new RegExp(`[^${allowedChars}]`, 'g');
  sanitized = sanitized.replace(regex, '');

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

export function isUrlPath(path: string): boolean {
  try {
    const url = new URL(path);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ValidationError('URL must use HTTP or HTTPS protocol', ERROR_CODES.INVALID_URL);
    }

    // Enhanced security validation
    validateUrlSecurity(url);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL format', ERROR_CODES.INVALID_URL);
  }
}

function validateLocalPath(path: string): void {
  // Basic validation for local paths
  if (path.includes('..')) {
    throw new ValidationError('Path traversal not allowed', ERROR_CODES.DANGEROUS_CHARACTERS);
  }

  if (path.length > 512) {
    throw new ValidationError(
      'Local path is too long (maximum 512 characters)',
      ERROR_CODES.INVALID_PATH
    );
  }

  // Enhanced security checks for local paths
  validatePathTraversal(path);
  validateSystemPaths(path);
  validateExecutableExtensions(path);
}

export function validateQuestion(question: string): string {
  if (!question || typeof question !== 'string') {
    throw new ValidationError(
      'Question is required and must be a string',
      ERROR_CODES.MISSING_QUESTION
    );
  }

  const trimmed = question.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Question cannot be empty', ERROR_CODES.MISSING_QUESTION);
  }

  if (trimmed.length > 500) {
    throw new ValidationError(
      'Question is too long (max 500 characters)',
      ERROR_CODES.QUESTION_TOO_LONG
    );
  }

  // Check for dangerous characters
  validateNoDangerousCharacters(trimmed, 'question');

  return sanitizeSecureInput(trimmed);
}

export function validateObjectName(objectName: string): string {
  if (!objectName || typeof objectName !== 'string') {
    throw new ValidationError(
      'Object name is required and must be a string',
      ERROR_CODES.MISSING_OBJECT_NAME
    );
  }

  const trimmed = objectName.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Object name cannot be empty', ERROR_CODES.MISSING_OBJECT_NAME);
  }

  if (trimmed.length > 100) {
    throw new ValidationError(
      'Object name is too long (max 100 characters)',
      ERROR_CODES.OBJECT_NAME_TOO_LONG
    );
  }

  // Check for dangerous characters
  validateNoDangerousCharacters(trimmed, 'object name');

  return sanitizeSecureInput(trimmed);
}

export function validateNoDangerousCharacters(value: string, fieldName: string): void {
  const dangerousChars = ['<', '>', '"', "'", '&', '\0', '\r', '\n'];

  for (const char of dangerousChars) {
    if (value.includes(char)) {
      throw new ValidationError(
        `${fieldName} contains invalid characters`,
        ERROR_CODES.DANGEROUS_CHARACTERS,
        { dangerousCharacter: char, fieldName }
      );
    }
  }
}

export function sanitizeSecureInput(value: string): string {
  // Remove control characters except tab and newline (which we already check for)
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, '');
}

export function validateBatchSize(paths: string[], maxBatchSize: number = 50): void {
  if (paths.length === 0) {
    throw new ValidationError('Batch cannot be empty', ERROR_CODES.INVALID_IMAGE_PATHS);
  }

  if (paths.length > maxBatchSize) {
    throw new ValidationError(
      `Batch size ${paths.length} exceeds maximum ${maxBatchSize}`,
      ERROR_CODES.BATCH_SIZE_EXCEEDED,
      { batchSize: paths.length, maxBatchSize }
    );
  }
}

export function validateAndParseImagePaths(
  pathsJson: string,
  config?: { allowedDomains?: string[]; blockedDomains?: string[]; maxPathLength?: number }
): string[] {
  try {
    const paths = JSON.parse(pathsJson);
    if (!Array.isArray(paths)) {
      throw new ValidationError('Image paths must be an array', ERROR_CODES.INVALID_IMAGE_PATHS);
    }

    // Validate batch size
    validateBatchSize(paths);

    // Validate each path
    return paths.map(path => validateImagePath(path, config));
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      'Invalid JSON format for image paths',
      ERROR_CODES.INVALID_IMAGE_PATHS
    );
  }
}

// Enhanced security validation functions

export function validatePathTraversal(path: string): void {
  const dangerousPatterns = [
    /\.\./, // Directory traversal
    /\/\.\./, // Directory traversal with slash
    /\.\.\\/, // Directory traversal with backslash
    /~\//, // Home directory access
    /\$\{[^}]*\}/, // Variable expansion
    /\$\([^)]*\)/, // Command substitution
    /`[^`]*`/, // Backtick command substitution
    /\|/, // Pipe operator
    /;/, // Command separator
    /&/, // Background process
    />/, // Output redirection
    /</, // Input redirection
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(path)) {
      throw new ValidationError(
        `Path contains dangerous pattern: ${pattern.source}`,
        ERROR_CODES.DANGEROUS_CHARACTERS,
        { pattern: pattern.source, path }
      );
    }
  }
}

export function validateSystemPaths(path: string): void {
  const restrictedPaths = [
    '/etc/',
    '/proc/',
    '/sys/',
    '/dev/',
    '/root/',
    '/boot/',
    '/var/log/',
    '/usr/bin/',
    '/usr/sbin/',
    '/bin/',
    '/sbin/',
    'C:\\Windows\\',
    'C:\\Program Files\\',
    'C:\\System32\\',
    '%SYSTEMROOT%',
    '%PROGRAMFILES%',
    '%WINDIR%',
  ];

  const normalizedPath = path.toLowerCase().replace(/\\/g, '/');

  for (const restrictedPath of restrictedPaths) {
    if (normalizedPath.startsWith(restrictedPath.toLowerCase())) {
      throw new ValidationError(
        `Access to system path not allowed: ${restrictedPath}`,
        ERROR_CODES.PERMISSION_DENIED,
        { restrictedPath, requestedPath: path }
      );
    }
  }
}

export function validateExecutableExtensions(path: string): void {
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.scr',
    '.pif',
    '.sh',
    '.bash',
    '.zsh',
    '.fish',
    '.ps1',
    '.psm1',
    '.vbs',
    '.vba',
    '.js',
    '.jse',
    '.wsf',
    '.wsh',
    '.msi',
    '.deb',
    '.rpm',
    '.dmg',
    '.pkg',
    '.app',
    '.jar',
    '.py',
    '.rb',
    '.pl',
    '.php',
  ];

  const extension = path.toLowerCase().split('.').pop();
  if (extension && dangerousExtensions.includes(`.${extension}`)) {
    throw new ValidationError(
      `Executable file extension not allowed: .${extension}`,
      ERROR_CODES.DANGEROUS_CHARACTERS,
      { extension, path }
    );
  }
}

export function validateUrlSecurity(url: string): void {
  try {
    const parsedUrl = new URL(url);

    // Check for dangerous protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      throw new ValidationError(
        `Protocol not allowed: ${parsedUrl.protocol}`,
        ERROR_CODES.INVALID_URL,
        { protocol: parsedUrl.protocol, url }
      );
    }

    // Check for private/internal networks
    validateNetworkSecurity(parsedUrl.hostname);

    // Check for suspicious URL patterns
    validateSuspiciousUrlPatterns(url);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL format', ERROR_CODES.INVALID_URL);
  }
}

export function validateNetworkSecurity(hostname: string): void {
  // Private IP ranges and localhost
  const privateRanges = [
    /^127\./, // Localhost
    /^10\./, // Private Class A
    /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
    /^192\.168\./, // Private Class C
    /^169\.254\./, // Link-local
    /^::1$/, // IPv6 localhost
    /^fc00:/i, // IPv6 private
    /^fe80:/i, // IPv6 link-local
  ];

  const restrictedHosts = [
    'localhost',
    '0.0.0.0',
    'metadata.google.internal',
    '169.254.169.254', // Cloud metadata service
    'metadata.aws.com',
    'metadata.azure.com',
  ];

  // Check against private IP ranges
  for (const range of privateRanges) {
    if (range.test(hostname)) {
      throw new ValidationError(
        `Access to private network not allowed: ${hostname}`,
        ERROR_CODES.NETWORK_ERROR,
        { hostname, reason: 'private_network' }
      );
    }
  }

  // Check against restricted hostnames
  if (restrictedHosts.includes(hostname.toLowerCase())) {
    throw new ValidationError(
      `Access to restricted host not allowed: ${hostname}`,
      ERROR_CODES.NETWORK_ERROR,
      { hostname, reason: 'restricted_host' }
    );
  }
}

export function validateSuspiciousUrlPatterns(url: string): void {
  const suspiciousPatterns = [
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data URL
    /vbscript:/i, // VBScript protocol
    /file:/i, // File protocol
    /@/, // Potential credential injection
    /\.\.%2f/i, // URL-encoded path traversal
    /%2e%2e%2f/i, // Double URL-encoded path traversal
    /%252e%252e%252f/i, // Triple URL-encoded path traversal
    /script:/i, // Script protocols
    /\?.*\|/, // Query with pipe
    /\?.*;/, // Query with semicolon
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      throw new ValidationError(
        `URL contains suspicious pattern: ${pattern.source}`,
        ERROR_CODES.DANGEROUS_CHARACTERS,
        { pattern: pattern.source, url }
      );
    }
  }
}

export function validateContentType(contentType: string): void {
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/tif',
  ];

  if (!allowedImageTypes.includes(contentType.toLowerCase())) {
    throw new ValidationError(
      `Content type not allowed: ${contentType}`,
      ERROR_CODES.UNSUPPORTED_FORMAT,
      { contentType, allowedTypes: allowedImageTypes }
    );
  }
}

export function validateFileSize(size: number, maxSizeMb: number): void {
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (size > maxSizeBytes) {
    throw new ValidationError(
      `File size ${Math.round(size / 1024 / 1024)}MB exceeds maximum ${maxSizeMb}MB`,
      ERROR_CODES.FILE_TOO_LARGE,
      { sizeBytes: size, maxSizeBytes, sizeMb: Math.round(size / 1024 / 1024), maxSizeMb }
    );
  }

  if (size <= 0) {
    throw new ValidationError('File size must be greater than 0', ERROR_CODES.INVALID_PATH, {
      size,
    });
  }
}

export function validateDomainWhitelist(url: string, allowedDomains: string[]): void {
  if (allowedDomains.length === 0) {
    return; // No whitelist configured, allow all
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    const isAllowed = allowedDomains.some(domain => {
      const normalizedDomain = domain.toLowerCase();
      return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
    });

    if (!isAllowed) {
      throw new ValidationError(
        `Domain not in whitelist: ${hostname}`,
        ERROR_CODES.PERMISSION_DENIED,
        { hostname, allowedDomains }
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL for domain validation', ERROR_CODES.INVALID_URL);
  }
}

export function validateDomainBlacklist(url: string, blockedDomains: string[]): void {
  if (blockedDomains.length === 0) {
    return; // No blacklist configured
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    const isBlocked = blockedDomains.some(domain => {
      const normalizedDomain = domain.toLowerCase();
      return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
    });

    if (isBlocked) {
      throw new ValidationError(`Domain is blocked: ${hostname}`, ERROR_CODES.PERMISSION_DENIED, {
        hostname,
        blockedDomains,
      });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL for domain validation', ERROR_CODES.INVALID_URL);
  }
}

export function validateRateLimit(requestCount: number, limit: number, windowMs: number): void {
  if (requestCount > limit) {
    throw new ValidationError(
      `Rate limit exceeded: ${requestCount} requests in ${windowMs}ms window (limit: ${limit})`,
      ERROR_CODES.HTTP_ERROR,
      { requestCount, limit, windowMs }
    );
  }
}

export function sanitizeForLogging(value: unknown): string {
  const stringValue = isString(value) ? value : String(value);

  // Remove potential sensitive information
  return stringValue
    .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
    .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
    .replace(/key[=:]\s*[^\s&]+/gi, 'key=***')
    .replace(/secret[=:]\s*[^\s&]+/gi, 'secret=***')
    .replace(/authorization:\s*[^\r\n]+/gi, 'authorization: ***')
    .substring(0, 1000); // Limit log entry size
}
