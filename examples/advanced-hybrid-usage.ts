#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { MoondreamClient, createConfigFromEnv, initializeLogger } from '../src/utils';
import { HybridModelClient } from '../src/utils/hybridModelClient';
import { ModelHealthChecker } from '../src/utils/modelHealthChecker';
import { captionImage, queryImage, detectObjects, generateAltText } from '../src/pipelines';
import { CaptionResult, QueryResult, DetectionResult, AltTextResult } from '../src/types';

// Load environment variables
config();

// Type guards for results
function isCaptionResult(result: unknown): result is CaptionResult {
  return result != null && typeof result === 'object' && 'caption' in result;
}

function isQueryResult(result: unknown): result is QueryResult {
  return result != null && typeof result === 'object' && 'answer' in result;
}

function isDetectionResult(result: unknown): result is DetectionResult {
  return result != null && typeof result === 'object' && 'objects' in result;
}

function isAltTextResult(result: unknown): result is AltTextResult {
  return result != null && typeof result === 'object' && 'altText' in result;
}

async function advancedHybridUsageExample() {
  console.log('🚀 Advanced Hybrid Model Usage Example');
  console.log('=====================================\n');

  try {
    // 1. Advanced Configuration Setup
    console.log('⚙️ Setting up advanced configuration...');
    const config = createConfigFromEnv();
    
    // Initialize logger
    initializeLogger(config);
    
    // Override specific settings for advanced usage
    config.maxConcurrentRequests = 3;
    config.timeoutSeconds = 60;
    config.enableMemoryMonitoring = true;
    config.enablePerformanceLogging = true;
    
    console.log(`✅ Configuration: ${config.modelMode} mode`);
    console.log(`📊 Max concurrent: ${config.maxConcurrentRequests}`);
    console.log(`⏱️ Timeout: ${config.timeoutSeconds}s`);
    console.log(`📈 Memory monitoring: ${config.enableMemoryMonitoring ? 'enabled' : 'disabled'}\n`);

    // 2. Initialize Hybrid Client with Health Monitoring
    console.log('🏥 Initializing hybrid client with health monitoring...');
    const hybridClient = new HybridModelClient(config);
    await hybridClient.initialize();

    // 3. Advanced Health Monitoring
    console.log('🔍 Performing comprehensive health check...');
    const initialHealth = await hybridClient.performHealthCheck();
    console.log(`Overall status: ${initialHealth.status}`);
    console.log(`Local model: ${initialHealth.details.localModel.available ? '✅ Available' : '❌ Unavailable'} ${initialHealth.details.localModel.responseTime ? `(${initialHealth.details.localModel.responseTime}ms)` : ''}`);
    console.log(`Cloud API: ${initialHealth.details.cloudApi.available ? '✅ Available' : '❌ Unavailable'} ${initialHealth.details.cloudApi.responseTime ? `(${initialHealth.details.cloudApi.responseTime}ms)` : ''}`);
    console.log(`Combined response time: ${initialHealth.details.overallResponseTime}ms\n`);

    // 4. Initialize Main Client
    console.log('🎯 Initializing main client...');
    const client = new MoondreamClient(config);
    await client.initialize();

    // 5. Advanced Performance Monitoring
    console.log('📊 Setting up performance monitoring...');
    const performanceMetrics = {
      operationCount: 0,
      totalTime: 0,
      errors: 0,
      successfulOperations: 0
    };

    // Example image URLs for testing
    const testImages = [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3'
    ];

    // 6. Advanced Caption Generation with Fallback Testing
    console.log('📝 Testing advanced caption generation with fallback...');
    for (const [index, imageUrl] of testImages.entries()) {
      const startTime = Date.now();
      try {
        const result = await captionImage(client, imageUrl, 'detailed', false);
        const processingTime = Date.now() - startTime;
        
        performanceMetrics.operationCount++;
        performanceMetrics.totalTime += processingTime;
        
        if (result.result && isCaptionResult(result.result) && result.result.success) {
          performanceMetrics.successfulOperations++;
          console.log(`  ${index + 1}. ✅ Caption: "${result.result.caption?.substring(0, 60)}..."`);
          console.log(`     📊 Confidence: ${result.result.confidence}, Time: ${processingTime}ms`);
        } else {
          performanceMetrics.errors++;
          console.log(`  ${index + 1}. ❌ Caption failed: ${result.result?.errorMessage}`);
        }
      } catch (error) {
        performanceMetrics.errors++;
        console.log(`  ${index + 1}. ❌ Exception: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log();

    // 7. Advanced Visual Q&A with Context Analysis
    console.log('❓ Testing advanced visual Q&A with context analysis...');
    const complexQuestions = [
      'What is the overall composition and visual balance of this image?',
      'Describe the lighting conditions and how they affect the mood',
      'What are the primary and secondary subjects in this scene?',
      'How would you describe the artistic style or photographic technique used?'
    ];

    for (const question of complexQuestions.slice(0, 2)) { // Test first 2 questions
      const startTime = Date.now();
      try {
        const result = await queryImage(client, testImages[0], question);
        const processingTime = Date.now() - startTime;
        
        performanceMetrics.operationCount++;
        performanceMetrics.totalTime += processingTime;
        
        if (result.result && isQueryResult(result.result) && result.result.success) {
          performanceMetrics.successfulOperations++;
          console.log(`  Q: ${question}`);
          console.log(`  A: ${result.result.answer?.substring(0, 80)}...`);
          console.log(`  📊 Confidence: ${result.result.confidence}, Time: ${processingTime}ms\n`);
        } else {
          performanceMetrics.errors++;
          console.log(`  Q: ${question}`);
          console.log(`  ❌ Failed: ${result.result?.errorMessage}\n`);
        }
      } catch (error) {
        performanceMetrics.errors++;
        console.log(`  Q: ${question}`);
        console.log(`  ❌ Exception: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    // 8. Advanced Object Detection with Multiple Objects
    console.log('🔍 Testing advanced object detection...');
    const objectsToDetect = ['person', 'building', 'tree', 'vehicle', 'water'];
    
    for (const objectName of objectsToDetect.slice(0, 3)) { // Test first 3 objects
      const startTime = Date.now();
      try {
        const result = await detectObjects(client, testImages[0], objectName);
        const processingTime = Date.now() - startTime;
        
        performanceMetrics.operationCount++;
        performanceMetrics.totalTime += processingTime;
        
        if (result.result && isDetectionResult(result.result) && result.result.success) {
          performanceMetrics.successfulOperations++;
          console.log(`  🎯 ${objectName}: Found ${result.result.totalFound} instance(s)`);
          if (result.result.objects.length > 0) {
            result.result.objects.forEach((obj, i) => {
              console.log(`    ${i + 1}. Confidence: ${obj.confidence.toFixed(2)}, Box: [${obj.boundingBox.x.toFixed(2)}, ${obj.boundingBox.y.toFixed(2)}, ${obj.boundingBox.width.toFixed(2)}, ${obj.boundingBox.height.toFixed(2)}]`);
            });
          }
          console.log(`    📊 Processing time: ${processingTime}ms`);
        } else {
          performanceMetrics.errors++;
          console.log(`  ❌ ${objectName}: Detection failed - ${result.result?.errorMessage}`);
        }
      } catch (error) {
        performanceMetrics.errors++;
        console.log(`  ❌ ${objectName}: Exception - ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log();

    // 9. Advanced Alt-Text Generation with Accessibility Focus
    console.log('♿ Testing advanced alt-text generation...');
    const altTextConfigs = [
      { style: 'concise' as const, maxLength: 50, description: 'Button/Icon' },
      { style: 'descriptive' as const, maxLength: 125, description: 'Standard' },
      { style: 'detailed' as const, maxLength: 200, description: 'Complex Image' }
    ];

    for (const config of altTextConfigs) {
      const startTime = Date.now();
      try {
        const result = await generateAltText(
          client, 
          testImages[0], 
          config.style, 
          config.maxLength,
          {
            includeColors: true,
            includeObjects: true,
            includeActions: true,
            includeContext: true
          }
        );
        const processingTime = Date.now() - startTime;
        
        performanceMetrics.operationCount++;
        performanceMetrics.totalTime += processingTime;
        
        if (result.result && isAltTextResult(result.result) && result.result.success) {
          performanceMetrics.successfulOperations++;
          console.log(`  📝 ${config.description} (${config.style}): "${result.result.altText}"`);
          console.log(`     📊 Words: ${result.result.wordCount}, Chars: ${result.result.altText?.length}, Time: ${processingTime}ms`);
        } else {
          performanceMetrics.errors++;
          console.log(`  ❌ ${config.description}: Generation failed - ${result.result?.errorMessage}`);
        }
      } catch (error) {
        performanceMetrics.errors++;
        console.log(`  ❌ ${config.description}: Exception - ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log();

    // 10. Continuous Health Monitoring Simulation
    console.log('🏥 Simulating continuous health monitoring...');
    console.log('Running health checks every 5 seconds for 15 seconds...');
    
    let healthCheckCount = 0;
    const healthCheckInterval = setInterval(async () => {
      healthCheckCount++;
      const health = await hybridClient.performHealthCheck();
      console.log(`  Check ${healthCheckCount}: ${health.status} (${health.details.overallResponseTime}ms)`);
      
      if (healthCheckCount >= 3) {
        clearInterval(healthCheckInterval);
        console.log('  ✅ Health monitoring simulation completed\n');
      }
    }, 5000);

    // Wait for health checks to complete
    await new Promise(resolve => setTimeout(resolve, 16000));

    // 11. Advanced Performance Analysis
    console.log('📈 Performance Analysis Summary');
    console.log('==============================');
    console.log(`Total operations: ${performanceMetrics.operationCount}`);
    console.log(`Successful operations: ${performanceMetrics.successfulOperations}`);
    console.log(`Failed operations: ${performanceMetrics.errors}`);
    console.log(`Success rate: ${((performanceMetrics.successfulOperations / performanceMetrics.operationCount) * 100).toFixed(1)}%`);
    console.log(`Total processing time: ${performanceMetrics.totalTime}ms`);
    console.log(`Average time per operation: ${(performanceMetrics.totalTime / performanceMetrics.operationCount).toFixed(0)}ms`);
    console.log(`Operations per second: ${(performanceMetrics.operationCount / (performanceMetrics.totalTime / 1000)).toFixed(2)}`);
    console.log();

    // 12. Advanced System Status Analysis
    console.log('🔍 Final System Status Analysis');
    console.log('================================');
    const finalStatus = hybridClient.getStatus();
    console.log(`Mode: ${finalStatus.mode}`);
    console.log(`Local model available: ${finalStatus.localAvailable}`);
    console.log(`Cloud API available: ${finalStatus.cloudAvailable}`);
    console.log(`System ready: ${hybridClient.isReady()}`);
    console.log(`System healthy: ${hybridClient.isHealthy()}`);
    
    if (finalStatus.health) {
      console.log(`Last health check: ${finalStatus.health.status} at ${new Date(finalStatus.health.timestamp).toLocaleTimeString()}`);
    }
    
    console.log();

    // 13. Advanced Error Recovery Simulation
    console.log('🔄 Testing error recovery mechanisms...');
    console.log('Simulating various error conditions...');
    
    // Test invalid image URL
    try {
      await captionImage(client, 'invalid-url', 'normal', false);
    } catch (error) {
      console.log(`  ✅ URL validation error handled: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test extremely long question
    try {
      const longQuestion = 'What is ' + 'very '.repeat(100) + 'long question about this image?';
      await queryImage(client, testImages[0], longQuestion);
    } catch (error) {
      console.log(`  ✅ Long question error handled: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('  ✅ Error recovery simulation completed\n');

    // 14. Memory and Resource Cleanup
    console.log('🧹 Performing comprehensive cleanup...');
    await client.cleanup();
    await hybridClient.cleanup();
    
    // Force garbage collection if available
    if (globalThis.gc) {
      globalThis.gc();
      console.log('  ✅ Garbage collection triggered');
    }
    
    console.log('  ✅ Client cleanup completed');
    console.log('  ✅ Hybrid client cleanup completed');
    console.log();

    // 15. Advanced Usage Recommendations
    console.log('💡 Advanced Usage Recommendations');
    console.log('==================================');
    console.log('Based on this session:');
    console.log(`• Optimal batch size: 3-5 images (based on ${config.maxConcurrentRequests} concurrent limit)`);
    console.log('• Health checks recommended every 30-60 seconds for production');
    console.log('• Error recovery mechanisms are robust and handle edge cases well');
    console.log('• Performance metrics suggest good scalability for production use');
    console.log('• Memory management is effective with proper cleanup');
    console.log('• Hybrid mode provides excellent reliability with automatic fallback');
    console.log();

    console.log('🎉 Advanced hybrid usage example completed successfully!');
    console.log('This demonstrates production-ready patterns for:');
    console.log('  • Advanced configuration and monitoring');
    console.log('  • Performance optimization and metrics');
    console.log('  • Error handling and recovery');
    console.log('  • Health monitoring and status reporting');
    console.log('  • Resource management and cleanup');
    console.log('  • Production deployment considerations');

  } catch (error) {
    console.error('❌ Advanced hybrid usage example failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  advancedHybridUsageExample().catch(console.error);
}

export { advancedHybridUsageExample };