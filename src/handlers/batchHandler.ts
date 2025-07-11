import { ParallelBatchHandler } from 'boba-t';
import { BatchAnalysisResult, AnalysisResult, MoondreamWorkflowData } from '@/types';
import {
  MoondreamClient,
  validateOperation,
  createErrorResponse,
  getErrorCodeForException,
  createBatchSummary,
  sanitizeErrorMessage,
} from '@/utils';

interface BatchItem {
  imagePath: string;
  operation: string;
  parameters: Record<string, any>;
}

export class BatchAnalysisHandler extends ParallelBatchHandler<
  BatchItem,
  AnalysisResult,
  MoondreamWorkflowData
> {
  private client: MoondreamClient;

  constructor(client: MoondreamClient) {
    super();
    this.client = client;
  }

  protected prepareBatchInputs(sharedData: Readonly<MoondreamWorkflowData>): BatchItem[] {
    if (!sharedData.imageUrls || sharedData.imageUrls.length === 0) {
      throw new Error('Image URLs are required for batch analysis');
    }

    if (!sharedData.operation) {
      throw new Error('Operation is required for batch analysis');
    }

    const imagePaths = sharedData.imageUrls; // Already validated
    const operation = validateOperation(sharedData.operation);

    // Extract parameters from shared data based on operation
    const parameters: Record<string, any> = {};

    switch (operation) {
      case 'caption':
        parameters.length = sharedData.captionLength || 'normal';
        parameters.stream = sharedData.stream || false;
        break;
      case 'query':
        if (!sharedData.question) {
          throw new Error('Question is required for query operation');
        }
        parameters.question = sharedData.question;
        break;
      case 'detect':
      case 'point':
        if (!sharedData.objectName) {
          throw new Error('Object name is required for detect/point operations');
        }
        parameters.objectName = sharedData.objectName;
        break;
      case 'alt-text':
        parameters.style = sharedData.altTextStyle || 'descriptive';
        parameters.maxLength = sharedData.maxLength || 125;
        parameters.includeColors = sharedData.includeColors ?? true;
        parameters.includeObjects = sharedData.includeObjects ?? true;
        parameters.includeActions = sharedData.includeActions ?? true;
        parameters.includeContext = sharedData.includeContext ?? true;
        break;
    }

    return imagePaths.map(imagePath => ({
      imagePath,
      operation,
      parameters,
    }));
  }

  protected async processSingleItem(item: BatchItem): Promise<AnalysisResult> {
    try {
      const startTime = Date.now();
      let result: AnalysisResult;

      switch (item.operation) {
        case 'caption':
          result = await this.client.captionImage(
            item.imagePath,
            item.parameters.length,
            item.parameters.stream
          );
          break;
        case 'query':
          result = await this.client.queryImage(item.imagePath, item.parameters.question);
          break;
        case 'detect':
          result = await this.client.detectObjects(item.imagePath, item.parameters.objectName);
          break;
        case 'point':
          result = await this.client.pointObjects(item.imagePath, item.parameters.objectName);
          break;
        case 'alt-text':
          result = await this.client.generateAltText(
            item.imagePath,
            item.parameters.style,
            item.parameters.maxLength,
            {
              includeColors: item.parameters.includeColors,
              includeObjects: item.parameters.includeObjects,
              includeActions: item.parameters.includeActions,
              includeContext: item.parameters.includeContext,
            }
          );
          break;
        default:
          throw new Error(`Unsupported operation: ${item.operation}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        ...result,
        processingTimeMs: processingTime,
        metadata: {
          ...result.metadata,
          imagePath: item.imagePath,
          operation: item.operation,
          parameters: item.parameters,
        },
      };
    } catch (error) {
      const errorCode = getErrorCodeForException(error);
      const errorMessage = sanitizeErrorMessage(error);
      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        item.operation,
        item.imagePath
      );

      return {
        success: false,
        errorMessage: errorResponse.errorMessage,
        errorCode: errorResponse.errorCode,
        metadata: {
          ...errorResponse.errorContext,
          imagePath: item.imagePath,
          operation: item.operation,
          parameters: item.parameters,
        },
      };
    }
  }

  protected processBatchResults(
    sharedData: MoondreamWorkflowData,
    inputs: BatchItem[],
    outputs: AnalysisResult[]
  ): string {
    const totalProcessingTime = outputs.reduce(
      (sum, result) => sum + (result.processingTimeMs || 0),
      0
    );

    const successful = outputs.filter(r => r.success).length;
    const failed = outputs.length - successful;

    const batchResult: BatchAnalysisResult = {
      success: failed === 0, // Only successful if all items succeeded
      results: outputs,
      totalProcessed: outputs.length,
      totalSuccessful: successful,
      totalFailed: failed,
      totalProcessingTimeMs: totalProcessingTime,
      metadata: createBatchSummary(outputs, inputs[0]?.operation || 'unknown', totalProcessingTime),
    };

    // Store the batch result in shared data
    sharedData.batchResults = outputs;
    sharedData.result = batchResult;

    // Update processing metadata
    if (sharedData.processingStartTime) {
      sharedData.processingEndTime = new Date();
    }

    // Return action based on success/failure
    if (batchResult.success) {
      return 'batch_complete';
    } else if (successful > 0) {
      return 'batch_partial_success';
    } else {
      sharedData.errorContext = {
        operation: 'batch_analysis',
        totalProcessed: outputs.length,
        totalFailed: failed,
        errors: outputs
          .filter(r => !r.success)
          .map(r => ({
            imagePath: r.metadata?.imagePath,
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
          })),
      };
      return 'batch_error';
    }
  }
}
