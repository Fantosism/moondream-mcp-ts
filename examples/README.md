# Moondream MCP TypeScript Examples

This directory contains comprehensive examples demonstrating all features of the Moondream MCP TypeScript implementation with the BOBA-T framework and hybrid model execution capabilities.

## 🚀 Quick Start

All examples can be run using:

```bash
npm run dev examples/[example-name].ts
```

## 📚 Available Examples

### 1. 🧪 Simple Test (`simple-test.ts`)

**Purpose**: Basic functionality validation and quick testing

**Features Demonstrated:**
- Configuration loading and validation
- Client initialization with hybrid support
- Caption generation with different lengths
- Visual Q&A with confidence scoring
- Performance timing and metrics
- Error handling and cleanup

**Key Learning Points:**
- Basic client setup and initialization
- Simple operation execution
- Error handling patterns
- Performance monitoring

```bash
npm run dev examples/simple-test.ts
```

**Example Output:**
```
✅ Configuration loaded (hybrid mode)
✅ Client initialized
📝 Caption: "A scenic mountain landscape with snow-capped peaks"
❓ Answer: "The image shows mountains, trees, and a clear blue sky"
⏱️  Processing time: 1,234ms
```

### 2. 🔀 Hybrid Model Demo (`hybrid-model-demo.ts`)

**Purpose**: Comprehensive demonstration of hybrid execution capabilities

**Features Demonstrated:**
- Local and cloud model status monitoring
- Health check system operation
- Multiple execution modes (local/cloud/hybrid)
- Performance comparison between modes
- Real-time status reporting
- Automatic failover testing

**Key Learning Points:**
- Hybrid execution architecture
- Health monitoring systems
- Performance optimization
- Failover mechanisms

```bash
npm run dev examples/hybrid-model-demo.ts
```

**Example Output:**
```
🚀 Hybrid Model Execution Demo
📊 Model mode: hybrid
🏥 Health check: healthy (local: ✅ 234ms, cloud: ✅ 567ms)
📝 Caption via local model: "A bustling city street at sunset"
❓ Q&A via cloud fallback: "The image shows urban architecture"
🔍 Object detection: Found 3 person(s), 2 car(s)
```

### 3. 🎯 Basic Usage (`basic-usage.ts`)

**Purpose**: Demonstrates core functionality across all operations

**Features Demonstrated:**
- Image captioning with different lengths (short/normal/detailed)
- Visual question answering with various question types
- Object detection with bounding boxes
- Object pointing with coordinate localization
- Configuration options and parameters
- Basic error handling

**Key Learning Points:**
- Complete operation coverage
- Parameter customization
- Result interpretation
- Basic workflow patterns

```bash
npm run dev examples/basic-usage.ts
```

**Example Output:**
```
📝 Caption (short): "Mountain view"
📝 Caption (detailed): "A breathtaking panoramic view of snow-capped mountains..."
❓ Q&A: "What's the weather like?" → "The sky appears clear and sunny"
🔍 Detection: Found 2 person(s) at (0.1, 0.2, 0.3, 0.4)
📍 Pointing: person at coordinates (0.25, 0.35)
```

### 4. 🔄 Batch Processing (`batch-processing.ts`)

**Purpose**: Efficient processing of multiple images with parallel execution

**Features Demonstrated:**
- Batch caption generation with different lengths
- Batch visual question answering
- Batch object detection across multiple images
- Performance monitoring and optimization
- Parallel processing capabilities with concurrency control
- Error handling for individual batch items

**Key Learning Points:**
- Batch processing patterns
- Concurrency management
- Performance optimization
- Error handling in batch operations

```bash
npm run dev examples/batch-processing.ts
```

**Example Output:**
```
🔄 Batch Processing Demo
📊 Processing 5 images with 3 concurrent workers
✅ Batch caption: 5/5 successful (avg: 987ms per image)
✅ Batch Q&A: 4/5 successful (1 timeout)
📈 Total processing time: 4,321ms
📊 Performance: 1.2 images/second
```

### 5. 🚨 Error Handling (`error-handling.ts`)

**Purpose**: Robust error handling patterns and recovery strategies

**Features Demonstrated:**
- Invalid input handling and validation
- Network timeout management
- Graceful degradation scenarios
- Error recovery strategies
- Detailed error context and metadata
- Fallback mechanisms

**Key Learning Points:**
- Error handling best practices
- Recovery strategies
- Graceful degradation
- Error context interpretation

```bash
npm run dev examples/error-handling.ts
```

**Example Output:**
```
🚨 Error Handling Demo
❌ Invalid URL: ValidationError (INVALID_URL)
❌ Network timeout: TimeoutError (TIMEOUT_ERROR)
✅ Graceful fallback: Switched to cloud API
📊 Error recovery: 3/5 operations recovered successfully
```

### 6. ♿ Alt-Text Generation (`alt-text-generation.ts`)

**Purpose**: Accessibility-focused alt-text generation with comprehensive options

**Features Demonstrated:**
- Basic alt-text generation with different styles
- Concise alt-text for buttons and icons (≤50 characters)
- Detailed alt-text for complex images (≤200 characters)
- Customizable accessibility features (colors, objects, actions, context)
- Batch alt-text generation
- WCAG compliance guidelines
- Word count and character limit management

**Key Learning Points:**
- Accessibility best practices
- Alt-text style variations
- WCAG compliance
- Accessibility feature customization

```bash
npm run dev examples/alt-text-generation.ts
```

**Example Output:**
```
♿ Alt-Text Generation Demo
🎯 Concise: "Mountain landscape" (18 chars)
📝 Descriptive: "Snow-capped mountains under blue sky with forest" (48 chars)
📚 Detailed: "Panoramic view of majestic snow-covered mountain peaks..." (125 chars)
🌈 Color-focused: "Blue sky above white snow and green forest"
📊 Batch generation: 5 images processed (avg: 23 words per description)
```

### 7. 🧪 MCP Test (`mcp-test.ts`)

**Purpose**: Complete MCP protocol integration testing

**Features Demonstrated:**
- MCP server startup and connection
- Tool listing and validation
- Resource listing and access
- Resource content reading
- Tool execution via MCP protocol
- Error handling through MCP layer
- Server cleanup and termination

**Key Learning Points:**
- MCP protocol implementation
- Client-server communication
- Tool and resource management
- Protocol error handling

```bash
npm run dev examples/mcp-test.ts
```

**Example Output:**
```
🧪 Testing Moondream MCP Server
✅ Connected to MCP server
📋 Found 6 tools: caption_image, query_image, detect_objects...
📦 Found 4 resources: config, model-info, supported-formats...
📖 Config resource: {"modelMode": "hybrid", "device": "cpu"...}
🖼️ Caption result: {"success": true, "caption": "A scenic view..."}
♿ Alt-text result: {"success": true, "altText": "Mountain landscape..."}
```

### 8. 🚀 Advanced Hybrid Usage (`advanced-hybrid-usage.ts`)

**Purpose**: Production-ready patterns for advanced hybrid model usage

**Features Demonstrated:**
- Advanced configuration and performance tuning
- Comprehensive health monitoring and status reporting
- Performance metrics collection and analysis
- Advanced error recovery and fallback mechanisms
- Memory management and resource cleanup
- Production deployment patterns
- Continuous health monitoring simulation
- Advanced accessibility features with WCAG compliance

**Key Learning Points:**
- Production-ready architecture patterns
- Advanced monitoring and metrics collection
- Performance optimization strategies
- Error recovery and resilience patterns
- Resource management best practices
- Health monitoring implementation

```bash
npm run dev examples/advanced-hybrid-usage.ts
```

**Example Output:**
```
🚀 Advanced Hybrid Model Usage Example
⚙️ Configuration: hybrid mode (3 concurrent, 60s timeout)
🏥 Health check: healthy (local: ✅ 234ms, cloud: ✅ 567ms)
📝 Advanced captions with fallback testing
❓ Complex Q&A with context analysis
🔍 Multi-object detection with confidence scoring
♿ Accessibility-focused alt-text generation
📈 Performance: 95.2% success rate, 1.2 ops/sec
🔄 Error recovery: 3/3 mechanisms tested successfully
```

## 🛠️ Advanced Usage Examples

### Custom Error Handling

```typescript
import { MoondreamClient } from '../src/utils/moondreamClient';
import { ValidationError, NetworkError } from '../src/types/errors';

async function robustImageProcessing(imagePath: string) {
  const client = new MoondreamClient(config);
  
  try {
    const result = await client.captionImage(imagePath);
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('Input validation failed:', error.message);
      // Handle validation errors
    } else if (error instanceof NetworkError) {
      console.log('Network error occurred:', error.message);
      // Implement retry logic
    } else {
      console.log('Unexpected error:', error);
      // Generic error handling
    }
  }
}
```

### Batch Processing with Custom Concurrency

```typescript
import { batchCaptionImages } from '../src/pipelines';

async function customBatchProcessing(imagePaths: string[]) {
  const client = new MoondreamClient(config);
  
  // Process with custom concurrency
  const result = await batchCaptionImages(
    client,
    imagePaths,
    'detailed',
    false,
    {
      maxConcurrent: 3,
      continueOnError: true,
      retryFailedItems: true
    }
  );
  
  // Analyze results
  console.log(`Processed ${result.batchResults?.length} images`);
  console.log(`Success rate: ${result.result?.metadata?.successRate}%`);
}
```

### Health Monitoring Integration

```typescript
import { HybridModelClient } from '../src/utils/hybridModelClient';

async function monitorSystemHealth() {
  const hybridClient = new HybridModelClient(config);
  
  // Continuous health monitoring
  setInterval(async () => {
    const health = await hybridClient.performHealthCheck();
    
    if (health.status === 'unhealthy') {
      console.log('⚠️ System unhealthy, switching to cloud mode');
      // Implement recovery logic
    }
    
    console.log(`Health: ${health.status} (${health.details.overallResponseTime}ms)`);
  }, 30000); // Check every 30 seconds
}
```

## ⚙️ Configuration Examples

### Environment-Based Configuration

```bash
# .env file
MOONDREAM_MODEL_MODE=hybrid
MOONDREAM_API_KEY=your_api_key_here
MOONDREAM_DEVICE=cpu
MOONDREAM_MAX_CONCURRENT_REQUESTS=5
MOONDREAM_TIMEOUT_SECONDS=120
MOONDREAM_ENABLE_MEMORY_MONITORING=true
```

### Programmatic Configuration

```typescript
import { createConfig } from '../src/utils/configManager';

const config = createConfig({
  modelMode: 'hybrid',
  modelName: 'vikhyatk/moondream2',
  device: 'cpu',
  maxConcurrentRequests: 10,
  timeoutSeconds: 180,
  enableMemoryMonitoring: true,
  apiKey: process.env.MOONDREAM_API_KEY,
  apiEndpoint: 'https://api.moondream.ai/v1',
  maxImageSize: [2048, 2048],
  maxFileSizeMb: 50,
  supportedFormats: ['JPEG', 'PNG', 'WebP', 'BMP', 'TIFF']
});
```

## 🔍 Testing & Validation

### Running All Examples

```bash
# Run all examples sequentially
npm run examples

# Run specific example
npm run dev examples/simple-test.ts

# Run with custom configuration
MOONDREAM_MODEL_MODE=local npm run dev examples/hybrid-model-demo.ts
```

### Comprehensive Testing

```bash
# Run full functionality validation
npx tsx test-all-functionality.ts

# Expected output: 100% success rate
# 🎉 ALL TESTS PASSED! The system is ready for deployment.
```

## 🎯 Learning Path

### Beginner
1. **simple-test.ts** - Basic functionality
2. **basic-usage.ts** - Core operations
3. **error-handling.ts** - Error patterns

### Intermediate
4. **alt-text-generation.ts** - Accessibility features
5. **batch-processing.ts** - Parallel processing
6. **mcp-test.ts** - Protocol integration

### Advanced
7. **hybrid-model-demo.ts** - System architecture
8. **advanced-hybrid-usage.ts** - Production-ready patterns
9. Custom implementations using the patterns above

## 🚀 Performance Optimization

### Best Practices

1. **Use Batch Processing**: For multiple images, always use batch operations
2. **Configure Concurrency**: Set `maxConcurrentRequests` based on your system
3. **Enable Monitoring**: Use health checks and performance logging
4. **Optimize Images**: Preprocess images to optimal sizes
5. **Handle Errors Gracefully**: Implement proper error recovery

### Performance Metrics

```typescript
// Example performance monitoring
const startTime = Date.now();
const result = await client.captionImage(imagePath);
const processingTime = Date.now() - startTime;

console.log(`Processing time: ${processingTime}ms`);
console.log(`Model processing: ${result.processingTimeMs}ms`);
console.log(`Overhead: ${processingTime - result.processingTimeMs}ms`);
```

## 📊 Common Use Cases

### 1. Website Accessibility
```typescript
// Generate alt-text for web images
const altText = await generateAltText(client, imageUrl, 'descriptive', 125);
```

### 2. Content Management
```typescript
// Batch process uploaded images
const results = await batchCaptionImages(client, imagePaths, 'normal');
```

### 3. Image Search
```typescript
// Generate searchable descriptions
const description = await client.captionImage(imagePath, 'detailed');
```

### 4. Object Recognition
```typescript
// Find specific objects in images
const objects = await client.detectObjects(imagePath, 'person');
```

### 5. Interactive Q&A
```typescript
// Answer questions about images
const answer = await client.queryImage(imagePath, 'What is happening in this image?');
```

## 🔒 Security Considerations

### Input Validation

All examples demonstrate proper input validation:
- Path validation and sanitization
- URL validation with domain filtering
- File size and format validation
- Parameter validation with type guards

### Error Handling

Examples show secure error handling:
- Sanitized error messages
- Structured error responses
- No sensitive information in logs
- Graceful degradation

## 🌐 Integration Examples

### Express.js Web Server

```typescript
import express from 'express';
import { MoondreamClient } from '../src/utils/moondreamClient';

const app = express();
const client = new MoondreamClient(config);

app.post('/caption', async (req, res) => {
  try {
    const result = await client.captionImage(req.body.imagePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Next.js API Route

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { MoondreamClient } from '../../../src/utils/moondreamClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = new MoondreamClient(config);
  
  const result = await client.captionImage(req.body.imagePath);
  res.json(result);
}
```

## 🎉 Next Steps

After running these examples, you can:

1. **Choose Your Architecture**: Select local, cloud, or hybrid execution
2. **Customize Operations**: Extend handlers for specific use cases
3. **Optimize Performance**: Tune settings for your requirements
4. **Add Monitoring**: Implement health checks and metrics
5. **Build Applications**: Use patterns as building blocks
6. **Deploy to Production**: Use Docker and environment configuration

## 📝 Additional Resources

- [Main README](../README.md) - Complete project documentation
- [API Reference](../API.md) - Detailed API documentation
- [Configuration Guide](../CONFIGURATION.md) - Advanced configuration options
- [BOBA-T Documentation](https://github.com/your-org/boba-t) - Framework documentation

## 🤝 Contributing

Want to add more examples or improve existing ones? 

1. Fork the repository
2. Create a new example file
3. Add documentation here
4. Submit a pull request

### Example Template

```typescript
#!/usr/bin/env ts-node

import { MoondreamClient, createConfigFromEnv } from '../src/utils';

async function yourExampleFunction() {
  console.log('🚀 Your Example Name');
  
  try {
    const config = createConfigFromEnv();
    const client = new MoondreamClient(config);
    await client.initialize();
    
    // Your example code here
    
    await client.cleanup();
    console.log('✅ Example completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  yourExampleFunction().catch(console.error);
}

export { yourExampleFunction };
```

Happy coding! 🎯