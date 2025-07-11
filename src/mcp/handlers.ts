import { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MoondreamClient, validateQuestion, validateObjectName, validateAndParseImagePaths, createConfigFromEnv, createSecurityValidationConfig } from '@/utils';
import { ValidationError, ERROR_CODES, createStandardError } from '@/types';
import {
  captionImage,
  queryImage,
  detectObjects,
  pointObjects,
  generateAltText,
  batchCaptionImages,
  batchQueryImages,
  batchDetectObjects,
  batchPointObjects,
  batchGenerateAltText,
} from '@/pipelines';
import {
  CaptionResult,
  QueryResult,
  DetectionResult,
  PointingResult,
  AltTextResult,
} from '@/types';
import {
  AnalyzeImageArgs,
  CaptionImageArgs,
  QueryImageArgs,
  DetectObjectsArgs,
  PointObjectsArgs,
  GenerateAltTextArgs,
  BatchAnalyzeImagesArgs,
  BatchProcessImagesArgs,
} from './tools';

export class MoondreamMCPHandlers {
  private config = createConfigFromEnv();
  private securityConfig = createSecurityValidationConfig(this.config);

  constructor(private client: MoondreamClient) {}

  // Type guards
  private isCaptionResult(result: any): result is CaptionResult {
    return result && 'caption' in result;
  }

  private isQueryResult(result: any): result is QueryResult {
    return result && 'answer' in result;
  }

  private isDetectionResult(result: any): result is DetectionResult {
    return result && 'objects' in result;
  }

  private isPointingResult(result: any): result is PointingResult {
    return result && 'points' in result;
  }

  private isAltTextResult(result: any): result is AltTextResult {
    return result && 'altText' in result;
  }

  private async handleAnalyzeImage(args: AnalyzeImageArgs): Promise<CallToolResult> {
    try {
      // Validate required parameters based on operation
      switch (args.operation) {
        case 'query':
          if (!args.question) {
            const error = createStandardError(ERROR_CODES.MISSING_QUESTION, 'Question parameter is required for query operation', 'analyze_image');
            return {
              content: [{ type: 'text', text: JSON.stringify(error, null, 2) }],
              isError: true,
            };
          }
          validateQuestion(args.question);
          break;
        case 'detect':
        case 'point':
          if (!args.object_name) {
            const error = createStandardError(ERROR_CODES.MISSING_OBJECT_NAME, 'Object name parameter is required for detect/point operations', 'analyze_image');
            return {
              content: [{ type: 'text', text: JSON.stringify(error, null, 2) }],
              isError: true,
            };
          }
          validateObjectName(args.object_name);
          break;
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        const standardError = createStandardError(error.errorCode as any, error.message, 'analyze_image', error.errorContext);
        return {
          content: [{ type: 'text', text: JSON.stringify(standardError, null, 2) }],
          isError: true,
        };
      }
      throw error;
    }

    // Route to appropriate operation
    try {
      switch (args.operation) {
        case 'caption':
          return await this.handleCaptionImage({
            image_path: args.image_path,
            length: args.length || 'normal',
            stream: args.stream || false,
          });
        case 'query':
          return await this.handleQueryImage({
            image_path: args.image_path,
            question: args.question!,
          });
        case 'detect':
          return await this.handleDetectObjects({
            image_path: args.image_path,
            object_name: args.object_name!,
          });
        case 'point':
          return await this.handlePointObjects({
            image_path: args.image_path,
            object_name: args.object_name!,
          });
        default:
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Unknown operation: ${args.operation}`,
                  error_code: 'INVALID_OPERATION',
                }, null, 2),
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Error executing ${args.operation} operation: ${error instanceof Error ? error.message : String(error)}`,
              error_code: 'OPERATION_ERROR',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'analyze_image':
          return await this.handleAnalyzeImage(args as unknown as AnalyzeImageArgs);
        case 'caption_image':
          return await this.handleCaptionImage(args as unknown as CaptionImageArgs);
        case 'query_image':
          return await this.handleQueryImage(args as unknown as QueryImageArgs);
        case 'detect_objects':
          return await this.handleDetectObjects(args as unknown as DetectObjectsArgs);
        case 'point_objects':
          return await this.handlePointObjects(args as unknown as PointObjectsArgs);
        case 'generate_alt_text':
          return await this.handleGenerateAltText(args as unknown as GenerateAltTextArgs);
        case 'batch_analyze_images':
          return await this.handleBatchAnalyzeImages(args as unknown as BatchAnalyzeImagesArgs);
        case 'batch_process_images':
          return await this.handleBatchProcessImages(args as unknown as BatchProcessImagesArgs);
        default: {
          const error = createStandardError(ERROR_CODES.INVALID_OPERATION, `Unknown tool: ${name}`, name);
          return {
            content: [{ type: 'text', text: JSON.stringify(error, null, 2) }],
            isError: true,
          };
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        const standardError = createStandardError(error.errorCode as any, error.message, name, error.errorContext);
        return {
          content: [{ type: 'text', text: JSON.stringify(standardError, null, 2) }],
          isError: true,
        };
      }
      const standardError = createStandardError(ERROR_CODES.OPERATION_ERROR, `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`, name);
      return {
        content: [{ type: 'text', text: JSON.stringify(standardError, null, 2) }],
        isError: true,
      };
    }
  }

  private async handleCaptionImage(args: CaptionImageArgs): Promise<CallToolResult> {
    const result = await captionImage(
      this.client,
      args.image_path,
      args.length || 'normal',
      args.stream || false
    );

    if (result.result?.success && this.isCaptionResult(result.result)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              caption: result.result.caption,
              confidence: result.result.confidence,
              length: result.result.length,
              processingTimeMs: result.result.processingTimeMs,
            }, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.result?.errorMessage || 'Caption generation failed',
              errorCode: result.result?.errorCode,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  private async handleQueryImage(args: QueryImageArgs): Promise<CallToolResult> {
    const result = await queryImage(this.client, args.image_path, args.question);

    if (result.result?.success && this.isQueryResult(result.result)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              answer: result.result.answer,
              question: result.result.question,
              confidence: result.result.confidence,
              processingTimeMs: result.result.processingTimeMs,
            }, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.result?.errorMessage || 'Query failed',
              errorCode: result.result?.errorCode,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  private async handleDetectObjects(args: DetectObjectsArgs): Promise<CallToolResult> {
    const result = await detectObjects(this.client, args.image_path, args.object_name);

    if (result.result?.success && this.isDetectionResult(result.result)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              objects: result.result.objects,
              objectName: result.result.objectName,
              totalFound: result.result.totalFound,
              processingTimeMs: result.result.processingTimeMs,
            }, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.result?.errorMessage || 'Object detection failed',
              errorCode: result.result?.errorCode,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  private async handlePointObjects(args: PointObjectsArgs): Promise<CallToolResult> {
    const result = await pointObjects(this.client, args.image_path, args.object_name);

    if (result.result?.success && this.isPointingResult(result.result)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              points: result.result.points,
              objectName: result.result.objectName,
              totalFound: result.result.totalFound,
              processingTimeMs: result.result.processingTimeMs,
            }, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.result?.errorMessage || 'Object pointing failed',
              errorCode: result.result?.errorCode,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGenerateAltText(args: GenerateAltTextArgs): Promise<CallToolResult> {
    const result = await generateAltText(
      this.client,
      args.image_path,
      args.style || 'descriptive',
      args.max_length || 125,
      {
        includeColors: args.include_colors ?? true,
        includeObjects: args.include_objects ?? true,
        includeActions: args.include_actions ?? true,
        includeContext: args.include_context ?? true,
      }
    );

    if (result.result?.success && this.isAltTextResult(result.result)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              altText: result.result.altText,
              style: result.result.style,
              wordCount: result.result.wordCount,
              accessibility: result.result.accessibility,
              processingTimeMs: result.result.processingTimeMs,
            }, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.result?.errorMessage || 'Alt-text generation failed',
              errorCode: result.result?.errorCode,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  private async handleBatchAnalyzeImages(args: BatchAnalyzeImagesArgs): Promise<CallToolResult> {
    try {
      // Parse and validate image paths
      const imagePaths = validateAndParseImagePaths(args.image_paths, {
        allowedDomains: this.securityConfig.allowedDomains,
        blockedDomains: this.securityConfig.blockedDomains,
        maxPathLength: this.securityConfig.maxPathLength
      });

      // Validate required parameters based on operation  
      switch (args.operation) {
        case 'query':
          if (!args.question) {
            const error = createStandardError(ERROR_CODES.MISSING_QUESTION, 'Question parameter is required for query operation', 'batch_analyze_images');
            return {
              content: [{ type: 'text', text: JSON.stringify(error, null, 2) }],
              isError: true,
            };
          }
          validateQuestion(args.question);
          break;
        case 'detect':
        case 'point':
          if (!args.object_name) {
            const error = createStandardError(ERROR_CODES.MISSING_OBJECT_NAME, 'Object name parameter is required for detect/point operations', 'batch_analyze_images');
            return {
              content: [{ type: 'text', text: JSON.stringify(error, null, 2) }],
              isError: true,
            };
          }
          validateObjectName(args.object_name);
          break;
      }

      // Route to appropriate batch operation
      let result;
      switch (args.operation) {
        case 'caption':
          result = await batchCaptionImages(
            this.client,
            imagePaths,
            args.length || 'normal',
            args.stream || false
          );
          break;
        case 'query':
          result = await batchQueryImages(this.client, imagePaths, args.question!);
          break;
        case 'detect':
          result = await batchDetectObjects(this.client, imagePaths, args.object_name!);
          break;
        case 'point':
          result = await batchPointObjects(this.client, imagePaths, args.object_name!);
          break;
        default: {
          const error = createStandardError(ERROR_CODES.INVALID_OPERATION, `Unknown batch operation: ${args.operation}`, 'batch_analyze_images');
          return {
            content: [{ type: 'text', text: JSON.stringify(error, null, 2) }],
            isError: true,
          };
        }
      }

      if (result.result?.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                operation: args.operation,
                total_processed: result.batchResults?.length || 0,
                results: result.batchResults,
                processing_time_ms: result.result.processingTimeMs,
              }, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: result.result?.errorMessage || `Batch ${args.operation} failed`,
                error_code: result.result?.errorCode || 'BATCH_OPERATION_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        const standardError = createStandardError(error.errorCode as any, error.message, 'batch_analyze_images', error.errorContext);
        return {
          content: [{ type: 'text', text: JSON.stringify(standardError, null, 2) }],
          isError: true,
        };
      }
      const standardError = createStandardError(ERROR_CODES.BATCH_PROCESSING_ERROR, `Error in batch processing: ${error instanceof Error ? error.message : String(error)}`, 'batch_analyze_images');
      return {
        content: [{ type: 'text', text: JSON.stringify(standardError, null, 2) }],
        isError: true,
      };
    }
  }

  private async handleBatchProcessImages(args: BatchProcessImagesArgs): Promise<CallToolResult> {
    let result;
    
    switch (args.operation) {
      case 'caption':
        result = await batchCaptionImages(
          this.client,
          args.image_paths,
          args.parameters?.length || 'normal',
          args.parameters?.stream || false
        );
        break;
      case 'query':
        if (!args.parameters?.question) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Question parameter is required for query operation',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
        result = await batchQueryImages(this.client, args.image_paths, args.parameters.question);
        break;
      case 'detect':
        if (!args.parameters?.object_name) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Object name parameter is required for detect operation',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
        result = await batchDetectObjects(this.client, args.image_paths, args.parameters.object_name);
        break;
      case 'point':
        if (!args.parameters?.object_name) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Object name parameter is required for point operation',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
        result = await batchPointObjects(this.client, args.image_paths, args.parameters.object_name);
        break;
      case 'alt-text':
        result = await batchGenerateAltText(
          this.client,
          args.image_paths,
          args.parameters?.style || 'descriptive',
          args.parameters?.max_length || 125,
          {
            includeColors: args.parameters?.include_colors ?? true,
            includeObjects: args.parameters?.include_objects ?? true,
            includeActions: args.parameters?.include_actions ?? true,
            includeContext: args.parameters?.include_context ?? true,
          }
        );
        break;
      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Unknown batch operation: ${args.operation}`,
              }, null, 2),
            },
          ],
          isError: true,
        };
    }

    if (result.result?.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              operation: args.operation,
              totalProcessed: result.batchResults?.length || 0,
              results: result.batchResults,
              processingTimeMs: result.result.processingTimeMs,
            }, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.result?.errorMessage || `Batch ${args.operation} failed`,
              errorCode: result.result?.errorCode,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
}