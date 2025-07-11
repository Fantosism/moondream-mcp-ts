import { Handler } from 'boba-t';
import { DetectionRequest, DetectionResult, MoondreamWorkflowData } from '@/types';
import {
  MoondreamClient,
  validateImagePath,
  validateObjectName,
  createErrorResponse,
  getErrorCodeForException,
  sanitizeErrorMessage,
} from '@/utils';

export class DetectionHandler extends Handler<
  DetectionRequest,
  DetectionResult,
  MoondreamWorkflowData
> {
  private client: MoondreamClient;

  constructor(client: MoondreamClient) {
    super();
    this.client = client;
  }

  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): DetectionRequest {
    if (!sharedData.imagePath) {
      throw new Error('Image path is required for object detection');
    }

    if (!sharedData.objectName) {
      throw new Error('Object name is required for object detection');
    }

    const imagePath = validateImagePath(sharedData.imagePath, {
      allowedDomains: [],
      blockedDomains: [],
      maxPathLength: 2048,
    });
    const objectName = validateObjectName(sharedData.objectName);

    return {
      imagePath,
      objectName,
    };
  }

  protected async handleRequest(request: DetectionRequest): Promise<DetectionResult> {
    try {
      const result = await this.client.detectObjects(request.imagePath, request.objectName);

      return result;
    } catch (error) {
      const errorCode = getErrorCodeForException(error);
      const errorMessage = sanitizeErrorMessage(error);
      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        'detect',
        request.imagePath
      );

      return {
        success: false,
        objects: [],
        totalFound: 0,
        objectName: request.objectName,
        errorMessage: errorResponse.errorMessage,
        errorCode: errorResponse.errorCode,
        metadata: errorResponse.errorContext,
      };
    }
  }

  protected processResults(
    sharedData: MoondreamWorkflowData,
    inputs: DetectionRequest,
    outputs: DetectionResult
  ): string {
    // Store the result in shared data
    sharedData.result = outputs;

    // Update processing metadata
    if (sharedData.processingStartTime) {
      sharedData.processingEndTime = new Date();
    }

    // Return action based on success/failure and findings
    if (outputs.success) {
      if (outputs.totalFound > 0) {
        return 'objects_found';
      } else {
        return 'no_objects_found';
      }
    } else {
      sharedData.errorContext = {
        operation: 'detect',
        imagePath: inputs.imagePath,
        objectName: inputs.objectName,
        errorCode: outputs.errorCode,
        errorMessage: outputs.errorMessage,
      };
      return 'detection_error';
    }
  }
}
