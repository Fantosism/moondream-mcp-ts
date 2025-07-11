import { Pipeline } from 'boba-t';
import { MoondreamWorkflowData } from '@/types';
import { MoondreamClient, sanitizeErrorMessage } from '@/utils';
import {
  CaptionHandler,
  QueryHandler,
  DetectionHandler,
  PointingHandler,
  AnalysisHandler,
  AltTextHandler,
} from '@/handlers';
import { CompletionHandler } from '@/handlers/completionHandler';
import { ErrorHandlerPipeline } from './errorHandlerPipeline';

export function createMoondreamPipeline(client: MoondreamClient): Pipeline {
  // Create all handlers
  const analysisHandler = new AnalysisHandler();
  const captionHandler = new CaptionHandler(client);
  const queryHandler = new QueryHandler(client);
  const detectionHandler = new DetectionHandler(client);
  const pointingHandler = new PointingHandler(client);
  const altTextHandler = new AltTextHandler(client);
  const completionHandler = new CompletionHandler();
  const errorHandler = new ErrorHandlerPipeline();

  // Connect analysis handler to route to appropriate operations
  analysisHandler.connectTo(captionHandler, 'route_to_caption');
  analysisHandler.connectTo(queryHandler, 'route_to_query');
  analysisHandler.connectTo(detectionHandler, 'route_to_detect');
  analysisHandler.connectTo(pointingHandler, 'route_to_point');
  analysisHandler.connectTo(altTextHandler, 'route_to_alt_text');
  analysisHandler.connectTo(errorHandler, 'analysis_error');

  // Connect all handlers to error handler for error cases
  captionHandler.connectTo(errorHandler, 'caption_error');
  queryHandler.connectTo(errorHandler, 'query_error');
  detectionHandler.connectTo(errorHandler, 'detection_error');
  pointingHandler.connectTo(errorHandler, 'pointing_error');
  altTextHandler.connectTo(errorHandler, 'alt_text_error');

  // Connect success paths to completion handler
  captionHandler.connectTo(completionHandler, 'caption_complete');
  queryHandler.connectTo(completionHandler, 'query_complete');
  detectionHandler.connectTo(completionHandler, 'objects_found');
  detectionHandler.connectTo(completionHandler, 'no_objects_found');
  pointingHandler.connectTo(completionHandler, 'points_found');
  pointingHandler.connectTo(completionHandler, 'no_points_found');
  altTextHandler.connectTo(completionHandler, 'alt_text_complete');

  return new Pipeline(analysisHandler);
}

export async function runMoondreamAnalysis(
  client: MoondreamClient,
  workflowData: MoondreamWorkflowData
): Promise<string> {
  const pipeline = createMoondreamPipeline(client);

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
      errorCode: 'PIPELINE_ERROR',
    };

    throw error;
  }
}

// Convenience functions for each operation type
export async function captionImage(
  client: MoondreamClient,
  imagePath: string,
  length: 'short' | 'normal' | 'detailed' = 'normal',
  stream: boolean = false
): Promise<MoondreamWorkflowData> {
  const workflowData: MoondreamWorkflowData = {
    imagePath,
    captionLength: length,
    stream,
    operation: 'caption',
  };

  await runMoondreamAnalysis(client, workflowData);
  return workflowData;
}

export async function queryImage(
  client: MoondreamClient,
  imagePath: string,
  question: string
): Promise<MoondreamWorkflowData> {
  const workflowData: MoondreamWorkflowData = {
    imagePath,
    question,
    operation: 'query',
  };

  await runMoondreamAnalysis(client, workflowData);
  return workflowData;
}

export async function detectObjects(
  client: MoondreamClient,
  imagePath: string,
  objectName: string
): Promise<MoondreamWorkflowData> {
  const workflowData: MoondreamWorkflowData = {
    imagePath,
    objectName,
    operation: 'detect',
  };

  await runMoondreamAnalysis(client, workflowData);
  return workflowData;
}

export async function pointObjects(
  client: MoondreamClient,
  imagePath: string,
  objectName: string
): Promise<MoondreamWorkflowData> {
  const workflowData: MoondreamWorkflowData = {
    imagePath,
    objectName,
    operation: 'point',
  };

  await runMoondreamAnalysis(client, workflowData);
  return workflowData;
}

export async function generateAltText(
  client: MoondreamClient,
  imagePath: string,
  style: 'concise' | 'descriptive' | 'detailed' = 'descriptive',
  maxLength: number = 125,
  options: {
    includeColors?: boolean;
    includeObjects?: boolean;
    includeActions?: boolean;
    includeContext?: boolean;
  } = {}
): Promise<MoondreamWorkflowData> {
  const workflowData: MoondreamWorkflowData = {
    imagePath,
    altTextStyle: style,
    maxLength,
    includeColors: options.includeColors ?? true,
    includeObjects: options.includeObjects ?? true,
    includeActions: options.includeActions ?? true,
    includeContext: options.includeContext ?? true,
    operation: 'alt-text',
  };

  await runMoondreamAnalysis(client, workflowData);
  return workflowData;
}
