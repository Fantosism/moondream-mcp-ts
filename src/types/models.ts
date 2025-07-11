// Enums
export type CaptionLength = 'short' | 'normal' | 'detailed';
export type AltTextStyle = 'concise' | 'descriptive' | 'detailed';
export type Operation = 'caption' | 'query' | 'detect' | 'point' | 'alt-text';
export type DeviceType = 'cpu' | 'cuda' | 'mps' | 'webgpu';

// Base interfaces
export interface ImageAnalysisRequest {
  imagePath: string;
}

// Request models
export interface CaptionRequest extends ImageAnalysisRequest {
  length?: CaptionLength;
  stream?: boolean;
}

export interface QueryRequest extends ImageAnalysisRequest {
  question: string;
}

export interface DetectionRequest extends ImageAnalysisRequest {
  objectName: string;
}

export interface PointingRequest extends ImageAnalysisRequest {
  objectName: string;
}

export interface AltTextRequest extends ImageAnalysisRequest {
  style?: AltTextStyle;
  maxLength?: number;
  includeColors?: boolean;
  includeObjects?: boolean;
  includeActions?: boolean;
  includeContext?: boolean;
}

export interface BatchAnalysisRequest {
  imagePaths: string[];
  operation: Operation;
  parameters: Record<string, unknown>;
}

// Geometry models
export interface BoundingBox {
  x: number; // 0.0-1.0 normalized
  y: number; // 0.0-1.0 normalized
  width: number; // 0.0-1.0 normalized
  height: number; // 0.0-1.0 normalized
}

export interface Point {
  x: number; // 0.0-1.0 normalized
  y: number; // 0.0-1.0 normalized
}

export interface DetectedObject {
  name: string;
  confidence: number; // 0.0-1.0
  boundingBox: BoundingBox;
}

export interface PointedObject {
  name: string;
  confidence: number; // 0.0-1.0
  point: Point;
}

// Base result interface
export interface AnalysisResult {
  success: boolean;
  processingTimeMs?: number;
  errorMessage?: string;
  errorCode?: string;
  metadata: Record<string, unknown>;
}

// Result models
export interface CaptionResult extends AnalysisResult {
  caption?: string;
  confidence?: number; // 0.0-1.0
  length?: CaptionLength;
}

export interface QueryResult extends AnalysisResult {
  answer?: string;
  question?: string;
  confidence?: number; // 0.0-1.0
}

export interface DetectionResult extends AnalysisResult {
  objects: DetectedObject[];
  objectName?: string;
  totalFound: number;
}

export interface PointingResult extends AnalysisResult {
  points: PointedObject[];
  objectName?: string;
  totalFound: number;
}

export interface AltTextResult extends AnalysisResult {
  altText?: string;
  style?: AltTextStyle;
  wordCount?: number;
  accessibility?: {
    includesColors: boolean;
    includesObjects: boolean;
    includesActions: boolean;
    includesContext: boolean;
  };
}

export interface BatchAnalysisResult extends AnalysisResult {
  results: AnalysisResult[];
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  totalProcessingTimeMs: number;
}

// Standard error response
export interface StandardError extends AnalysisResult {
  success: false;
  errorMessage: string;
  errorCode: string;
  errorContext: Record<string, unknown>;
  timestamp?: string;
}
