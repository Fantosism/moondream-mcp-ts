import { Handler } from 'boba-t';
import { QueryRequest, QueryResult, MoondreamWorkflowData } from '@/types';
import {
  MoondreamClient,
  validateImagePath,
  validateQuestion,
  createErrorResponse,
  getErrorCodeForException,
  sanitizeErrorMessage,
} from '@/utils';

export class QueryHandler extends Handler<QueryRequest, QueryResult, MoondreamWorkflowData> {
  private client: MoondreamClient;

  constructor(client: MoondreamClient) {
    super();
    this.client = client;
  }

  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): QueryRequest {
    if (!sharedData.imagePath) {
      throw new Error('Image path is required for query processing');
    }

    if (!sharedData.question) {
      throw new Error('Question is required for query processing');
    }

    const imagePath = validateImagePath(sharedData.imagePath, {
      allowedDomains: [],
      blockedDomains: [],
      maxPathLength: 2048
    });
    const question = validateQuestion(sharedData.question);

    return {
      imagePath,
      question,
    };
  }

  protected async handleRequest(request: QueryRequest): Promise<QueryResult> {
    try {
      const result = await this.client.queryImage(request.imagePath, request.question);

      return result;
    } catch (error) {
      const errorCode = getErrorCodeForException(error);
      const errorMessage = sanitizeErrorMessage(error);
      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        'query',
        request.imagePath
      );

      return {
        success: false,
        errorMessage: errorResponse.errorMessage,
        errorCode: errorResponse.errorCode,
        question: request.question,
        metadata: errorResponse.errorContext,
      };
    }
  }

  protected processResults(
    sharedData: MoondreamWorkflowData,
    inputs: QueryRequest,
    outputs: QueryResult
  ): string {
    // Store the result in shared data
    sharedData.result = outputs;

    // Update processing metadata
    if (sharedData.processingStartTime) {
      sharedData.processingEndTime = new Date();
    }

    // Return action based on success/failure
    if (outputs.success) {
      return 'query_complete';
    } else {
      sharedData.errorContext = {
        operation: 'query',
        imagePath: inputs.imagePath,
        question: inputs.question,
        errorCode: outputs.errorCode,
        errorMessage: outputs.errorMessage,
      };
      return 'query_error';
    }
  }
}
