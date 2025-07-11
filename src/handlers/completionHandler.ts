import { Handler } from 'boba-t';
import { MoondreamWorkflowData } from '@/types';

interface CompletionRequest {
  operationType: string;
  success: boolean;
}

interface CompletionResult {
  completed: boolean;
  finalResult: any;
}

export class CompletionHandler extends Handler<
  CompletionRequest,
  CompletionResult,
  MoondreamWorkflowData
> {
  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): CompletionRequest {
    return {
      operationType: sharedData.operation || 'unknown',
      success: sharedData.result?.success || false,
    };
  }

  protected async handleRequest(request: CompletionRequest): Promise<CompletionResult> {
    return {
      completed: true,
      finalResult: request.success,
    };
  }

  protected processResults(sharedData: MoondreamWorkflowData): string {
    // Set final processing time
    if (!sharedData.processingEndTime) {
      sharedData.processingEndTime = new Date();
    }

    // Pipeline ends here - return a flow control string with no connection
    return 'pipeline_complete';
  }
}
