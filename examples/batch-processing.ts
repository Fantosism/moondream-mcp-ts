#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { MoondreamClient, createConfigFromEnv, initializeLogger } from '../src/utils';
import { batchCaptionImages, batchQueryImages, batchDetectObjects } from '../src/pipelines';
import { BatchAnalysisResult, AnalysisResult } from '../src/types';

// Load environment variables
config();

// Type guard to check if result is BatchAnalysisResult
function isBatchResult(result: AnalysisResult | undefined): result is BatchAnalysisResult {
  return result != null && 'totalProcessingTimeMs' in result;
}

async function batchProcessingExample() {
  console.log('🚀 Batch Processing Example\n');

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

    // Example image URLs (smaller images for faster testing)
    const imageUrls = [
      'https://picsum.photos/200/200?random=1',
      'https://picsum.photos/200/200?random=2',
    ];

    // Example 1: Batch Caption Generation
    console.log('📝 Batch generating captions...');
    const batchCaptionResult = await batchCaptionImages(client, imageUrls, 'normal', false);
    
    if (batchCaptionResult.result?.success) {
      console.log(`✅ Batch captioning completed successfully`);
      console.log(`Processed ${batchCaptionResult.batchResults?.length || 0} images`);
      batchCaptionResult.batchResults?.forEach((result, i) => {
        if (result.success && 'caption' in result) {
          console.log(`  ${i + 1}. ${result.caption}`);
        } else {
          console.log(`  ${i + 1}. Failed: ${result.errorMessage}`);
        }
      });
    } else {
      console.log('❌ Batch captioning failed');
    }
    const captionTime = isBatchResult(batchCaptionResult.result) 
      ? batchCaptionResult.result.totalProcessingTimeMs 
      : batchCaptionResult.result?.processingTimeMs || 0;
    console.log('Total processing time:', captionTime, 'ms\n');

    // Example 2: Batch Visual Question Answering
    console.log('❓ Batch asking questions...');
    const batchQueryResult = await batchQueryImages(
      client, 
      imageUrls, 
      'What is the main subject of this image?'
    );
    
    if (batchQueryResult.result?.success) {
      console.log(`✅ Batch querying completed successfully`);
      console.log(`Processed ${batchQueryResult.batchResults?.length || 0} images`);
      batchQueryResult.batchResults?.forEach((result, i) => {
        if (result.success && 'answer' in result) {
          console.log(`  ${i + 1}. ${result.answer}`);
        } else {
          console.log(`  ${i + 1}. Failed: ${result.errorMessage}`);
        }
      });
    } else {
      console.log('❌ Batch querying failed');
    }
    const queryTime = isBatchResult(batchQueryResult.result) 
      ? batchQueryResult.result.totalProcessingTimeMs 
      : batchQueryResult.result?.processingTimeMs || 0;
    console.log('Total processing time:', queryTime, 'ms\n');

    // Example 3: Batch Object Detection
    console.log('🔍 Batch detecting objects...');
    const batchDetectionResult = await batchDetectObjects(client, imageUrls, 'person');
    
    if (batchDetectionResult.result?.success) {
      console.log(`✅ Batch detection completed successfully`);
      console.log(`Processed ${batchDetectionResult.batchResults?.length || 0} images`);
      batchDetectionResult.batchResults?.forEach((result, i) => {
        if (result.success) {
          console.log(`  ${i + 1}. Detection completed`);
        } else {
          console.log(`  ${i + 1}. Failed: ${result.errorMessage}`);
        }
      });
    } else {
      console.log('❌ Batch detection failed');
    }
    const detectionTime = isBatchResult(batchDetectionResult.result) 
      ? batchDetectionResult.result.totalProcessingTimeMs 
      : batchDetectionResult.result?.processingTimeMs || 0;
    console.log('Total processing time:', detectionTime, 'ms\n');

    // Performance Summary
    console.log('📊 Performance Summary:');
    
    console.log(`  Caption generation: ${captionTime}ms (${(captionTime / imageUrls.length).toFixed(1)}ms per image)`);
    console.log(`  Question answering: ${queryTime}ms (${(queryTime / imageUrls.length).toFixed(1)}ms per image)`);
    console.log(`  Object detection: ${detectionTime}ms (${(detectionTime / imageUrls.length).toFixed(1)}ms per image)`);

    // Cleanup
    await client.cleanup();
    console.log('\n✅ Batch processing example completed successfully!');

  } catch (error) {
    console.error('❌ Error running batch processing example:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  batchProcessingExample().catch(console.error);
}

export { batchProcessingExample };