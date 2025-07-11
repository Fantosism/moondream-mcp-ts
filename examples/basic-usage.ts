#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { MoondreamClient, createConfigFromEnv, initializeLogger } from '../src/utils';
import { captionImage, queryImage, detectObjects, pointObjects } from '../src/pipelines';
import { 
  isCaptionResult, 
  isQueryResult, 
  isDetectionResult, 
  isPointingResult 
} from '../src/utils/typeGuards';

// Load environment variables
config();

async function basicUsageExample() {
  console.log('🚀 Basic Moondream MCP Usage Example\n');

  try {
    // Create configuration from environment variables
    const config = createConfigFromEnv();
    
    // Initialize logger
    initializeLogger(config);
    console.log('✅ Configuration loaded');

    // Initialize the client
    const client = new MoondreamClient(config);
    await client.initialize();
    console.log('✅ Client initialized\n');

    // Example image URL (replace with actual image)
    const imageUrl = 'https://picsum.photos/800/600?random=1';

    // Example 1: Caption Generation
    console.log('📝 Generating image caption...');
    const captionResult = await captionImage(client, imageUrl, 'detailed', false);
    if (captionResult.result?.success && isCaptionResult(captionResult.result)) {
      console.log('Caption:', captionResult.result.caption);
      if (captionResult.result.confidence !== undefined) {
        console.log('Confidence:', captionResult.result.confidence);
      }
    } else {
      console.log('Caption failed:', captionResult.result?.errorMessage || 'Unknown error');
    }
    console.log('Processing time:', captionResult.result?.processingTimeMs, 'ms\n');

    // Example 2: Visual Question Answering
    console.log('❓ Asking question about image...');
    const queryResult = await queryImage(client, imageUrl, 'What colors are prominent in this image?');
    if (queryResult.result?.success && isQueryResult(queryResult.result)) {
      console.log('Answer:', queryResult.result.answer);
      if (queryResult.result.confidence !== undefined) {
        console.log('Confidence:', queryResult.result.confidence);
      }
    } else {
      console.log('Query failed:', queryResult.result?.errorMessage || 'Unknown error');
    }
    console.log('Processing time:', queryResult.result?.processingTimeMs, 'ms\n');

    // Example 3: Object Detection
    console.log('🔍 Detecting objects...');
    const detectionResult = await detectObjects(client, imageUrl, 'person');
    console.log('Detection success:', detectionResult.result?.success);
    if (detectionResult.result?.success && isDetectionResult(detectionResult.result)) {
      console.log('Objects found:', detectionResult.result.totalFound);
      if (detectionResult.result.objects.length > 0) {
        console.log('First object:', detectionResult.result.objects[0]);
      }
    } else {
      console.log('Detection failed:', detectionResult.result?.errorMessage || 'Unknown error');
    }
    console.log('Processing time:', detectionResult.result?.processingTimeMs, 'ms\n');

    // Example 4: Object Pointing
    console.log('📍 Locating objects...');
    const pointingResult = await pointObjects(client, imageUrl, 'car');
    console.log('Pointing success:', pointingResult.result?.success);
    if (pointingResult.result?.success && isPointingResult(pointingResult.result)) {
      console.log('Points found:', pointingResult.result.totalFound);
      if (pointingResult.result.points.length > 0) {
        console.log('First point:', pointingResult.result.points[0]);
      }
    } else {
      console.log('Pointing failed:', pointingResult.result?.errorMessage || 'Unknown error');
    }
    console.log('Processing time:', pointingResult.result?.processingTimeMs, 'ms\n');

    // Cleanup
    await client.cleanup();
    console.log('✅ Example completed successfully!');

  } catch (error) {
    console.error('❌ Error running example:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };