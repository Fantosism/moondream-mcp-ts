import { Handler } from 'boba-t';
import { PointingRequest, PointingResult, MoondreamWorkflowData } from '@/types';
import {
  MoondreamClient,
  validateImagePath,
  validateObjectName,
  createErrorResponse,
  getErrorCodeForException,
  sanitizeErrorMessage,
} from '@/utils';

export class PointingHandler extends Handler<
  PointingRequest,
  PointingResult,
  MoondreamWorkflowData
> {
  private client: MoondreamClient;

  constructor(client: MoondreamClient) {
    super();
    this.client = client;
  }

  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): PointingRequest {
    if (!sharedData.imagePath) {
      throw new Error('Image path is required for object pointing');
    }

    if (!sharedData.objectName) {
      throw new Error('Object name is required for object pointing');
    }

    const imagePath = validateImagePath(sharedData.imagePath, {
      allowedDomains: [],
      blockedDomains: [],
      maxPathLength: 2048
    });
    const objectName = validateObjectName(sharedData.objectName);

    return {
      imagePath,
      objectName,
    };
  }

  protected async handleRequest(request: PointingRequest): Promise<PointingResult> {
    try {
      const result = await this.client.pointObjects(request.imagePath, request.objectName);

      return result;
    } catch (error) {
      const errorCode = getErrorCodeForException(error);
      const errorMessage = sanitizeErrorMessage(error);
      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        'point',
        request.imagePath
      );

      return {
        success: false,
        points: [],
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
    inputs: PointingRequest,
    outputs: PointingResult
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
        return 'points_found';
      } else {
        return 'no_points_found';
      }
    } else {
      sharedData.errorContext = {
        operation: 'point',
        imagePath: inputs.imagePath,
        objectName: inputs.objectName,
        errorCode: outputs.errorCode,
        errorMessage: outputs.errorMessage,
      };
      return 'pointing_error';
    }
  }
}
