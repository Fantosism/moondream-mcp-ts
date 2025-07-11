#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { MoondreamClient, createConfigFromEnv, initializeLogger } from '../src/utils';
import { generateAltText, batchGenerateAltText } from '../src/pipelines';
import { AltTextResult, BatchAnalysisResult, AnalysisResult } from '../src/types';

// Load environment variables
config();

// Type guard to check if result is AltTextResult
function isAltTextResult(result: AnalysisResult | undefined): result is AltTextResult {
  return result != null && 'altText' in result;
}

// Type guard to check if result is BatchAnalysisResult
function isBatchResult(result: AnalysisResult | undefined): result is BatchAnalysisResult {
  return result != null && 'totalProcessingTimeMs' in result;
}

async function altTextGenerationExample() {
  console.log('♿ Alt-Text Generation Example for Accessibility\n');

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

    // Example image URLs
    const imageUrls = [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
    ];

    // Example 1: Basic Alt-Text Generation
    console.log('📝 Generating basic alt-text...');
    const basicResult = await generateAltText(client, imageUrls[0]);
    
    if (isAltTextResult(basicResult.result) && basicResult.result.success) {
      console.log('Alt-text:', basicResult.result.altText);
      console.log('Word count:', basicResult.result.wordCount);
      console.log('Style:', basicResult.result.style);
      console.log('Processing time:', basicResult.result.processingTimeMs, 'ms');
    } else {
      console.log('❌ Basic alt-text generation failed:', basicResult.result?.errorMessage);
    }
    console.log();

    // Example 2: Concise Alt-Text (for buttons/icons)
    console.log('🎯 Generating concise alt-text...');
    const conciseResult = await generateAltText(client, imageUrls[0], 'concise', 50);
    
    if (isAltTextResult(conciseResult.result) && conciseResult.result.success) {
      console.log('Concise alt-text:', conciseResult.result.altText);
      console.log('Word count:', conciseResult.result.wordCount);
      console.log('Processing time:', conciseResult.result.processingTimeMs, 'ms');
    } else {
      console.log('❌ Concise alt-text generation failed:', conciseResult.result?.errorMessage);
    }
    console.log();

    // Example 3: Detailed Alt-Text (for complex images)
    console.log('📚 Generating detailed alt-text...');
    const detailedResult = await generateAltText(
      client, 
      imageUrls[0], 
      'detailed', 
      200, 
      {
        includeColors: true,
        includeObjects: true,
        includeActions: true,
        includeContext: true,
      }
    );
    
    if (isAltTextResult(detailedResult.result) && detailedResult.result.success) {
      console.log('Detailed alt-text:', detailedResult.result.altText);
      console.log('Word count:', detailedResult.result.wordCount);
      console.log('Accessibility features:', detailedResult.result.accessibility);
      console.log('Processing time:', detailedResult.result.processingTimeMs, 'ms');
    } else {
      console.log('❌ Detailed alt-text generation failed:', detailedResult.result?.errorMessage);
    }
    console.log();

    // Example 4: Customized Alt-Text (colors only)
    console.log('🌈 Generating color-focused alt-text...');
    const colorResult = await generateAltText(
      client, 
      imageUrls[0], 
      'descriptive', 
      100, 
      {
        includeColors: true,
        includeObjects: false,
        includeActions: false,
        includeContext: false,
      }
    );
    
    if (isAltTextResult(colorResult.result) && colorResult.result.success) {
      console.log('Color-focused alt-text:', colorResult.result.altText);
      console.log('Word count:', colorResult.result.wordCount);
      console.log('Processing time:', colorResult.result.processingTimeMs, 'ms');
    } else {
      console.log('❌ Color-focused alt-text generation failed:', colorResult.result?.errorMessage);
    }
    console.log();

    // Example 5: Batch Alt-Text Generation
    console.log('🔄 Generating batch alt-text...');
    const batchResult = await batchGenerateAltText(
      client, 
      imageUrls, 
      'descriptive', 
      125, 
      {
        includeColors: true,
        includeObjects: true,
        includeActions: true,
        includeContext: true,
      }
    );
    
    if (batchResult.result?.success) {
      console.log(`✅ Batch alt-text generation completed successfully`);
      console.log(`Processed ${batchResult.batchResults?.length || 0} images`);
      batchResult.batchResults?.forEach((result, i) => {
        if (isAltTextResult(result) && result.success) {
          console.log(`  ${i + 1}. ${result.altText} (${result.wordCount} words)`);
        } else {
          console.log(`  ${i + 1}. Failed: ${result.errorMessage}`);
        }
      });
    } else {
      console.log('❌ Batch alt-text generation failed:', batchResult.result?.errorMessage);
    }
    
    const batchTime = isBatchResult(batchResult.result) 
      ? batchResult.result.totalProcessingTimeMs 
      : batchResult.result?.processingTimeMs || 0;
    console.log('Total batch processing time:', batchTime, 'ms');
    console.log();

    // Example 6: Alt-Text Length Comparison
    console.log('📊 Alt-Text Length Comparison:');
    const styles: Array<'concise' | 'descriptive' | 'detailed'> = ['concise', 'descriptive', 'detailed'];
    
    for (const style of styles) {
      const result = await generateAltText(client, imageUrls[0], style);
      if (isAltTextResult(result.result) && result.result.success) {
        console.log(`  ${style.padEnd(12)}: ${result.result.altText} (${result.result.wordCount} words)`);
      }
    }
    console.log();

    // Accessibility Guidelines Summary
    console.log('♿ Accessibility Guidelines Summary:');
    console.log('  • Concise (≤50 chars): For buttons, icons, simple images');
    console.log('  • Descriptive (≤125 chars): For most images, WCAG recommended');
    console.log('  • Detailed (≤200 chars): For complex images, charts, diagrams');
    console.log('  • Focus on essential information that conveys the image\'s purpose');
    console.log('  • Avoid redundant phrases like "image of" or "picture showing"');
    console.log('  • Use present tense and be objective');
    console.log();

    // Cleanup
    await client.cleanup();
    console.log('✅ Alt-text generation example completed successfully!');

  } catch (error) {
    console.error('❌ Error running alt-text generation example:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  altTextGenerationExample().catch(console.error);
}

export { altTextGenerationExample };