import { Tool } from '@modelcontextprotocol/sdk/types.js';

// MCP Tool definitions for all Moondream operations
export const MOONDREAM_TOOLS: Tool[] = [
  {
    name: 'analyze_image',
    description: 'Multi-purpose image analysis tool supporting caption, query, detect, and point operations',
    inputSchema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Path to image file or URL',
        },
        operation: {
          type: 'string',
          enum: ['caption', 'query', 'detect', 'point'],
          description: 'Type of analysis to perform',
        },
        question: {
          type: 'string',
          description: 'Question to ask about the image (required for query operation)',
        },
        object_name: {
          type: 'string',
          description: 'Name of object to detect or point to (required for detect/point operations)',
        },
        length: {
          type: 'string',
          enum: ['short', 'normal', 'detailed'],
          default: 'normal',
          description: 'Length of caption to generate (for caption operation)',
        },
        stream: {
          type: 'boolean',
          default: false,
          description: 'Whether to stream the response (for caption operation)',
        },
      },
      required: ['image_path', 'operation'],
    },
  },
  {
    name: 'caption_image',
    description: 'Generate a descriptive caption for an image',
    inputSchema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Path to image file or URL',
        },
        length: {
          type: 'string',
          enum: ['short', 'normal', 'detailed'],
          default: 'normal',
          description: 'Length of caption to generate',
        },
        stream: {
          type: 'boolean',
          default: false,
          description: 'Whether to stream the response',
        },
      },
      required: ['image_path'],
    },
  },
  {
    name: 'query_image',
    description: 'Ask a question about an image and get a response',
    inputSchema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Path to image file or URL',
        },
        question: {
          type: 'string',
          description: 'Question to ask about the image',
        },
      },
      required: ['image_path', 'question'],
    },
  },
  {
    name: 'detect_objects',
    description: 'Detect and locate specific objects in an image',
    inputSchema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Path to image file or URL',
        },
        object_name: {
          type: 'string',
          description: 'Name of object to detect',
        },
      },
      required: ['image_path', 'object_name'],
    },
  },
  {
    name: 'point_objects',
    description: 'Locate specific objects in an image and return coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Path to image file or URL',
        },
        object_name: {
          type: 'string',
          description: 'Name of object to locate',
        },
      },
      required: ['image_path', 'object_name'],
    },
  },
  {
    name: 'generate_alt_text',
    description: 'Generate accessibility-focused alt-text for visually impaired users',
    inputSchema: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: 'Path to image file or URL',
        },
        style: {
          type: 'string',
          enum: ['concise', 'descriptive', 'detailed'],
          default: 'descriptive',
          description: 'Style of alt-text to generate',
        },
        max_length: {
          type: 'number',
          default: 125,
          description: 'Maximum character length for alt-text',
        },
        include_colors: {
          type: 'boolean',
          default: true,
          description: 'Include color information',
        },
        include_objects: {
          type: 'boolean',
          default: true,
          description: 'Include object information',
        },
        include_actions: {
          type: 'boolean',
          default: true,
          description: 'Include action information',
        },
        include_context: {
          type: 'boolean',
          default: true,
          description: 'Include contextual information',
        },
      },
      required: ['image_path'],
    },
  },
  {
    name: 'batch_analyze_images',
    description: 'Process multiple images with the same operation',
    inputSchema: {
      type: 'object',
      properties: {
        image_paths: {
          type: 'string',
          description: 'JSON string array of image file paths or URLs',
        },
        operation: {
          type: 'string',
          enum: ['caption', 'query', 'detect', 'point'],
          description: 'Operation to perform on all images',
        },
        question: {
          type: 'string',
          default: '',
          description: 'Question to ask about each image (for query operation)',
        },
        object_name: {
          type: 'string',
          default: '',
          description: 'Name of object to detect/point in each image (for detect/point operations)',
        },
        length: {
          type: 'string',
          enum: ['short', 'normal', 'detailed'],
          default: 'normal',
          description: 'Length of caption to generate (for caption operation)',
        },
        stream: {
          type: 'boolean',
          default: false,
          description: 'Whether to stream the response (for caption operation)',
        },
      },
      required: ['image_paths', 'operation'],
    },
  },
];

// Type for tool call arguments
export interface AnalyzeImageArgs {
  image_path: string;
  operation: 'caption' | 'query' | 'detect' | 'point';
  question?: string;
  object_name?: string;
  length?: 'short' | 'normal' | 'detailed';
  stream?: boolean;
}

export interface CaptionImageArgs {
  image_path: string;
  length?: 'short' | 'normal' | 'detailed';
  stream?: boolean;
}

export interface QueryImageArgs {
  image_path: string;
  question: string;
}

export interface DetectObjectsArgs {
  image_path: string;
  object_name: string;
}

export interface PointObjectsArgs {
  image_path: string;
  object_name: string;
}

export interface GenerateAltTextArgs {
  image_path: string;
  style?: 'concise' | 'descriptive' | 'detailed';
  max_length?: number;
  include_colors?: boolean;
  include_objects?: boolean;
  include_actions?: boolean;
  include_context?: boolean;
}

export interface BatchAnalyzeImagesArgs {
  image_paths: string; // JSON string
  operation: 'caption' | 'query' | 'detect' | 'point';
  question?: string;
  object_name?: string;
  length?: 'short' | 'normal' | 'detailed';
  stream?: boolean;
}

export interface BatchProcessImagesArgs {
  image_paths: string[];
  operation: 'caption' | 'query' | 'detect' | 'point' | 'alt-text';
  parameters?: Record<string, any>;
}

export type ToolCallArgs = 
  | CaptionImageArgs 
  | QueryImageArgs 
  | DetectObjectsArgs 
  | PointObjectsArgs 
  | GenerateAltTextArgs 
  | BatchProcessImagesArgs;