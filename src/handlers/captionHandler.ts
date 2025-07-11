import { Handler } from 'boba-t';
import { CaptionRequest, CaptionResult, CaptionLength, MoondreamWorkflowData } from '@/types';
import {
  MoondreamClient,
  validateImagePath,
  validateCaptionLength,
  createErrorResponse,
  getErrorCodeForException,
  sanitizeErrorMessage,
} from '@/utils';

export class CaptionHandler extends Handler<CaptionRequest, CaptionResult, MoondreamWorkflowData> {
  private client: MoondreamClient;

  constructor(client: MoondreamClient) {
    super();
    this.client = client;
  }

  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): CaptionRequest {
    if (!sharedData.imagePath) {
      throw new Error('Image path is required for caption generation');
    }

    const imagePath = validateImagePath(sharedData.imagePath, {
      allowedDomains: [],
      blockedDomains: [],
      maxPathLength: 2048,
    });
    const length = sharedData.captionLength
      ? validateCaptionLength(sharedData.captionLength)
      : ('normal' as CaptionLength);
    const stream = sharedData.stream || false;

    return {
      imagePath,
      length,
      stream,
    };
  }

  protected async handleRequest(request: CaptionRequest): Promise<CaptionResult> {
    try {
      const result = await this.client.captionImage(
        request.imagePath,
        request.length,
        request.stream
      );

      return result;
    } catch (error) {
      const errorCode = getErrorCodeForException(error);
      const errorMessage = sanitizeErrorMessage(error);
      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        'caption',
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
    inputs: CaptionRequest,
    outputs: CaptionResult
  ): string {
    // Store the result in shared data
    sharedData.result = outputs;

    // Update processing metadata
    if (sharedData.processingStartTime) {
      sharedData.processingEndTime = new Date();
    }

    // Return action based on success/failure
    if (outputs.success) {
      return 'caption_complete';
    } else {
      sharedData.errorContext = {
        operation: 'caption',
        imagePath: inputs.imagePath,
        errorCode: outputs.errorCode,
        errorMessage: outputs.errorMessage,
      };
      return 'caption_error';
    }
  }
}
