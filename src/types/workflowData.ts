import { SharedData } from 'boba-t';
import { AnalysisResult, CaptionLength, AltTextStyle } from './models';
import { Config } from './config';

export interface MoondreamWorkflowData extends SharedData {
  // Input data
  imagePath?: string;
  imageUrls?: string[];
  question?: string;
  objectName?: string;
  captionLength?: CaptionLength;
  operation?: 'caption' | 'query' | 'detect' | 'point' | 'alt-text';
  stream?: boolean;

  // Alt-text specific parameters
  altTextStyle?: AltTextStyle;
  maxLength?: number;
  includeColors?: boolean;
  includeObjects?: boolean;
  includeActions?: boolean;
  includeContext?: boolean;

  // Processing data
  loadedImage?: Buffer; // Image buffer
  preprocessedImage?: Buffer;

  // Configuration
  config?: Config;

  // Results
  result?: AnalysisResult;
  batchResults?: AnalysisResult[];

  // Metadata
  processingStartTime?: Date;
  processingEndTime?: Date;
  errorContext?: Record<string, unknown>;
}
