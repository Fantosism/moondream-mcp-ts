import { Pipeline } from 'boba-t';
import { MoondreamWorkflowData } from '@/types';
import { MoondreamClient, validateOperation, sanitizeErrorMessage } from '@/utils';
import { BatchAnalysisHandler } from '@/handlers';
import { ErrorHandlerPipeline } from './errorHandlerPipeline';

export function createBatchPipeline(client: MoondreamClient): Pipeline {
  // Create handlers
  const batchHandler = new BatchAnalysisHandler(client);
  const errorHandler = new ErrorHandlerPipeline();

  // Connect batch handler to error handler for error cases
  batchHandler.connectTo(errorHandler, 'batch_error');

  // Success paths end the pipeline
  // batchHandler: 'batch_complete', 'batch_partial_success' (both end)

  return new Pipeline(batchHandler);
}

export async function runBatchAnalysis(
  client: MoondreamClient,
  workflowData: MoondreamWorkflowData
): Promise<string> {
  const pipeline = createBatchPipeline(client);

  // Set processing start time
  workflowData.processingStartTime = new Date();

  try {
    const result = await pipeline.run(workflowData);

    // Set processing end time if not already set
    if (!workflowData.processingEndTime) {
      workflowData.processingEndTime = new Date();
    }

    return result;
  } catch (error) {
    // Set processing end time and error context
    workflowData.processingEndTime = new Date();
    workflowData.errorContext = {
      pipelineError: true,
      errorMessage: sanitizeErrorMessage(error),
      errorCode: 'BATCH_PIPELINE_ERROR',
    };

    throw error;
  }
}

// Convenience function for batch analysis
export async function batchAnalyzeImages(
  client: MoondreamClient,
  imagePaths: string[],
  operation: 'caption' | 'query' | 'detect' | 'point' | 'alt-text',
  parameters: Record<string, any> = {}
): Promise<MoondreamWorkflowData> {
  // Validate inputs
  const validatedPaths = imagePaths; // Already validated if coming from string
  const validatedOperation = validateOperation(operation);

  const workflowData: MoondreamWorkflowData = {
    imageUrls: validatedPaths,
    operation: validatedOperation,
  };

  // Set operation-specific parameters
  switch (operation) {
    case 'caption':
      workflowData.captionLength = parameters.length || 'normal';
      workflowData.stream = parameters.stream || false;
      break;
    case 'query':
      if (!parameters.question) {
        throw new Error('Question is required for query operation');
      }
      workflowData.question = parameters.question;
      break;
    case 'detect':
    case 'point':
      if (!parameters.objectName) {
        throw new Error('Object name is required for detect/point operations');
      }
      workflowData.objectName = parameters.objectName;
      break;
    case 'alt-text':
      workflowData.altTextStyle = parameters.style || 'descriptive';
      workflowData.maxLength = parameters.maxLength || 125;
      workflowData.includeColors = parameters.includeColors ?? true;
      workflowData.includeObjects = parameters.includeObjects ?? true;
      workflowData.includeActions = parameters.includeActions ?? true;
      workflowData.includeContext = parameters.includeContext ?? true;
      break;
  }

  await runBatchAnalysis(client, workflowData);
  return workflowData;
}

// Convenience functions for each batch operation type
export async function batchCaptionImages(
  client: MoondreamClient,
  imagePaths: string[],
  length: 'short' | 'normal' | 'detailed' = 'normal',
  stream: boolean = false
): Promise<MoondreamWorkflowData> {
  return await batchAnalyzeImages(client, imagePaths, 'caption', { length, stream });
}

export async function batchQueryImages(
  client: MoondreamClient,
  imagePaths: string[],
  question: string
): Promise<MoondreamWorkflowData> {
  return await batchAnalyzeImages(client, imagePaths, 'query', { question });
}

export async function batchDetectObjects(
  client: MoondreamClient,
  imagePaths: string[],
  objectName: string
): Promise<MoondreamWorkflowData> {
  return await batchAnalyzeImages(client, imagePaths, 'detect', { objectName });
}

export async function batchPointObjects(
  client: MoondreamClient,
  imagePaths: string[],
  objectName: string
): Promise<MoondreamWorkflowData> {
  return await batchAnalyzeImages(client, imagePaths, 'point', { objectName });
}

export async function batchGenerateAltText(
  client: MoondreamClient,
  imagePaths: string[],
  style: 'concise' | 'descriptive' | 'detailed' = 'descriptive',
  maxLength: number = 125,
  options: {
    includeColors?: boolean;
    includeObjects?: boolean;
    includeActions?: boolean;
    includeContext?: boolean;
  } = {}
): Promise<MoondreamWorkflowData> {
  return await batchAnalyzeImages(client, imagePaths, 'alt-text', {
    style,
    maxLength,
    ...options,
  });
}
