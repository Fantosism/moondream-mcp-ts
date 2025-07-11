#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { MoondreamClient } from '../src/utils/moondreamClient';
import { createConfigFromEnv } from '../src/utils/configManager';
import { initializeLogger } from '../src/utils/logger';
import { HybridModelClient } from '../src/utils/hybridModelClient';

// Load environment variables
config();

async function hybridModelDemo() {
  console.log('🚀 Hybrid Model Execution Demo with BOBA-T Framework\n');

  try {
    // Create configuration from environment variables
    const config = createConfigFromEnv();
    
    // Initialize logger
    initializeLogger(config);
    console.log('✅ Configuration loaded');
    console.log(`📊 Model mode: ${config.modelMode}`);
    console.log(`🌐 API endpoint: ${config.apiEndpoint || 'Not configured'}`);
    console.log(`💾 Local model: ${config.modelName}@${config.modelRevision}`);
    console.log(`🔧 Device: ${config.device}\n`);

    // Initialize the hybrid client directly to show internal status
    const hybridClient = new HybridModelClient(config);
    await hybridClient.initialize();
    
    // Show initial status
    const initialStatus = hybridClient.getStatus();
    console.log('🔍 Initial System Status:');
    console.log(`  Mode: ${initialStatus.mode}`);
    console.log(`  Local available: ${initialStatus.localAvailable}`);
    console.log(`  Cloud available: ${initialStatus.cloudAvailable}`);
    console.log(`  Initialized: ${initialStatus.initialized}\n`);

    // Perform health check
    console.log('🏥 Performing health check...');
    const healthCheck = await hybridClient.performHealthCheck();
    console.log(`  Overall status: ${healthCheck.status}`);
    console.log(`  Response time: ${healthCheck.details.overallResponseTime}ms`);
    console.log(`  Local model: ${healthCheck.details.localModel.available ? '✅' : '❌'} ${healthCheck.details.localModel.responseTime ? `(${healthCheck.details.localModel.responseTime}ms)` : ''}`);
    console.log(`  Cloud API: ${healthCheck.details.cloudApi.available ? '✅' : '❌'} ${healthCheck.details.cloudApi.responseTime ? `(${healthCheck.details.cloudApi.responseTime}ms)` : ''}\n`);

    // Initialize the main client
    const client = new MoondreamClient(config);
    await client.initialize();

    // Test with different operations to show hybrid execution
    const testImageUrl = 'https://picsum.photos/600/400';
    
    console.log('📝 Testing caption generation...');
    const startTime = Date.now();
    const captionResult = await client.captionImage(testImageUrl, 'detailed', false);
    const captionTime = Date.now() - startTime;
    
    if (captionResult.success) {
      console.log(`✅ Caption: "${captionResult.caption}"`);
      console.log(`📊 Confidence: ${captionResult.confidence}`);
      console.log(`⏱️  Total time: ${captionTime}ms (processing: ${captionResult.processingTimeMs}ms)\n`);
    } else {
      console.log(`❌ Caption failed: ${captionResult.errorMessage}\n`);
    }

    console.log('❓ Testing visual Q&A...');
    const questions = [
      'What colors are prominent in this image?',
      'Describe the composition and layout',
      'What mood or atmosphere does this image convey?'
    ];

    for (const question of questions) {
      const startTime = Date.now();
      const queryResult = await client.queryImage(testImageUrl, question);
      const queryTime = Date.now() - startTime;
      
      if (queryResult.success) {
        console.log(`  Q: ${question}`);
        console.log(`  A: ${queryResult.answer}`);
        console.log(`  ⏱️  Time: ${queryTime}ms\n`);
      } else {
        console.log(`  ❌ Q: ${question} - Failed: ${queryResult.errorMessage}\n`);
      }
    }

    // Test object detection
    console.log('🔍 Testing object detection...');
    const objectsToDetect = ['person', 'building', 'tree', 'car'];
    
    for (const objectName of objectsToDetect) {
      const detectResult = await client.detectObjects(testImageUrl, objectName);
      if (detectResult.success && detectResult.totalFound > 0) {
        console.log(`  Found ${detectResult.totalFound} ${objectName}(s)`);
        detectResult.objects.forEach((obj, i) => {
          console.log(`    ${i + 1}. Confidence: ${obj.confidence}, Box: (${obj.boundingBox.x}, ${obj.boundingBox.y}, ${obj.boundingBox.width}, ${obj.boundingBox.height})`);
        });
      }
    }

    // Final status check
    console.log('\n🔍 Final System Status:');
    const finalStatus = hybridClient.getStatus();
    if (finalStatus.health) {
      console.log(`  Health: ${finalStatus.health.status}`);
      console.log(`  Last check: ${new Date(finalStatus.health.timestamp).toLocaleTimeString()}`);
    }
    console.log(`  Ready: ${hybridClient.isReady()}`);
    console.log(`  Healthy: ${hybridClient.isHealthy()}\n`);

    // Cleanup
    await client.cleanup();
    await hybridClient.cleanup();
    console.log('✅ Hybrid model demo completed successfully using BOBA-T framework!');

  } catch (error) {
    console.error('❌ Error in hybrid model demo:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  hybridModelDemo().catch(console.error);
}

export { hybridModelDemo };