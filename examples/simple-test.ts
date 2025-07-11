#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { MoondreamClient } from '../src/utils/moondreamClient';
import { createConfigFromEnv } from '../src/utils/configManager';
import { initializeLogger } from '../src/utils/logger';

// Load environment variables from .env file
config();

async function simpleTest() {
  console.log('🚀 Simple Moondream MCP Test with BOBA-T Framework\n');

  try {
    // Create configuration from environment variables
    const config = createConfigFromEnv();
    
    // Initialize logger
    initializeLogger(config);
    console.log('✅ Configuration loaded');
    console.log(`📊 Model mode: ${config.modelMode}`);
    console.log(`🔧 Device: ${config.device}`);

    // Initialize the client (supports local/cloud/hybrid execution)
    const client = new MoondreamClient(config);
    await client.initialize();
    console.log('✅ Client initialized with hybrid model support');

    // Test basic functionality with a real image URL
    const testImageUrl = 'https://picsum.photos/400/300';
    
    console.log('\n📝 Testing caption generation...');
    const captionResult = await client.captionImage(testImageUrl, 'normal', false);
    console.log('Success:', captionResult.success);
    if (captionResult.success) {
      console.log('Caption:', captionResult.caption);
      console.log('Confidence:', captionResult.confidence);
    } else {
      console.log('Error:', captionResult.errorMessage);
    }
    console.log('Processing time:', captionResult.processingTimeMs, 'ms');

    console.log('\n❓ Testing query...');
    const queryResult = await client.queryImage(testImageUrl, 'What do you see?');
    console.log('Success:', queryResult.success);
    if (queryResult.success) {
      console.log('Answer:', queryResult.answer);
      console.log('Confidence:', queryResult.confidence);
    } else {
      console.log('Error:', queryResult.errorMessage);
    }
    console.log('Processing time:', queryResult.processingTimeMs, 'ms');

    // Cleanup
    await client.cleanup();
    console.log('\n✅ Simple test completed successfully using BOBA-T framework!');

  } catch (error) {
    console.error('❌ Error in simple test:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  simpleTest().catch(console.error);
}

export { simpleTest };