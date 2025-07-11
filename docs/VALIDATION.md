# Input Validation and Security Guidelines

This document outlines the comprehensive input validation and security measures implemented in the Moondream MCP TypeScript server.

## Overview

The Moondream MCP server implements multiple layers of security validation to ensure safe and reliable operation:

- **Input Validation**: Comprehensive type checking and sanitization
- **Path Security**: Protection against path traversal attacks
- **Network Security**: Domain filtering and SSL verification
- **Image Security**: Format validation and size limits
- **Error Handling**: Sanitized error messages to prevent information disclosure

## Input Validation

### Image Path Validation

All image paths undergo strict validation:

```typescript
// Path validation with security checks
export function validateImagePath(path: string): boolean {
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('~')) {
    return false;
  }
  
  // Validate file extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];
  const extension = path.toLowerCase().split('.').pop();
  return validExtensions.includes(`.${extension}`);
}
```

### URL Validation

Network requests are validated for security:

```typescript
// URL validation with domain filtering
export function validateUrl(url: string, config: SecurityValidationConfig): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Check blocked domains
    if (config.blockedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return false;
    }
    
    // Check allowed domains (if specified)
    if (config.allowedDomains.length > 0) {
      return config.allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
    }
    
    return true;
  } catch {
    return false;
  }
}
```

## Security Configuration

### Environment Variables

All configuration through environment variables with validation:

```bash
# Security settings
MOONDREAM_ENABLE_REQUEST_VALIDATION=true
MOONDREAM_ENABLE_SANITIZATION=true
MOONDREAM_MAX_REQUEST_SIZE_MB=100
MOONDREAM_BLOCKED_DOMAINS=malicious.com,spam.net
MOONDREAM_ALLOWED_DOMAINS=trusted.com,safe.org
```

### File Size Limits

Configurable limits prevent resource exhaustion:

```typescript
// File size validation
export function validateFileSize(buffer: Buffer, maxSizeMb: number): boolean {
  const fileSizeMb = buffer.length / (1024 * 1024);
  return fileSizeMb <= maxSizeMb;
}
```

### Image Format Validation

Only supported image formats are accepted:

```typescript
// Supported formats validation
export function validateImageFormat(format: string, supportedFormats: string[]): void {
  if (!supportedFormats.includes(format)) {
    throw new ValidationError(`Unsupported image format: ${format}`);
  }
}
```

## Network Security

### SSL/TLS Verification

SSL certificate verification is enabled by default:

```typescript
// SSL verification configuration
MOONDREAM_ENABLE_SSL_VERIFICATION=true
```

### Request Timeouts

All network requests have configurable timeouts:

```typescript
// Network timeout configuration
MOONDREAM_REQUEST_TIMEOUT_SECONDS=30
MOONDREAM_CONNECT_TIMEOUT_SECONDS=10
MOONDREAM_READ_TIMEOUT_SECONDS=30
```

### Rate Limiting

Built-in rate limiting prevents abuse:

```typescript
// Rate limiting configuration
MOONDREAM_ENABLE_RATE_LIMITING=true
MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

## Error Handling

### Sanitized Error Messages

Error messages are sanitized to prevent information disclosure:

```typescript
// Error message sanitization
export function sanitizeErrorMessage(error: Error): string {
  // Remove sensitive information like file paths
  return error.message
    .replace(/\/[^\s]*/g, '[PATH]') // Remove file paths
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Remove IP addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]'); // Remove emails
}
```

### Structured Error Types

Custom error types for better error handling:

```typescript
// Error type definitions
export class ValidationError extends Error {
  constructor(message: string, public code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message: string, public code: string = 'SECURITY_ERROR') {
    super(message);
    this.name = 'SecurityError';
  }
}
```

## Content Security

### Image Processing Security

Images are processed with security considerations:

```typescript
// Secure image processing
export async function processImageSecurely(buffer: Buffer, config: Config): Promise<ImageBuffer> {
  // Validate image format before processing
  const metadata = await sharp(buffer).metadata();
  validateImageFormat(metadata.format?.toUpperCase() || 'UNKNOWN', config.supportedFormats);
  
  // Limit image dimensions
  if (metadata.width && metadata.height) {
    const maxPixels = config.maxImagePixels;
    if (metadata.width * metadata.height > maxPixels) {
      throw new ValidationError(`Image too large: ${metadata.width}x${metadata.height} pixels`);
    }
  }
  
  // Process with security constraints
  return processImage(buffer, config);
}
```

### Path Traversal Protection

All file operations are protected against path traversal:

```typescript
// Path traversal protection
export function sanitizePath(inputPath: string): string {
  // Resolve path and ensure it's within allowed boundaries
  const resolvedPath = path.resolve(inputPath);
  const basePath = path.resolve(process.cwd());
  
  if (!resolvedPath.startsWith(basePath)) {
    throw new SecurityError('Path traversal attempt detected');
  }
  
  return resolvedPath;
}
```

## API Security

### Authentication

Cloud API requests use proper authentication:

```typescript
// API authentication
headers: {
  'X-Moondream-Auth': config.apiKey,
  'Content-Type': 'application/json',
}
```

### Request Validation

All API requests are validated before processing:

```typescript
// Request validation middleware
export function validateRequest(req: any, config: Config): void {
  // Check request size
  if (req.body && Buffer.byteLength(JSON.stringify(req.body)) > config.maxRequestSizeMb * 1024 * 1024) {
    throw new ValidationError('Request too large');
  }
  
  // Validate required fields
  if (!req.imagePath && !req.imageUrl) {
    throw new ValidationError('Image path or URL required');
  }
  
  // Sanitize inputs
  if (config.enableSanitization) {
    req.imagePath = sanitizePath(req.imagePath);
  }
}
```

## Security Best Practices

### 1. Principle of Least Privilege

- Only required permissions are granted
- File system access is restricted to necessary directories
- Network access is limited to allowed domains

### 2. Defense in Depth

- Multiple validation layers
- Input sanitization at multiple points
- Error handling at all levels

### 3. Fail Securely

- Secure defaults (SSL verification enabled)
- Graceful degradation when validation fails
- No sensitive information in error messages

### 4. Regular Security Updates

- Keep dependencies updated
- Monitor for security vulnerabilities
- Update validation rules as needed

## Configuration Examples

### High Security Configuration

```bash
# Maximum security settings
MOONDREAM_ENABLE_REQUEST_VALIDATION=true
MOONDREAM_ENABLE_SANITIZATION=true
MOONDREAM_ENABLE_SSL_VERIFICATION=true
MOONDREAM_MAX_REQUEST_SIZE_MB=10
MOONDREAM_MAX_FILE_SIZE_MB=5
MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE=30
MOONDREAM_BLOCKED_DOMAINS=0.0.0.0/8,10.0.0.0/8,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.168.0.0/16
```

### Development Configuration

```bash
# Development settings with relaxed security
MOONDREAM_ENABLE_REQUEST_VALIDATION=true
MOONDREAM_ENABLE_SANITIZATION=false
MOONDREAM_ENABLE_SSL_VERIFICATION=false
MOONDREAM_MAX_REQUEST_SIZE_MB=100
MOONDREAM_MAX_FILE_SIZE_MB=50
MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE=120
```

## Monitoring and Logging

### Security Event Logging

Security events are logged for monitoring:

```typescript
// Security event logging
logger.security('Validation failed', {
  type: 'path_traversal_attempt',
  path: sanitizeErrorMessage(inputPath),
  timestamp: new Date().toISOString(),
  severity: 'high'
});
```

### Performance Monitoring

Monitor for potential security issues:

```typescript
// Performance monitoring for security
logger.performance('Request processing time', {
  operation: 'image_validation',
  duration: Date.now() - startTime,
  fileSize: buffer.length,
  result: 'success'
});
```

## Compliance and Standards

### Data Protection

- No sensitive data is logged
- Error messages are sanitized
- File paths are anonymized in logs

### Industry Standards

- Follows OWASP security guidelines
- Implements common security headers
- Uses secure communication protocols

## Validation Checklist

Before deploying, ensure:

- [ ] All input validation is enabled
- [ ] SSL verification is enabled for production
- [ ] Rate limiting is configured appropriately
- [ ] File size limits are set
- [ ] Domain filtering is configured
- [ ] Error messages are sanitized
- [ ] Security logging is enabled
- [ ] Dependencies are up to date
- [ ] Configuration is reviewed for security

## Support and Updates

For security issues or questions:

1. Review this documentation
2. Check configuration settings
3. Monitor security logs
4. Keep dependencies updated
5. Follow security best practices

Regular security audits and updates are recommended to maintain the highest level of security.