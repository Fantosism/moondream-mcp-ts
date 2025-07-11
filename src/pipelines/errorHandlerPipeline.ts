import { Handler } from 'boba-t';
import { StandardError } from '../types/models';
import { MoondreamWorkflowData } from '../types/workflowData';
import { formatResultAsJson } from '../utils/errorHandler';
import { isString } from '../utils/typeGuards';

interface ErrorContext {
  operation?: string;
  imagePath?: string;
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
}

export class ErrorHandlerPipeline extends Handler<
  ErrorContext,
  StandardError,
  MoondreamWorkflowData
> {
  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): ErrorContext {
    const errorContext = sharedData.errorContext || {};

    return {
      operation: isString(errorContext.operation) ? errorContext.operation : 'unknown',
      imagePath: isString(errorContext.imagePath)
        ? errorContext.imagePath
        : isString(sharedData.imagePath)
          ? sharedData.imagePath
          : 'unknown',
      errorCode: isString(errorContext.errorCode) ? errorContext.errorCode : 'UNKNOWN_ERROR',
      errorMessage: isString(errorContext.errorMessage)
        ? errorContext.errorMessage
        : 'An unknown error occurred',
      timestamp: new Date().toISOString(),
    };
  }

  protected async handleRequest(errorContext: ErrorContext): Promise<StandardError> {
    // Log the error (in production, this would go to a proper logging system)
    console.error('Error occurred during processing:', {
      operation: errorContext.operation,
      imagePath: errorContext.imagePath,
      errorCode: errorContext.errorCode,
      errorMessage: errorContext.errorMessage,
      timestamp: errorContext.timestamp,
    });

    // Create standardized error response
    const standardError: StandardError = {
      success: false,
      errorMessage: errorContext.errorMessage || 'Unknown error',
      errorCode: errorContext.errorCode || 'UNKNOWN_ERROR',
      errorContext: {
        operation: errorContext.operation,
        imagePath: errorContext.imagePath,
        timestamp: errorContext.timestamp,
      },
      timestamp: errorContext.timestamp,
      metadata: {
        operation: errorContext.operation,
        imagePath: errorContext.imagePath,
        timestamp: errorContext.timestamp,
        errorHandled: true,
      },
    };

    return standardError;
  }

  protected processResults(
    sharedData: MoondreamWorkflowData,
    inputs: ErrorContext,
    outputs: StandardError
  ): string {
    // Store the final error result
    sharedData.result = outputs;

    // Set processing end time
    if (!sharedData.processingEndTime) {
      sharedData.processingEndTime = new Date();
    }

    // Update error context with final error information
    sharedData.errorContext = {
      ...sharedData.errorContext,
      finalError: true,
      standardError: outputs,
    };

    // Log final error state
    console.error('Final error state:', formatResultAsJson(outputs));

    // Return final error action
    return 'error_handled';
  }
}
