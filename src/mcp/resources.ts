import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { Config } from '@/types';

export function createMoondreamResources(_config: Config): Resource[] {
  return [
    {
      uri: 'moondream://config',
      name: 'Moondream Configuration',
      description: 'Current configuration settings for the Moondream server',
      mimeType: 'application/json',
    },
    {
      uri: 'moondream://model-info',
      name: 'Model Information',
      description: 'Information about the loaded Moondream model',
      mimeType: 'application/json',
    },
    {
      uri: 'moondream://supported-formats',
      name: 'Supported Image Formats',
      description: 'List of supported image formats and limits',
      mimeType: 'application/json',
    },
    {
      uri: 'moondream://operations',
      name: 'Available Operations',
      description: 'List of all available image analysis operations',
      mimeType: 'application/json',
    },
  ];
}

export function getResourceContent(uri: string, config: Config): any {
  switch (uri) {
    case 'moondream://config':
      return {
        modelName: config.modelName,
        modelRevision: config.modelRevision,
        device: config.device,
        maxImageSize: config.maxImageSize,
        maxFileSizeMb: config.maxFileSizeMb,
        supportedFormats: config.supportedFormats,
        timeoutSeconds: config.timeoutSeconds,
        requestTimeoutSeconds: config.requestTimeoutSeconds,
      };

    case 'moondream://model-info':
      return {
        name: config.modelName,
        revision: config.modelRevision,
        device: config.device,
        loaded: true, // Would check actual model state
        capabilities: [
          'image_captioning',
          'visual_question_answering',
          'object_detection',
          'object_pointing',
          'alt_text_generation',
          'batch_processing',
        ],
      };

    case 'moondream://supported-formats':
      return {
        formats: config.supportedFormats,
        maxFileSize: `${config.maxFileSizeMb}MB`,
        maxImageSize: config.maxImageSize,
        notes: [
          'Images are automatically converted to RGB format',
          'Large images are resized maintaining aspect ratio',
          'URLs and local file paths are both supported',
        ],
      };

    case 'moondream://operations':
      return {
        operations: [
          {
            name: 'caption_image',
            description: 'Generate descriptive captions for images',
            parameters: ['image_path', 'length', 'stream'],
          },
          {
            name: 'query_image',
            description: 'Ask questions about image content',
            parameters: ['image_path', 'question'],
          },
          {
            name: 'detect_objects',
            description: 'Detect and locate objects in images',
            parameters: ['image_path', 'object_name'],
          },
          {
            name: 'point_objects',
            description: 'Find coordinate points for objects',
            parameters: ['image_path', 'object_name'],
          },
          {
            name: 'generate_alt_text',
            description: 'Generate accessibility-focused alt-text',
            parameters: [
              'image_path',
              'style',
              'max_length',
              'include_colors',
              'include_objects',
              'include_actions',
              'include_context',
            ],
          },
          {
            name: 'batch_process_images',
            description: 'Process multiple images with the same operation',
            parameters: ['image_paths', 'operation', 'parameters'],
          },
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
