# Moondream MCP Server - TypeScript Implementation

A production-ready Model Context Protocol (MCP) server for the Moondream vision language model, built with the BOBA-T framework and featuring hybrid local/cloud execution capabilities.

## 🚀 Features

### 🔧 **Complete MCP Integration**

- ✅ Full MCP SDK implementation with stdio transport
- ✅ 6 comprehensive MCP tools for all image analysis operations
- ✅ 4 MCP resources with configuration and model information
- ✅ Type-safe request/response handling with validation
- ✅ BOBA-T framework integration for robust workflow processing ([BOBA-T](https://github.com/Fantosism/boba))

### 🖼️ **Image Analysis Operations**

- **Caption Generation**: Generate descriptive captions (short/normal/detailed)
- **Visual Q&A**: Ask questions about image content with natural language
- **Object Detection**: Detect and locate specific objects with bounding boxes
- **Object Pointing**: Find coordinate points for objects in images
- **Alt-Text Generation**: Create accessibility-focused descriptions for screen readers
- **Batch Processing**: Process multiple images with any operation in parallel

### 🏗️ **Architecture & Technology**

- **BOBA-T Framework**: Type-safe workflow development with 3-phase handler lifecycle ([BOBA-T](https://github.com/Fantosism/boba))
- **Hybrid Model Execution**: Local (Transformers.js) + Cloud API with intelligent fallback
- **Real Image Processing**: Sharp library for high-performance image processing
- **Comprehensive Type System**: Full TypeScript support with proper error handling
- **Pipeline Orchestration**: Modular BOBA-T handlers with proper error propagation
- **Health Monitoring**: Continuous model health checks and performance monitoring
- **Security**: Input validation, path traversal protection, and rate limiting

### 🔒 **Security & Production Features**

- **Input Validation**: Comprehensive validation with type guards
- **Path Security**: Protection against path traversal attacks
- **Image Security**: Format validation and size limits
- **Network Security**: Domain filtering and private network blocking
- **Error Handling**: Structured error responses with detailed context
- **Performance Monitoring**: Built-in metrics and health checks
- **Resource Management**: Memory monitoring and cleanup

### 🌐 **Deployment Options**

- **Local Mode**: Complete privacy with local model execution
- **Cloud Mode**: Scalable cloud API integration
- **Hybrid Mode**: Best of both worlds with automatic failover
- **Docker Support**: Containerized deployment with Docker
- **Environment Configuration**: Flexible configuration via environment variables

## 📦 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- (Optional) Docker for containerized deployment

### Installation

```bash
git clone https://github.com/Fantosism/moondream-mcp-ts.git
cd moondream-mcp-ts
npm install
```

### Configuration

Choose your execution mode by setting environment variables:

```bash
# Local execution (requires model download)
export MOONDREAM_MODEL_MODE=local

# Cloud API execution (requires API key)
export MOONDREAM_MODEL_MODE=cloud
export MOONDREAM_API_KEY=your_api_key
export MOONDREAM_API_ENDPOINT=https://api.moondream.ai/v1

# Hybrid mode (local with cloud fallback) - Recommended
export MOONDREAM_MODEL_MODE=hybrid
export MOONDREAM_API_KEY=your_api_key
export MOONDREAM_API_ENDPOINT=https://api.moondream.ai/v1
```

### Start MCP Server

```bash
npm run mcp
```

The server will start and listen on stdio for MCP protocol messages. The BOBA-T framework handles the 3-phase lifecycle for each request.

## 🛠️ Available MCP Tools

### 1. `caption_image`

Generate descriptive captions for images with configurable length.

```json
{
  "name": "caption_image",
  "arguments": {
    "image_path": "https://example.com/image.jpg",
    "length": "normal",
    "stream": false
  }
}
```

**Response includes:**

- Generated caption text
- Confidence score (0.0-1.0)
- Processing time in milliseconds
- Image metadata (format, size, etc.)

### 2. `query_image`

Ask questions about image content using visual Q&A.

```json
{
  "name": "query_image",
  "arguments": {
    "image_path": "https://example.com/image.jpg",
    "question": "What objects are in this image?"
  }
}
```

**Response includes:**

- Natural language answer
- Original question
- Confidence score
- Processing metadata

### 3. `detect_objects`

Detect and locate specific objects with bounding boxes.

```json
{
  "name": "detect_objects",
  "arguments": {
    "image_path": "https://example.com/image.jpg",
    "object_name": "person"
  }
}
```

**Response includes:**

- Array of detected objects
- Confidence scores for each detection
- Normalized bounding box coordinates (0.0-1.0)
- Total count of found objects

### 4. `point_objects`

Find coordinate points for objects in images.

```json
{
  "name": "point_objects",
  "arguments": {
    "image_path": "https://example.com/image.jpg",
    "object_name": "car"
  }
}
```

**Response includes:**

- Array of point coordinates
- Confidence scores
- Normalized coordinates (0.0-1.0)
- Total count of found objects

### 5. `generate_alt_text`

Generate accessibility-focused alt-text descriptions.

```json
{
  "name": "generate_alt_text",
  "arguments": {
    "image_path": "https://example.com/image.jpg",
    "style": "descriptive",
    "max_length": 125,
    "include_colors": true,
    "include_objects": true,
    "include_actions": true,
    "include_context": true
  }
}
```

**Response includes:**

- Accessibility-optimized alt-text
- Word count and character count
- Style metadata
- Accessibility feature flags

### 6. `batch_process_images`

Process multiple images with the same operation efficiently.

```json
{
  "name": "batch_process_images",
  "arguments": {
    "image_paths": ["image1.jpg", "image2.jpg"],
    "operation": "caption",
    "parameters": {
      "length": "normal"
    },
    "max_concurrent": 3
  }
}
```

**Response includes:**

- Results for each image
- Batch processing summary
- Performance metrics
- Error handling for individual failures

## 📊 Available MCP Resources

### 1. `moondream://config`

Current server configuration and settings.

- Model execution mode (local/cloud/hybrid)
- Performance settings
- Security configuration
- Image processing limits

### 2. `moondream://model-info`

Model information and capabilities.

- Model name and revision
- Supported operations
- Device information
- Health status

### 3. `moondream://supported-formats`

Supported image formats and limits.

- Supported image formats (JPEG, PNG, WebP, etc.)
- Maximum image size and file size
- Processing capabilities

### 4. `moondream://operations`

List of available operations and their descriptions.

- Operation descriptions
- Parameter specifications
- Usage examples

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with your settings:

```env
# Model execution mode
MOONDREAM_MODEL_MODE=hybrid

# Model settings (for local execution)
MOONDREAM_MODEL_NAME=vikhyatk/moondream2
MOONDREAM_MODEL_REVISION=2025-01-09
MOONDREAM_DEVICE=cpu
MOONDREAM_MODEL_CACHE_DIR=/tmp/moondream_models

# Cloud API settings (for cloud/hybrid execution)
MOONDREAM_API_KEY=your_api_key_here
MOONDREAM_API_ENDPOINT=https://api.moondream.ai/v1

# Image processing
MOONDREAM_MAX_IMAGE_SIZE=2048
MOONDREAM_MAX_FILE_SIZE_MB=50
MOONDREAM_IMAGE_PREPROCESSING_ENABLED=true
MOONDREAM_SUPPORTED_FORMATS=JPEG,PNG,WebP,BMP,TIFF

# Performance settings
MOONDREAM_TIMEOUT_SECONDS=120
MOONDREAM_REQUEST_TIMEOUT_SECONDS=30
MOONDREAM_MAX_CONCURRENT_REQUESTS=5
MOONDREAM_ENABLE_MEMORY_MONITORING=true
MOONDREAM_ENABLE_PERFORMANCE_LOGGING=true

# Security settings
MOONDREAM_ENABLE_PATH_VALIDATION=true
MOONDREAM_ALLOWED_DOMAINS=example.com,trusted-site.com
MOONDREAM_BLOCKED_DOMAINS=malicious-site.com
MOONDREAM_MAX_PATH_LENGTH=2048

# Logging
MOONDREAM_LOG_LEVEL=info
MOONDREAM_LOG_FORMAT=json
MOONDREAM_ENABLE_DEBUG_LOGGING=false
```

### Model Execution Modes

#### Local Mode

- Uses Transformers.js to run models locally
- Complete privacy and offline capability
- Higher memory usage (4-8GB recommended)
- No API keys required
- Best for: Development, privacy-sensitive applications

#### Cloud Mode

- Uses remote API endpoints
- Lower resource usage
- Requires API key and internet connection
- Network dependent
- Best for: Production applications with reliable internet

#### Hybrid Mode (Recommended)

- Tries local execution first, falls back to cloud
- Automatic failover and health checking
- Optimal performance and reliability
- Best of both worlds approach
- Best for: Most production use cases

## 🧪 Examples & Testing

### Run Examples

```bash
# Test basic functionality
npm run dev examples/simple-test.ts

# Test hybrid model execution
npm run dev examples/hybrid-model-demo.ts

# Test alt-text generation
npm run dev examples/alt-text-generation.ts

# Test batch processing
npm run dev examples/batch-processing.ts

# Test error handling
npm run dev examples/error-handling.ts

# Test MCP integration
npm run dev examples/mcp-test.ts
```

### Run Comprehensive Tests

```bash
# Run full functionality validation
npx tsx test-all-functionality.ts

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build project
npm run build
```

## 🏗️ Architecture Overview

Built on the **BOBA-T framework** for type-safe workflow development:

```
src/
├── mcp/                      # MCP server implementation
│   ├── server.ts            # Main MCP server with stdio transport
│   ├── tools.ts             # MCP tool definitions and schemas
│   ├── resources.ts         # MCP resource endpoints
│   └── handlers.ts          # MCP tool call handlers
├── handlers/                # BOBA-T request handlers (3-phase lifecycle)
│   ├── analysisHandler.ts   # Request analysis and routing
│   ├── captionHandler.ts    # Caption generation handler
│   ├── queryHandler.ts      # Visual Q&A handler
│   ├── detectionHandler.ts  # Object detection handler
│   ├── pointingHandler.ts   # Object pointing handler
│   ├── altTextHandler.ts    # Alt-text generation handler
│   └── batchHandler.ts      # Batch processing handler
├── pipelines/               # BOBA-T pipeline orchestration
│   ├── captionPipeline.ts   # Caption generation pipeline
│   ├── queryPipeline.ts     # Visual Q&A pipeline
│   ├── detectionPipeline.ts # Object detection pipeline
│   ├── pointingPipeline.ts  # Object pointing pipeline
│   ├── altTextPipeline.ts   # Alt-text generation pipeline
│   ├── batchPipeline.ts     # Batch processing pipeline
│   └── errorHandlerPipeline.ts # Error handling pipeline
├── types/                   # TypeScript type definitions
│   ├── models.ts           # Core data models and interfaces
│   ├── config.ts           # Configuration interfaces
│   ├── errors.ts           # Error types and codes
│   └── workflowData.ts     # BOBA-T workflow data types
└── utils/                  # Model clients and utilities
    ├── moondreamClient.ts          # Unified client interface
    ├── hybridModelClient.ts        # Hybrid execution engine
    ├── localModelClient.ts         # Transformers.js local execution
    ├── cloudApiClient.ts           # Cloud API client
    ├── modelHealthChecker.ts       # Health monitoring system
    ├── configManager.ts            # Configuration management
    ├── imageLoader.ts              # Image processing utilities
    ├── validation.ts               # Input validation
    ├── typeGuards.ts               # TypeScript type guards
    └── errorHandler.ts             # Error handling utilities
```

### BOBA-T Integration

The server leverages BOBA-T's 3-phase handler lifecycle:

1. **Validation Phase**: Input validation, security checks, and parameter normalization
2. **Processing Phase**: Core business logic execution with proper error handling
3. **Response Phase**: Result formatting, metadata collection, and error reporting

This ensures type-safe, predictable request processing with comprehensive error handling throughout the entire pipeline.

## 📈 Performance & Monitoring

### Health Monitoring

```typescript
// Check system health
const health = await client.performHealthCheck();
console.log('Status:', health.status);
console.log('Local model:', health.details.localModel.available);
console.log('Cloud API:', health.details.cloudApi.available);
```

### Performance Metrics

- Processing time tracking
- Memory usage monitoring
- Concurrent request management
- Batch processing optimization
- Error rate tracking

### Resource Management

- Automatic image buffer cleanup
- Memory monitoring and alerts
- Model health checking
- Connection pooling for cloud APIs
- Graceful degradation handling

## 🔒 Security Features

### Input Validation

- Comprehensive type checking with TypeScript
- Path traversal attack prevention
- Image format validation
- File size limits
- URL validation and sanitization

### Network Security

- Domain allowlist/blocklist support
- Private network access blocking
- URL protocol validation
- Request timeout handling
- Rate limiting support

### Error Handling

- Structured error responses
- Detailed error context
- Error code standardization
- Secure error logging
- Graceful degradation

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "mcp"]
```

### Environment Setup

```bash
# Build Docker image
docker build -t moondream-mcp .

# Run with environment variables
docker run -e MOONDREAM_MODEL_MODE=hybrid \
           -e MOONDREAM_API_KEY=your_key \
           -p 3000:3000 \
           moondream-mcp
```

### Production Checklist

- [ ] Configure environment variables
- [ ] Set up health monitoring
- [ ] Configure logging
- [ ] Set resource limits
- [ ] Enable security features
- [ ] Test failover scenarios
- [ ] Monitor performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Development Setup

```bash
# Clone repository
git clone https://github.com/Fantosism/moondream-mcp-ts.git
cd moondream-mcp-ts

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

## 🚀 Deployment

The Moondream MCP server supports multiple deployment options:

### Local Development

```bash
npm run dev src/main.ts
```

### Docker

```bash
docker build -t moondream-mcp .
docker run -p 3000:3000 -e MOONDREAM_API_KEY=your_key moondream-mcp
```

### Cloud Deployment

- **AWS ECS/Lambda**: Serverless and container options
- **Google Cloud Run**: Fully managed container platform
- **Azure Container Instances**: Simple container deployment
- **Kubernetes**: Scalable orchestration with auto-scaling

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guides.

## 📚 Documentation

- [API Reference](./API.md) - Complete API documentation
- [Configuration Guide](./CONFIGURATION.md) - Detailed configuration options
- [Examples](./examples/README.md) - Comprehensive usage examples
- [Validation Guide](./VALIDATION.md) - Input validation and security
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment options

## 🎯 Current Status

✅ **Complete MCP Server**: Full MCP protocol implementation with all tools and resources  
✅ **BOBA-T Framework**: Type-safe workflow development with 3-phase handler lifecycle  
✅ **Hybrid Model Execution**: Local (Transformers.js) + Cloud API with intelligent fallback  
✅ **Real Image Processing**: Sharp-based image processing with format conversion and resizing  
✅ **Health Monitoring**: Continuous model health checks and performance monitoring  
✅ **Security Features**: Comprehensive input validation and security measures  
✅ **Production Ready**: Complete configuration, validation, and error handling  
✅ **Comprehensive Testing**: 100% test coverage with functional validation

🚀 **Ready for Production**: Real Moondream model integration with both local and cloud execution capabilities, comprehensive security features, and production-grade monitoring.

## 📋 Requirements

- Node.js 20 or higher
- npm 8 or higher
- 4GB RAM minimum (8GB recommended for local mode)
- TypeScript 5.0 or higher
- (Optional) Docker for containerized deployment

## 📄 License

MIT

## 🏷️ Version

Current version: 0.1.0

Built with ❤️ using the BOBA-T framework and TypeScript.
