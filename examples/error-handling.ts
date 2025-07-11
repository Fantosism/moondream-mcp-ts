#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { MoondreamClient, createConfig, initializeLogger } from '../src/utils';
import { captionImage, queryImage } from '../src/pipelines';

// Load environment variables
config();

async function errorHandlingExample() {
  console.log('🚀 Error Handling Example\n');

  try {
    // Create configuration with very short timeout to demonstrate error handling
    const config = createConfig({
      timeoutSeconds: 1, // Very short timeout
      maxConcurrentRequests: 1,
      device: 'cpu',
    });
    
    // Initialize logger
    initializeLogger(config);
    console.log('✅ Configuration created with short timeout');

    // Initialize the client
    const client = new MoondreamClient(config);
    await client.initialize();
    console.log('✅ Client initialized\n');

    // Example 1: Invalid image path
    console.log('📝 Testing invalid image path...');
    try {
      const invalidResult = await captionImage(client, 'invalid://not-a-real-url', 'normal', false);
      if (!invalidResult.result?.success) {
        console.log('✅ Expected error caught:');
        console.log('  Error code:', invalidResult.result?.errorCode);
        console.log('  Error message:', invalidResult.result?.errorMessage);
      }
    } catch (error) {
      console.log('✅ Exception caught:', error);
    }
    console.log();

    // Example 2: Empty question
    console.log('❓ Testing empty question...');
    try {
      // This should fail validation
      await queryImage(client, 'https://picsum.photos/200/200', '');
    } catch (error) {
      console.log('✅ Validation error caught:', error);
    }
    console.log();

    // Example 3: Network timeout (simulated)
    console.log('🌐 Testing network timeout...');
    try {
      // Using a slow endpoint that might timeout
      const timeoutResult = await captionImage(
        client, 
        'https://httpbin.org/delay/5', // This endpoint delays 5 seconds
        'normal', 
        false
      );
      if (!timeoutResult.result?.success) {
        console.log('✅ Timeout handled gracefully:');
        console.log('  Error code:', timeoutResult.result?.errorCode);
        console.log('  Error message:', timeoutResult.result?.errorMessage);
        console.log('  Processing time:', timeoutResult.result?.processingTimeMs, 'ms');
      }
    } catch (error) {
      console.log('✅ Timeout exception caught:', error);
    }
    console.log();

    // Example 4: Demonstrate error recovery
    console.log('🔄 Testing error recovery...');
    const imageUrl = 'https://picsum.photos/400/300';
    
    const results = await Promise.allSettled([
      captionImage(client, 'invalid-url', 'normal', false),
      captionImage(client, imageUrl, 'normal', false),
      queryImage(client, imageUrl, 'What do you see?'),
    ]);

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        if (result.value.result?.success) {
          console.log(`  Operation ${i + 1}: ✅ Success`);
        } else {
          console.log(`  Operation ${i + 1}: ❌ Failed gracefully - ${result.value.result?.errorCode}`);
        }
      } else {
        console.log(`  Operation ${i + 1}: ❌ Exception - ${result.reason.message}`);
      }
    });

    // Example 5: Error context and metadata
    console.log('\n🔍 Examining error details...');
    const errorResult = await captionImage(client, 'not-a-valid-url', 'normal', false);
    if (!errorResult.result?.success) {
      console.log('Error details:');
      console.log('  Code:', errorResult.result.errorCode);
      console.log('  Message:', errorResult.result.errorMessage);
      console.log('  Metadata:', JSON.stringify(errorResult.result.metadata, null, 2));
      
      if (errorResult.errorContext) {
        console.log('  Context:', JSON.stringify(errorResult.errorContext, null, 2));
      }
    }

    // Cleanup
    await client.cleanup();
    console.log('\n✅ Error handling example completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error in example:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  errorHandlingExample().catch(console.error);
}

export { errorHandlingExample };