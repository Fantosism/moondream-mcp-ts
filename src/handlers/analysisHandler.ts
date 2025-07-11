import { Handler } from 'boba-t';
import { Operation, AnalysisResult, MoondreamWorkflowData } from '@/types';
import {
  validateImagePath,
  validateOperation,
  createErrorResponse,
  sanitizeErrorMessage,
  isString,
  isBoolean,
  isNumber,
  isCaptionLength,
  isAltTextStyle,
} from '@/utils';

interface AnalysisRequest {
  imagePath: string;
  operation: Operation;
  parameters: Record<string, unknown>;
}

export class AnalysisHandler extends Handler<
  AnalysisRequest,
  AnalysisResult,
  MoondreamWorkflowData
> {
  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): AnalysisRequest {
    if (!sharedData.imagePath) {
      throw new Error('Image path is required for analysis');
    }

    if (!sharedData.operation) {
      throw new Error('Operation is required for analysis');
    }

    const imagePath = validateImagePath(sharedData.imagePath, {
      allowedDomains: [],
      blockedDomains: [],
      maxPathLength: 2048,
    });
    const operation = validateOperation(sharedData.operation);

    // Extract parameters from shared data based on operation
    const parameters: Record<string, unknown> = {};

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

    return {
      imagePath,
      operation,
      parameters,
    };
  }

  protected async handleRequest(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      // This handler acts as a router to the appropriate operation
      // In the pipeline, this would be connected to the specific handlers
      // For now, we'll return a generic result indicating the operation should be routed

      const result: AnalysisResult = {
        success: true,
        processingTimeMs: 0,
        metadata: {
          operation: request.operation,
          imagePath: request.imagePath,
          parameters: request.parameters,
          routingRequired: true,
        },
      };

      return result;
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error);
      const errorResponse = createErrorResponse(
        'ANALYSIS_ERROR',
        errorMessage,
        request.operation,
        request.imagePath
      );

      return {
        success: false,
        errorMessage: errorResponse.errorMessage,
        errorCode: errorResponse.errorCode,
        metadata: errorResponse.errorContext,
      };
    }
  }

  protected processResults(
    sharedData: MoondreamWorkflowData,
    inputs: AnalysisRequest,
    outputs: AnalysisResult
  ): string {
    // Store the routing information
    sharedData.operation = inputs.operation;
    sharedData.imagePath = inputs.imagePath;

    // Extract parameters back to shared data with type guards
    const params = inputs.parameters;
    if (params.length && isCaptionLength(params.length)) {
      sharedData.captionLength = params.length;
    }
    if (params.stream !== undefined && isBoolean(params.stream)) {
      sharedData.stream = params.stream;
    }
    if (params.question && isString(params.question)) {
      sharedData.question = params.question;
    }
    if (params.objectName && isString(params.objectName)) {
      sharedData.objectName = params.objectName;
    }
    if (params.style && isAltTextStyle(params.style)) {
      sharedData.altTextStyle = params.style;
    }
    if (params.maxLength && isNumber(params.maxLength)) {
      sharedData.maxLength = params.maxLength;
    }
    if (params.includeColors !== undefined && isBoolean(params.includeColors)) {
      sharedData.includeColors = params.includeColors;
    }
    if (params.includeObjects !== undefined && isBoolean(params.includeObjects)) {
      sharedData.includeObjects = params.includeObjects;
    }
    if (params.includeActions !== undefined && isBoolean(params.includeActions)) {
      sharedData.includeActions = params.includeActions;
    }
    if (params.includeContext !== undefined && isBoolean(params.includeContext)) {
      sharedData.includeContext = params.includeContext;
    }

    // Update processing metadata
    sharedData.processingStartTime = new Date();

    // Return action to route to the appropriate operation handler
    if (outputs.success && outputs.metadata?.routingRequired) {
      return `route_to_${inputs.operation.replace('-', '_')}`;
    } else {
      sharedData.errorContext = {
        operation: inputs.operation,
        imagePath: inputs.imagePath,
        errorCode: outputs.errorCode,
        errorMessage: outputs.errorMessage,
      };
      return 'analysis_error';
    }
  }
}
