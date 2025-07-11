# API Reference

This document provides a comprehensive reference for the Moondream MCP TypeScript server built with the BOBA-T framework.

## Repository Information

**GitHub Repository**: [https://github.com/Fantosism/moondream-mcp-ts](https://github.com/Fantosism/moondream-mcp-ts)  
**BOBA-T Framework**: [https://github.com/Fantosism/boba](https://github.com/Fantosism/boba)  
**Author**: Fantosism  
**License**: MIT

## Model Context Protocol (MCP) Interface

The server implements the MCP specification and provides tools and resources for vision language model operations.

### MCP Tools

All tools follow the BOBA-T 3-phase handler lifecycle: Validation → Processing → Response.

#### 1. `caption_image`

Generate descriptive captions for images.

**Arguments:**
```typescript
{
  image_path: string;      // URL or file path to image
  length?: 'short' | 'normal' | 'detailed';  // Default: 'normal'
  stream?: boolean;        // Default: false
}
```

**Response:**
```typescript
{
  success: boolean;
  caption?: string;
  confidence?: number;
  length: string;
  processingTimeMs: number;
  metadata: {
    imagePath: string;
    modelName: string;
    device: string;
    imageFormat: string;
    streamingEnabled: boolean;
  };
  errorMessage?: string;
  errorCode?: string;
}
```

**Example:**
```json
{
  "name": "caption_image",
  "arguments": {
    "image_path": "https://example.com/photo.jpg",
    "length": "detailed"
  }
}
```

#### 2. `query_image`

Ask questions about image content using visual Q&A.

**Arguments:**
```typescript
{
  image_path: string;      // URL or file path to image
  question: string;        // Question about the image
}
```

**Response:**
```typescript
{
  success: boolean;
  answer?: string;
  question: string;
  confidence?: number;
  processingTimeMs: number;
  metadata: {
    imagePath: string;
    modelName: string;
    device: string;
    imageFormat: string;
  };
  errorMessage?: string;
  errorCode?: string;
}
```

**Example:**
```json
{
  "name": "query_image",
  "arguments": {
    "image_path": "https://example.com/scene.jpg",
    "question": "What objects are visible in this scene?"
  }
}
```

#### 3. `detect_objects`

Detect and locate specific objects in images with bounding boxes.

**Arguments:**
```typescript
{
  image_path: string;      // URL or file path to image
  object_name: string;     // Name of object to detect
}
```

**Response:**
```typescript
{
  success: boolean;
  objects?: Array<{
    name: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  objectName: string;
  totalFound: number;
  processingTimeMs: number;
  metadata: {
    imagePath: string;
    objectName: string;
    modelName: string;
    device: string;
    imageFormat: string;
  };
  errorMessage?: string;
  errorCode?: string;
}
```

**Example:**
```json
{
  "name": "detect_objects",
  "arguments": {
    "image_path": "https://example.com/street.jpg",
    "object_name": "car"
  }
}
```

#### 4. `point_objects`

Find coordinate points for objects in images.

**Arguments:**
```typescript
{
  image_path: string;      // URL or file path to image
  object_name: string;     // Name of object to point to
}
```

**Response:**
```typescript
{
  success: boolean;
  points?: Array<{
    name: string;
    confidence: number;
    point: {
      x: number;
      y: number;
    };
  }>;
  objectName: string;
  totalFound: number;
  processingTimeMs: number;
  metadata: {
    imagePath: string;
    objectName: string;
    modelName: string;
    device: string;
    imageFormat: string;
  };
  errorMessage?: string;
  errorCode?: string;
}
```

**Example:**
```json
{
  "name": "point_objects",
  "arguments": {
    "image_path": "https://example.com/room.jpg",
    "object_name": "table"
  }
}
```

#### 5. `generate_alt_text`

Generate accessibility-focused alt-text descriptions.

**Arguments:**
```typescript
{
  image_path: string;                    // URL or file path to image
  style?: 'concise' | 'descriptive' | 'detailed';  // Default: 'descriptive'
  max_length?: number;                   // Default: 125
  include_colors?: boolean;              // Default: true
  include_objects?: boolean;             // Default: true
  include_actions?: boolean;             // Default: true
  include_context?: boolean;             // Default: true
}
```

**Response:**
```typescript
{
  success: boolean;
  altText?: string;
  style: string;
  wordCount?: number;
  accessibility?: {
    includesColors: boolean;
    includesObjects: boolean;
    includesActions: boolean;
    includesContext: boolean;
  };
  processingTimeMs: number;
  metadata: {
    operation: string;
    imagePath: string;
    style: string;
    maxLength: number;
    originalAnswer?: string;
    confidence?: number;
  };
  errorMessage?: string;
  errorCode?: string;
}
```

**Example:**
```json
{
  "name": "generate_alt_text",
  "arguments": {
    "image_path": "https://example.com/artwork.jpg",
    "style": "detailed",
    "max_length": 150,
    "include_colors": true,
    "include_context": true
  }
}
```

#### 6. `batch_process_images`

Process multiple images with the same operation in parallel.

**Arguments:**
```typescript
{
  image_paths: string[];               // Array of image URLs or file paths
  operation: 'caption' | 'query' | 'detect' | 'point' | 'alt_text';
  parameters: {                        // Operation-specific parameters
    length?: string;                   // For caption
    question?: string;                 // For query
    object_name?: string;              // For detect/point
    style?: string;                    // For alt_text
    max_length?: number;               // For alt_text
    [key: string]: any;
  };
  max_concurrent?: number;             // Default: from config
  continue_on_error?: boolean;         // Default: true
}
```

**Response:**
```typescript
{
  success: boolean;
  results?: Array<{
    imagePath: string;
    success: boolean;
    result?: any;                      // Operation-specific result
    error?: string;
    processingTimeMs: number;
  }>;
  summary?: {
    total: number;
    successful: number;
    failed: number;
    totalProcessingTimeMs: number;
    averageProcessingTimeMs: number;
  };
  processingTimeMs: number;
  metadata: {
    operation: string;
    batchSize: number;
    maxConcurrent: number;
    continueOnError: boolean;
  };
  errorMessage?: string;
  errorCode?: string;
}
```

**Example:**
```json
{
  "name": "batch_process_images",
  "arguments": {
    "image_paths": [
      "https://example.com/img1.jpg",
      "https://example.com/img2.jpg"
    ],
    "operation": "caption",
    "parameters": {
      "length": "normal"
    },
    "max_concurrent": 3
  }
}
```

### MCP Resources

#### 1. `moondream://config`

Current server configuration and settings.

**Response:**
```typescript
{
  modelMode: 'local' | 'cloud' | 'hybrid';
  modelName: string;
  device: string;
  maxImageSize: [number, number];
  maxFileSizeMb: number;
  timeoutSeconds: number;
  maxConcurrentRequests: number;
  enableMemoryMonitoring: boolean;
  logLevel: string;
  // ... other config fields
}
```

#### 2. `moondream://model-info`

Model information and capabilities.

**Response:**
```typescript
{
  modelName: string;
  modelRevision: string;
  capabilities: string[];
  supportedOperations: string[];
  modelMode: string;
  deviceInfo: string;
  isLoaded: boolean;
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    localAvailable: boolean;
    cloudAvailable: boolean;
    lastCheck: number;
  };
}
```

#### 3. `moondream://supported-formats`

Supported image formats and limits.

**Response:**
```typescript
{
  supportedFormats: string[];
  maxImageSize: [number, number];
  maxFileSizeMb: number;
  maxImagePixels: number;
  compressionQuality: number;
  preprocessingEnabled: boolean;
}
```

#### 4. `moondream://operations`

List of available operations and their descriptions.

**Response:**
```typescript
{
  operations: Array<{
    name: string;
    description: string;
    parameters: object;
    examples: object[];
  }>;
}
```

## Client Library API

### MoondreamClient

The main client class providing a unified interface for all operations.

```typescript
import { MoondreamClient } from './src/utils/moondreamClient';
import { createConfigFromEnv } from './src/utils/configManager';

// Initialize client
const config = createConfigFromEnv();
const client = new MoondreamClient(config);
await client.initialize();

// Use client
const result = await client.captionImage('image.jpg', 'detailed');
console.log(result.caption);

// Cleanup
await client.cleanup();
```

#### Methods

##### `initialize(): Promise<void>`

Initializes the client and underlying model components. Must be called before using any other methods.

**Example:**
```typescript
const client = new MoondreamClient(config);
await client.initialize();
```

##### `captionImage(imagePath: string, length?: CaptionLength, stream?: boolean): Promise<CaptionResult>`

Generates descriptive captions for images.

**Parameters:**
- `imagePath` (string): URL or file path to the image
- `length` (CaptionLength, optional): Caption length - 'short', 'normal', or 'detailed'. Default: 'normal'
- `stream` (boolean, optional): Enable streaming response. Default: false

**Returns:** Promise<CaptionResult>

**Example:**
```typescript
const result = await client.captionImage('https://example.com/image.jpg', 'detailed');
if (result.success) {
  console.log('Caption:', result.caption);
  console.log('Confidence:', result.confidence);
}
```

##### `queryImage(imagePath: string, question: string): Promise<QueryResult>`

Asks questions about image content using visual Q&A.

**Parameters:**
- `imagePath` (string): URL or file path to the image
- `question` (string): Question about the image (max 500 characters)

**Returns:** Promise<QueryResult>

**Example:**
```typescript
const result = await client.queryImage('image.jpg', 'What objects are visible?');
if (result.success) {
  console.log('Question:', result.question);
  console.log('Answer:', result.answer);
}
```

##### `detectObjects(imagePath: string, objectName: string): Promise<DetectionResult>`

Detects and locates specific objects in images with bounding boxes.

**Parameters:**
- `imagePath` (string): URL or file path to the image
- `objectName` (string): Name of the object to detect (max 100 characters)

**Returns:** Promise<DetectionResult>

**Example:**
```typescript
const result = await client.detectObjects('image.jpg', 'person');
if (result.success) {
  console.log(`Found ${result.totalFound} person(s)`);
  result.objects.forEach(obj => {
    console.log(`Confidence: ${obj.confidence}`);
    console.log(`Bounding box: ${obj.boundingBox.x}, ${obj.boundingBox.y}`);
  });
}
```

##### `pointObjects(imagePath: string, objectName: string): Promise<PointingResult>`

Finds coordinate points for objects in images.

**Parameters:**
- `imagePath` (string): URL or file path to the image
- `objectName` (string): Name of the object to point to (max 100 characters)

**Returns:** Promise<PointingResult>

**Example:**
```typescript
const result = await client.pointObjects('image.jpg', 'car');
if (result.success) {
  console.log(`Found ${result.totalFound} car(s)`);
  result.points.forEach(point => {
    console.log(`Point: (${point.point.x}, ${point.point.y})`);
  });
}
```

##### `generateAltText(imagePath: string, style?: AltTextStyle, maxLength?: number, options?: AltTextOptions): Promise<AltTextResult>`

Generates accessibility-focused alt-text descriptions.

**Parameters:**
- `imagePath` (string): URL or file path to the image
- `style` (AltTextStyle, optional): Style - 'concise', 'descriptive', or 'detailed'. Default: 'descriptive'
- `maxLength` (number, optional): Maximum character length. Default: 125
- `options` (AltTextOptions, optional): Accessibility options

**AltTextOptions:**
```typescript
interface AltTextOptions {
  includeColors?: boolean;    // Default: true
  includeObjects?: boolean;   // Default: true
  includeActions?: boolean;   // Default: true
  includeContext?: boolean;   // Default: true
}
```

**Returns:** Promise<AltTextResult>

**Example:**
```typescript
const result = await client.generateAltText('image.jpg', 'descriptive', 125, {
  includeColors: true,
  includeObjects: true,
  includeActions: false,
  includeContext: true
});
if (result.success) {
  console.log('Alt-text:', result.altText);
  console.log('Word count:', result.wordCount);
}
```

##### `cleanup(): Promise<void>`

Cleans up resources and closes connections. Should be called when done using the client.

**Example:**
```typescript
await client.cleanup();
```

##### `getStatus(): ClientStatus`

Returns the current status of the client.

**Returns:** ClientStatus

**Example:**
```typescript
const status = client.getStatus();
console.log('Ready:', status.ready);
console.log('Healthy:', status.healthy);
```

##### `isReady(): boolean`

Checks if the client is ready for operations.

**Returns:** boolean

**Example:**
```typescript
if (client.isReady()) {
  // Client is ready for operations
}
```

##### `isHealthy(): boolean`

Checks if the client is healthy.

**Returns:** boolean

**Example:**
```typescript
if (client.isHealthy()) {
  // Client is healthy
}
```

### HybridModelClient

Direct access to the hybrid execution engine for advanced use cases.

```typescript
import { HybridModelClient } from './src/utils/hybridModelClient';

const hybridClient = new HybridModelClient(config);
await hybridClient.initialize();

// Check status
const status = hybridClient.getStatus();
console.log('Mode:', status.mode);
console.log('Local available:', status.localAvailable);
console.log('Cloud available:', status.cloudAvailable);

// Perform health check
const health = await hybridClient.performHealthCheck();
console.log('Health status:', health.status);

// Direct execution
const result = await hybridClient.caption(imageBuffer, 'normal');
console.log(result.caption);
```

#### Methods

##### `initialize(): Promise<void>`

Initializes the hybrid client and underlying model components.

##### `getStatus(): HybridClientStatus`

Returns the current status of the hybrid client.

**Returns:** HybridClientStatus
```typescript
interface HybridClientStatus {
  mode: 'local' | 'cloud' | 'hybrid';
  localAvailable: boolean;
  cloudAvailable: boolean;
  initialized: boolean;
  ready: boolean;
  health?: HealthCheckResult;
}
```

##### `performHealthCheck(): Promise<HealthCheckResult>`

Performs a comprehensive health check on both local and cloud components.

**Returns:** Promise<HealthCheckResult>
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  details: {
    localModel: {
      available: boolean;
      responseTime?: number;
      error?: string;
    };
    cloudApi: {
      available: boolean;
      responseTime?: number;
      error?: string;
    };
    overallResponseTime: number;
    mode: string;
  };
}
```

##### `isReady(): boolean`

Checks if the hybrid client is ready for operations.

##### `isHealthy(): boolean`

Checks if the hybrid client is healthy.

##### `caption(imageBuffer: ImageBuffer, length: CaptionLength): Promise<CaptionResult>`

Generates captions using the hybrid execution engine.

##### `query(imageBuffer: ImageBuffer, question: string): Promise<QueryResult>`

Performs visual Q&A using the hybrid execution engine.

##### `detect(imageBuffer: ImageBuffer, objectName: string): Promise<DetectionResult>`

Detects objects using the hybrid execution engine.

##### `point(imageBuffer: ImageBuffer, objectName: string): Promise<PointingResult>`

Points to objects using the hybrid execution engine.

##### `cleanup(): Promise<void>`

Cleans up resources and closes connections.

### Pipeline Functions

High-level pipeline functions for direct usage without client instantiation.

#### `captionImage(client: MoondreamClient, imagePath: string, length?: CaptionLength, stream?: boolean): Promise<WorkflowResult<CaptionResult>>`

High-level pipeline for image captioning.

**Parameters:**
- `client` (MoondreamClient): Initialized client instance
- `imagePath` (string): URL or file path to the image
- `length` (CaptionLength, optional): Caption length. Default: 'normal'
- `stream` (boolean, optional): Enable streaming. Default: false

**Returns:** Promise<WorkflowResult<CaptionResult>>

**Example:**
```typescript
import { captionImage } from './src/pipelines';

const result = await captionImage(client, 'image.jpg', 'detailed');
if (result.result?.success) {
  console.log('Caption:', result.result.caption);
}
```

#### `queryImage(client: MoondreamClient, imagePath: string, question: string): Promise<WorkflowResult<QueryResult>>`

High-level pipeline for visual Q&A.

**Parameters:**
- `client` (MoondreamClient): Initialized client instance
- `imagePath` (string): URL or file path to the image
- `question` (string): Question about the image

**Returns:** Promise<WorkflowResult<QueryResult>>

**Example:**
```typescript
import { queryImage } from './src/pipelines';

const result = await queryImage(client, 'image.jpg', 'What do you see?');
if (result.result?.success) {
  console.log('Answer:', result.result.answer);
}
```

#### `detectObjects(client: MoondreamClient, imagePath: string, objectName: string): Promise<WorkflowResult<DetectionResult>>`

High-level pipeline for object detection.

**Parameters:**
- `client` (MoondreamClient): Initialized client instance
- `imagePath` (string): URL or file path to the image
- `objectName` (string): Name of the object to detect

**Returns:** Promise<WorkflowResult<DetectionResult>>

**Example:**
```typescript
import { detectObjects } from './src/pipelines';

const result = await detectObjects(client, 'image.jpg', 'person');
if (result.result?.success) {
  console.log(`Found ${result.result.totalFound} person(s)`);
}
```

#### `pointObjects(client: MoondreamClient, imagePath: string, objectName: string): Promise<WorkflowResult<PointingResult>>`

High-level pipeline for object pointing.

**Parameters:**
- `client` (MoondreamClient): Initialized client instance
- `imagePath` (string): URL or file path to the image
- `objectName` (string): Name of the object to point to

**Returns:** Promise<WorkflowResult<PointingResult>>

#### `generateAltText(client: MoondreamClient, imagePath: string, style?: AltTextStyle, maxLength?: number, options?: AltTextOptions): Promise<WorkflowResult<AltTextResult>>`

High-level pipeline for alt-text generation.

**Parameters:**
- `client` (MoondreamClient): Initialized client instance
- `imagePath` (string): URL or file path to the image
- `style` (AltTextStyle, optional): Alt-text style. Default: 'descriptive'
- `maxLength` (number, optional): Maximum length. Default: 125
- `options` (AltTextOptions, optional): Accessibility options

**Returns:** Promise<WorkflowResult<AltTextResult>>

#### Batch Processing Functions

##### `batchCaptionImages(client: MoondreamClient, imagePaths: string[], length?: CaptionLength, stream?: boolean, options?: BatchOptions): Promise<BatchWorkflowResult>`

Processes multiple images for caption generation.

**Parameters:**
- `client` (MoondreamClient): Initialized client instance
- `imagePaths` (string[]): Array of image paths or URLs
- `length` (CaptionLength, optional): Caption length. Default: 'normal'
- `stream` (boolean, optional): Enable streaming. Default: false
- `options` (BatchOptions, optional): Batch processing options

**BatchOptions:**
```typescript
interface BatchOptions {
  maxConcurrent?: number;      // Default: from config
  continueOnError?: boolean;   // Default: true
  retryFailedItems?: boolean;  // Default: false
}
```

**Returns:** Promise<BatchWorkflowResult>

**Example:**
```typescript
import { batchCaptionImages } from './src/pipelines';

const result = await batchCaptionImages(client, imagePaths, 'normal', false, {
  maxConcurrent: 3,
  continueOnError: true
});

console.log(`Processed ${result.batchResults?.length} images`);
```

##### `batchQueryImages(client: MoondreamClient, imagePaths: string[], question: string, options?: BatchOptions): Promise<BatchWorkflowResult>`

Processes multiple images for visual Q&A.

##### `batchDetectObjects(client: MoondreamClient, imagePaths: string[], objectName: string, options?: BatchOptions): Promise<BatchWorkflowResult>`

Processes multiple images for object detection.

##### `batchPointObjects(client: MoondreamClient, imagePaths: string[], objectName: string, options?: BatchOptions): Promise<BatchWorkflowResult>`

Processes multiple images for object pointing.

##### `batchGenerateAltText(client: MoondreamClient, imagePaths: string[], style?: AltTextStyle, maxLength?: number, options?: AltTextOptions & BatchOptions): Promise<BatchWorkflowResult>`

Processes multiple images for alt-text generation.

### Type Definitions

#### Core Types

```typescript
// Caption length options
type CaptionLength = 'short' | 'normal' | 'detailed';

// Alt-text style options
type AltTextStyle = 'concise' | 'descriptive' | 'detailed';

// Supported operations
type Operation = 'caption' | 'query' | 'detect' | 'point' | 'alt-text';

// Device types
type DeviceType = 'cpu' | 'cuda' | 'mps' | 'webgpu';
```

#### Result Interfaces

```typescript
interface AnalysisResult {
  success: boolean;
  processingTimeMs?: number;
  errorMessage?: string;
  errorCode?: string;
  metadata: Record<string, unknown>;
}

interface CaptionResult extends AnalysisResult {
  caption?: string;
  confidence?: number;
  length?: CaptionLength;
}

interface QueryResult extends AnalysisResult {
  answer?: string;
  question?: string;
  confidence?: number;
}

interface DetectionResult extends AnalysisResult {
  objects: DetectedObject[];
  objectName?: string;
  totalFound: number;
}

interface PointingResult extends AnalysisResult {
  points: PointedObject[];
  objectName?: string;
  totalFound: number;
}

interface AltTextResult extends AnalysisResult {
  altText?: string;
  style?: AltTextStyle;
  wordCount?: number;
  accessibility?: {
    includesColors: boolean;
    includesObjects: boolean;
    includesActions: boolean;
    includesContext: boolean;
  };
}
```

#### Workflow Types

```typescript
interface WorkflowResult<T> {
  result?: T;
  batchResults?: T[];
  processingTimeMs?: number;
  metadata?: Record<string, unknown>;
}

interface BatchWorkflowResult extends WorkflowResult<AnalysisResult> {
  batchResults: AnalysisResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalProcessingTimeMs: number;
    averageProcessingTimeMs: number;
  };
}
```

### Configuration Manager

```typescript
import { createConfig, createConfigFromEnv } from './src/utils/configManager';

// From environment variables
const config = createConfigFromEnv();

// Programmatic configuration
const config = createConfig({
  modelMode: 'hybrid',
  apiKey: 'your_key',
  modelName: 'vikhyatk/moondream2',
  device: 'cpu',
  maxConcurrentRequests: 10
});
```

## Error Handling

All operations return standardized error responses:

```typescript
interface ErrorResponse {
  success: false;
  errorMessage: string;
  errorCode: string;
  processingTimeMs: number;
  metadata: object;
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `IMAGE_PROCESSING_ERROR`: Image loading/processing failed
- `MODEL_LOAD_ERROR`: Model loading failed
- `INFERENCE_ERROR`: Model inference failed
- `NETWORK_ERROR`: Network request failed
- `TIMEOUT_ERROR`: Operation timed out
- `RESOURCE_ERROR`: Resource limit exceeded

## Health Monitoring

### Health Check Response

```typescript
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  details: {
    localModel: {
      available: boolean;
      responseTime?: number;
      error?: string;
    };
    cloudApi: {
      available: boolean;
      responseTime?: number;
      error?: string;
    };
    overallResponseTime: number;
    mode: string;
  };
}
```

### Monitoring Endpoints

```typescript
// Get current status
const status = client.getStatus();

// Perform health check
const health = await client.performHealthCheck();

// Check if ready
const ready = client.isReady();

// Check if healthy
const healthy = client.isHealthy();
```

## BOBA-T Framework Integration

The server leverages BOBA-T's 3-phase handler lifecycle:

### 1. Validation Phase
- Input validation and sanitization
- Security checks and rate limiting
- Parameter validation and normalization

### 2. Processing Phase
- Image loading and preprocessing
- Model inference execution
- Result processing and formatting

### 3. Response Phase
- Error handling and logging
- Response formatting and metadata
- Performance metrics collection

This ensures type-safe, predictable request processing with comprehensive error handling throughout the entire pipeline.

## Performance Considerations

- **Batch Processing**: Use `batch_process_images` for multiple images
- **Concurrent Requests**: Configure `maxConcurrentRequests` based on resources
- **Caching**: Enable result caching for repeated operations
- **Memory Monitoring**: Enable monitoring for production deployments
- **Health Checks**: Use periodic health checks to monitor system status