import { Handler } from 'boba-t';
import { AltTextRequest, AltTextResult, MoondreamWorkflowData } from '@/types';
import {
  MoondreamClient,
  validateImagePath,
  createErrorResponse,
  getErrorCodeForException,
  sanitizeErrorMessage,
} from '@/utils';

export class AltTextHandler extends Handler<AltTextRequest, AltTextResult, MoondreamWorkflowData> {
  private client: MoondreamClient;

  constructor(client: MoondreamClient) {
    super();
    this.client = client;
  }

  protected prepareInputs(sharedData: Readonly<MoondreamWorkflowData>): AltTextRequest {
    if (!sharedData.imagePath) {
      throw new Error('Image path is required for alt-text generation');
    }

    const imagePath = validateImagePath(sharedData.imagePath, {
      allowedDomains: [],
      blockedDomains: [],
      maxPathLength: 2048,
    });

    return {
      imagePath,
      style: sharedData.altTextStyle || 'descriptive',
      maxLength: sharedData.maxLength || 125, // WCAG recommended max
      includeColors: sharedData.includeColors ?? true,
      includeObjects: sharedData.includeObjects ?? true,
      includeActions: sharedData.includeActions ?? true,
      includeContext: sharedData.includeContext ?? true,
    };
  }

  protected async handleRequest(request: AltTextRequest): Promise<AltTextResult> {
    try {
      const startTime = Date.now();

      // Generate accessibility-focused prompt based on style and options
      const prompt = this.buildAltTextPrompt(request);

      // Use the client's query functionality with the specialized prompt
      const result = await this.client.queryImage(request.imagePath, prompt);

      const processingTime = Date.now() - startTime;

      if (!result.success) {
        return {
          success: false,
          errorMessage: result.errorMessage || 'Failed to generate alt-text',
          errorCode: result.errorCode || 'ALT_TEXT_GENERATION_ERROR',
          processingTimeMs: processingTime,
          metadata: {
            operation: 'alt-text',
            imagePath: request.imagePath,
            style: request.style,
            maxLength: request.maxLength,
          },
        };
      }

      // Process and clean the alt-text
      const rawAltText = result.answer || '';
      const processedAltText = this.processAltText(rawAltText, request);

      return {
        success: true,
        altText: processedAltText,
        style: request.style,
        wordCount: processedAltText.split(/\s+/).length,
        accessibility: {
          includesColors: request.includeColors || false,
          includesObjects: request.includeObjects || false,
          includesActions: request.includeActions || false,
          includesContext: request.includeContext || false,
        },
        processingTimeMs: processingTime,
        metadata: {
          operation: 'alt-text',
          imagePath: request.imagePath,
          style: request.style,
          maxLength: request.maxLength,
          originalLength: rawAltText.length,
          processedLength: processedAltText.length,
        },
      };
    } catch (error) {
      const errorCode = getErrorCodeForException(error);
      const errorMessage = sanitizeErrorMessage(error);
      const errorResponse = createErrorResponse(
        errorCode,
        errorMessage,
        'alt-text',
        request.imagePath
      );

      return {
        success: false,
        errorMessage: errorResponse.errorMessage,
        errorCode: errorResponse.errorCode,
        processingTimeMs: 0,
        metadata: {
          ...errorResponse.errorContext,
          operation: 'alt-text',
          imagePath: request.imagePath,
          style: request.style,
        },
      };
    }
  }

  protected processResults(
    sharedData: MoondreamWorkflowData,
    inputs: AltTextRequest,
    outputs: AltTextResult
  ): string {
    // Store the result in shared data
    sharedData.result = outputs;

    // Update processing metadata
    if (sharedData.processingStartTime) {
      sharedData.processingEndTime = new Date();
    }

    // Return action based on success/failure
    if (outputs.success) {
      return 'alt_text_complete';
    } else {
      sharedData.errorContext = {
        operation: 'alt-text',
        imagePath: inputs.imagePath,
        style: inputs.style,
        errorCode: outputs.errorCode,
        errorMessage: outputs.errorMessage,
      };
      return 'alt_text_error';
    }
  }

  private buildAltTextPrompt(request: AltTextRequest): string {
    const style = request.style || 'descriptive';
    const maxLength = request.maxLength || 125;

    let basePrompt = 'Generate alt-text for this image for visually impaired users. ';

    switch (style) {
      case 'concise':
        basePrompt += 'Keep it brief and essential. ';
        break;
      case 'descriptive':
        basePrompt += 'Provide a clear, informative description. ';
        break;
      case 'detailed':
        basePrompt += 'Include comprehensive details about the scene. ';
        break;
    }

    const includeInstructions = [];
    if (request.includeColors) {
      includeInstructions.push('important colors');
    }
    if (request.includeObjects) {
      includeInstructions.push('key objects and people');
    }
    if (request.includeActions) {
      includeInstructions.push('actions or activities');
    }
    if (request.includeContext) {
      includeInstructions.push('setting and context');
    }

    if (includeInstructions.length > 0) {
      basePrompt += `Focus on ${includeInstructions.join(', ')}. `;
    }

    basePrompt += `Keep the description under ${maxLength} characters. `;
    basePrompt += 'Write in present tense, be objective, and avoid subjective interpretations. ';
    basePrompt +=
      'Start directly with the description without phrases like "This image shows" or "The image depicts".';

    return basePrompt;
  }

  private processAltText(rawText: string, request: AltTextRequest): string {
    let processed = rawText.trim();

    // Remove common prefixes that screen readers don't need
    const unnecessaryPrefixes = [
      'This image shows',
      'This image depicts',
      'The image shows',
      'The image depicts',
      'In this image',
      'The picture shows',
      'This picture shows',
      'Based on the image',
      'I can see',
      'The photo shows',
      'This photo shows',
    ];

    for (const prefix of unnecessaryPrefixes) {
      if (processed.toLowerCase().startsWith(prefix.toLowerCase())) {
        processed = processed.substring(prefix.length).trim();
        // Capitalize first letter if it's not already
        processed = processed.charAt(0).toUpperCase() + processed.slice(1);
        break;
      }
    }

    // Ensure it doesn't end with a period if under max length
    if (processed.endsWith('.')) {
      processed = processed.slice(0, -1);
    }

    // Truncate if over max length
    const maxLength = request.maxLength || 125;
    if (processed.length > maxLength) {
      // Find the last complete word within the limit
      const truncated = processed.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.7) {
        // Don't truncate too aggressively
        processed = truncated.substring(0, lastSpace);
      } else {
        processed = truncated;
      }
    }

    return processed;
  }
}
