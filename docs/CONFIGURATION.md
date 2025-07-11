# Configuration Guide

This guide covers all configuration options for the Moondream MCP TypeScript server built with the BOBA-T framework.

## Quick Start

The server supports three execution modes that can be configured via environment variables:

```bash
# Hybrid mode (recommended) - local with cloud fallback
export MOONDREAM_MODEL_MODE=hybrid
export MOONDREAM_API_KEY=your_api_key_here
export MOONDREAM_API_ENDPOINT=https://api.moondream.ai/v1

# Local mode only - no API key required
export MOONDREAM_MODEL_MODE=local

# Cloud mode only - requires API key
export MOONDREAM_MODEL_MODE=cloud
export MOONDREAM_API_KEY=your_api_key_here
export MOONDREAM_API_ENDPOINT=https://api.moondream.ai/v1
```

## Configuration Methods

### 1. Environment Variables (Recommended)

Set environment variables directly or use a `.env` file:

```bash
# Create .env file
cat > .env << EOF
MOONDREAM_MODEL_MODE=hybrid
MOONDREAM_API_KEY=your_api_key_here
MOONDREAM_MODEL_NAME=vikhyatk/moondream2
MOONDREAM_DEVICE=cpu
EOF

# Run the server
npm run mcp
```

### 2. Programmatic Configuration

```typescript
import { createConfig } from './src/utils/configManager';

const config = createConfig({
  modelMode: 'hybrid',
  apiKey: 'your_api_key_here',
  modelName: 'vikhyatk/moondream2',
  device: 'cpu',
  maxConcurrentRequests: 10
});
```

## Complete Configuration Reference

### Model Execution Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_MODEL_MODE` | `hybrid` | Execution mode: `local`, `cloud`, or `hybrid` |
| `MOONDREAM_API_KEY` | - | API key for cloud/hybrid modes |
| `MOONDREAM_API_ENDPOINT` | `https://api.moondream.ai/v1` | Cloud API endpoint |

### Local Model Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_MODEL_NAME` | `vikhyatk/moondream2` | HuggingFace model identifier |
| `MOONDREAM_MODEL_REVISION` | `2025-01-09` | Model version/revision |
| `MOONDREAM_TRUST_REMOTE_CODE` | `true` | Allow remote code execution |
| `MOONDREAM_MODEL_CACHE_DIR` | `/tmp/moondream_models` | Local model cache directory |
| `MOONDREAM_MODEL_DOWNLOAD_TIMEOUT_SECONDS` | `300` | Model download timeout |
| `MOONDREAM_MODEL_LOAD_TIMEOUT_SECONDS` | `120` | Model loading timeout |
| `MOONDREAM_ENABLE_MODEL_WARMUP` | `true` | Pre-warm model after loading |
| `MOONDREAM_MODEL_WARMUP_TIMEOUT_SECONDS` | `30` | Model warmup timeout |

### Device and Hardware Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_DEVICE` | `cpu` | Compute device: `cpu`, `cuda`, `mps`, or `auto` |
| `MOONDREAM_GPU_MEMORY_FRACTION` | `0.8` | GPU memory fraction to use |
| `MOONDREAM_MEMORY_LIMIT_MB` | `4096` | Memory limit in MB |
| `MOONDREAM_WORKER_THREADS` | `4` | Number of worker threads |

### Image Processing Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_MAX_IMAGE_SIZE` | `2048` | Maximum image dimension (pixels) |
| `MOONDREAM_MAX_FILE_SIZE_MB` | `50` | Maximum file size in MB |
| `MOONDREAM_MAX_IMAGE_PIXELS` | `33177600` | Maximum total pixels (30MP) |
| `MOONDREAM_IMAGE_PREPROCESSING_ENABLED` | `true` | Enable image preprocessing |
| `MOONDREAM_IMAGE_RESIZE_QUALITY` | `high` | Resize quality: `low`, `medium`, `high` |
| `MOONDREAM_IMAGE_COMPRESSION_QUALITY` | `85` | JPEG compression quality (1-100) |
| `MOONDREAM_ENABLE_IMAGE_OPTIMIZATION` | `true` | Enable image optimization |

### Performance Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_TIMEOUT_SECONDS` | `120` | Default operation timeout |
| `MOONDREAM_MAX_CONCURRENT_REQUESTS` | `5` | Maximum concurrent requests |
| `MOONDREAM_ENABLE_STREAMING` | `true` | Enable streaming responses |
| `MOONDREAM_MAX_BATCH_SIZE` | `10` | Maximum batch size |
| `MOONDREAM_BATCH_CONCURRENCY` | `3` | Batch processing concurrency |
| `MOONDREAM_ENABLE_BATCH_PROGRESS` | `true` | Enable batch progress reporting |
| `MOONDREAM_BATCH_TIMEOUT_SECONDS` | `600` | Batch operation timeout |
| `MOONDREAM_ENABLE_MEMORY_MONITORING` | `true` | Enable memory monitoring |
| `MOONDREAM_MEMORY_WARNING_THRESHOLD_MB` | `3072` | Memory warning threshold |

### Network Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_REQUEST_TIMEOUT_SECONDS` | `30` | HTTP request timeout |
| `MOONDREAM_MAX_REDIRECTS` | `5` | Maximum HTTP redirects |
| `MOONDREAM_USER_AGENT` | `Moondream-MCP-TS/1.0.0` | HTTP User-Agent header |
| `MOONDREAM_CONNECT_TIMEOUT_SECONDS` | `10` | Connection timeout |
| `MOONDREAM_READ_TIMEOUT_SECONDS` | `30` | Read timeout |
| `MOONDREAM_RETRY_ATTEMPTS` | `3` | Number of retry attempts |
| `MOONDREAM_RETRY_BACKOFF_SECONDS` | `2` | Retry backoff delay |
| `MOONDREAM_ENABLE_SSL_VERIFICATION` | `true` | Enable SSL certificate verification |
| `MOONDREAM_PROXY_URL` | - | HTTP proxy URL |

### Security Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_ENABLE_CORS` | `false` | Enable CORS headers |
| `MOONDREAM_CORS_ORIGINS` | - | Allowed CORS origins (comma-separated) |
| `MOONDREAM_ENABLE_RATE_LIMITING` | `true` | Enable rate limiting |
| `MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE` | `60` | Rate limit per minute |
| `MOONDREAM_ENABLE_REQUEST_VALIDATION` | `true` | Enable request validation |
| `MOONDREAM_MAX_REQUEST_SIZE_MB` | `100` | Maximum request size |
| `MOONDREAM_ENABLE_SANITIZATION` | `true` | Enable input sanitization |
| `MOONDREAM_BLOCKED_DOMAINS` | - | Blocked domains (comma-separated) |
| `MOONDREAM_ALLOWED_DOMAINS` | - | Allowed domains (comma-separated) |

### Logging Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `MOONDREAM_LOG_FORMAT` | `structured` | Log format: `json`, `text`, `structured` |
| `MOONDREAM_LOG_FILE_PATH` | - | Log file path (optional) |
| `MOONDREAM_ENABLE_PERFORMANCE_LOGGING` | `true` | Enable performance logging |
| `MOONDREAM_ENABLE_ACCESS_LOGGING` | `true` | Enable access logging |

### Caching Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_ENABLE_CACHING` | `true` | Enable result caching |
| `MOONDREAM_CACHE_TYPE` | `memory` | Cache type: `memory`, `redis`, `file` |
| `MOONDREAM_CACHE_TTL_SECONDS` | `3600` | Cache TTL in seconds |
| `MOONDREAM_CACHE_MAX_SIZE_MB` | `1024` | Maximum cache size |
| `MOONDREAM_ENABLE_MODEL_CACHING` | `true` | Enable model caching |
| `MOONDREAM_ENABLE_RESULT_CACHING` | `false` | Enable result caching |

### Development Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONDREAM_DEBUG_MODE` | `false` | Enable debug mode |
| `MOONDREAM_ENABLE_DEBUG_LOGGING` | `false` | Enable debug logging |
| `MOONDREAM_SAVE_DEBUG_IMAGES` | `false` | Save debug images |
| `MOONDREAM_DEBUG_IMAGE_DIR` | `/tmp/debug_images` | Debug image directory |
| `MOONDREAM_MOCK_MODE` | `false` | Enable mock mode for testing |
| `MOONDREAM_MOCK_DELAY_MS` | `100` | Mock response delay |

## Configuration Examples

### Local Development Setup

```bash
# .env for local development
MOONDREAM_MODEL_MODE=local
MOONDREAM_DEVICE=cpu
MOONDREAM_DEBUG_MODE=true
MOONDREAM_LOG_LEVEL=debug
MOONDREAM_ENABLE_DEBUG_LOGGING=true
MOONDREAM_MAX_CONCURRENT_REQUESTS=2
```

### Production Cloud Setup

```bash
# .env for production with cloud execution
MOONDREAM_MODEL_MODE=cloud
MOONDREAM_API_KEY=prod_api_key_here
MOONDREAM_API_ENDPOINT=https://api.moondream.ai/v1
MOONDREAM_LOG_LEVEL=info
MOONDREAM_ENABLE_PERFORMANCE_LOGGING=true
MOONDREAM_ENABLE_RATE_LIMITING=true
MOONDREAM_MAX_CONCURRENT_REQUESTS=10
MOONDREAM_ENABLE_CACHING=true
```

### High-Performance Hybrid Setup

```bash
# .env for high-performance hybrid setup
MOONDREAM_MODEL_MODE=hybrid
MOONDREAM_API_KEY=your_api_key_here
MOONDREAM_DEVICE=cuda
MOONDREAM_GPU_MEMORY_FRACTION=0.9
MOONDREAM_MAX_CONCURRENT_REQUESTS=20
MOONDREAM_BATCH_CONCURRENCY=5
MOONDREAM_ENABLE_MEMORY_MONITORING=true
MOONDREAM_CACHE_TYPE=redis
MOONDREAM_ENABLE_RESULT_CACHING=true
```

## Validation

The server validates all configuration on startup. Invalid configurations will result in clear error messages:

```bash
# Example validation error
❌ Configuration Error: MOONDREAM_MODEL_MODE must be one of: local, cloud, hybrid
❌ Configuration Error: MOONDREAM_API_KEY is required when MODEL_MODE is 'cloud' or 'hybrid'
❌ Configuration Error: MOONDREAM_MAX_IMAGE_SIZE must be a positive number
```

## Environment Detection

The server can auto-detect optimal settings:

- **Device detection**: `MOONDREAM_DEVICE=auto` detects available hardware
- **Memory limits**: Auto-detects system memory if not specified
- **Worker threads**: Defaults to CPU core count

## Monitoring Configuration

Use the built-in health checking and monitoring:

```typescript
// Check configuration status
const status = client.getStatus();
console.log('Configuration:', status);

// Perform health check
const health = await client.performHealthCheck();
console.log('Health:', health);
```

## BOBA-T Framework Configuration

The BOBA-T framework provides additional configuration for the 3-phase handler lifecycle:

- **Validation Phase**: Configured via security and validation settings
- **Processing Phase**: Configured via model and performance settings  
- **Response Phase**: Configured via logging and error handling settings

This ensures type-safe, predictable request processing with comprehensive error handling throughout the entire pipeline.