import {
  AutoProcessor,
  AutoTokenizer,
  Moondream1ForConditionalGeneration,
  RawImage,
  env,
} from '@huggingface/transformers';
import { Config, ModelLoadError, InferenceError } from '@/types';
import { getLogger } from './logger';
import { ImageBuffer } from './imageLoader';

// Configure transformers environment
env.allowLocalModels = true;
env.useBrowserCache = false;
env.allowRemoteModels = true;

export class LocalModelClient {
  private model: any = null;
  private processor: any = null;
  private tokenizer: any = null;
  private isLoaded = false;
  private logger = getLogger();
  private config: Config;
  private readonly MODEL_ID = 'Xenova/moondream2';

  constructor(config: Config) {
    this.config = config;
    // Set cache directory for transformers
    if (config.modelCacheDir) {
      env.cacheDir = config.modelCacheDir;
    }
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    this.logger.info(
      'Loading Moondream model locally...',
      {
        modelName: this.config.modelName,
        modelRevision: this.config.modelRevision,
        device: this.config.device,
      },
      'local-model'
    );

    try {
      const startTime = Date.now();

      this.logger.info(
        'Loading Moondream2 model from Hugging Face...',
        {
          modelId: this.MODEL_ID,
          device: this.config.device,
        },
        'local-model'
      );

      // Load components with retry logic
      const retryOptions = { maxRetries: 3, retryDelay: 1000 };

      // Load processor and tokenizer with retry
      this.processor = await this.loadWithRetry(
        () => AutoProcessor.from_pretrained(this.MODEL_ID),
        'processor',
        retryOptions
      );

      this.tokenizer = await this.loadWithRetry(
        () => AutoTokenizer.from_pretrained(this.MODEL_ID),
        'tokenizer',
        retryOptions
      );

      // Load model with optimized settings based on device
      const modelOptions = this.getOptimizedModelOptions();
      this.model = await this.loadWithRetry(
        () => Moondream1ForConditionalGeneration.from_pretrained(this.MODEL_ID, modelOptions),
        'model',
        retryOptions
      );

      this.isLoaded = true;
      const loadTime = Date.now() - startTime;

      this.logger.info(
        'Moondream2 model loaded successfully',
        {
          loadTimeMs: loadTime,
          modelId: this.MODEL_ID,
          device: this.config.device,
          memoryUsage: this.getMemoryUsage(),
        },
        'local-model'
      );

      this.logger.performance(
        'model-loading',
        loadTime,
        {
          modelId: this.MODEL_ID,
          device: this.config.device,
        },
        'local-model'
      );
    } catch (error) {
      this.logger.error(
        'Failed to load local model',
        {
          error: error instanceof Error ? error.message : String(error),
          modelName: this.config.modelName,
          stack: error instanceof Error ? error.stack : undefined,
        },
        'local-model'
      );

      throw new ModelLoadError(
        `Failed to load local Moondream model: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async caption(
    imageBuffer: ImageBuffer,
    length: 'short' | 'normal' | 'detailed'
  ): Promise<{ caption: string; confidence: number }> {
    await this.ensureLoaded();

    try {
      const startTime = Date.now();

      // Prepare the prompt based on length
      let prompt = 'Describe this image.';
      switch (length) {
        case 'short':
          prompt = 'Briefly describe this image in one sentence.';
          break;
        case 'detailed':
          prompt =
            'Provide a detailed description of this image, including objects, colors, and scene details.';
          break;
      }

      // Convert buffer to RawImage format - create from buffer data
      const image = new RawImage(
        new Uint8Array(imageBuffer.data),
        imageBuffer.width,
        imageBuffer.height,
        imageBuffer.channels as 1 | 2 | 3 | 4
      );

      // Prepare the text input in the expected format
      const text = `<image>\n\nQuestion: ${prompt}\n\nAnswer:`;
      const text_inputs = this.tokenizer(text);

      // Process the image
      const vision_inputs = await this.processor!(image);

      // Generate caption with optimized parameters
      const generationParams = this.getGenerationParams(length);
      const outputs = await this.model.generate({
        ...text_inputs,
        ...vision_inputs,
        ...generationParams,
      });

      // Decode the output
      const decoded = this.tokenizer.batch_decode(outputs, { skip_special_tokens: true });
      const caption = decoded[0];

      // Clean up the caption (remove the prompt)
      const cleanCaption = this.cleanGeneratedText(caption, text);

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'local-caption-inference',
        inferenceTime,
        {
          length,
          captionLength: cleanCaption.length,
        },
        'local-model'
      );

      return {
        caption: cleanCaption.trim(),
        confidence: 0.85, // Transformers.js doesn't provide confidence scores
      };
    } catch (error) {
      this.logger.error(
        'Local caption inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'local-model'
      );

      throw new InferenceError(
        `Local caption inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async query(
    imageBuffer: ImageBuffer,
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    await this.ensureLoaded();

    try {
      const startTime = Date.now();

      // Convert buffer to RawImage format
      const image = new RawImage(
        new Uint8Array(imageBuffer.data),
        imageBuffer.width,
        imageBuffer.height,
        imageBuffer.channels as 1 | 2 | 3 | 4
      );

      // Prepare the text input in the expected format
      const text = `<image>\n\nQuestion: ${question}\n\nAnswer:`;
      const text_inputs = this.tokenizer(text);

      // Process the image
      const vision_inputs = await this.processor!(image);

      // Generate answer with optimized parameters
      const generationParams = this.getGenerationParams('normal');
      const outputs = await this.model.generate({
        ...text_inputs,
        ...vision_inputs,
        ...generationParams,
      });

      // Decode the output
      const decoded = this.tokenizer.batch_decode(outputs, { skip_special_tokens: true });
      const answer = decoded[0];

      // Clean up the answer (remove the question)
      const cleanAnswer = this.cleanGeneratedText(answer, text);

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'local-query-inference',
        inferenceTime,
        {
          questionLength: question.length,
          answerLength: cleanAnswer.length,
        },
        'local-model'
      );

      return {
        answer: cleanAnswer.trim(),
        confidence: 0.78,
      };
    } catch (error) {
      this.logger.error(
        'Local query inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
          question,
        },
        'local-model'
      );

      throw new InferenceError(
        `Local query inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async detect(imageBuffer: ImageBuffer, objectName: string): Promise<{ objects: any[] }> {
    await this.ensureLoaded();

    try {
      const startTime = Date.now();

      // For object detection, we use a detection prompt
      const prompt = `Where is the ${objectName} in this image? Provide the location as coordinates.`;

      // Convert buffer to RawImage format
      const image = new RawImage(
        new Uint8Array(imageBuffer.data),
        imageBuffer.width,
        imageBuffer.height,
        imageBuffer.channels as 1 | 2 | 3 | 4
      );

      // Prepare the text input in the expected format
      const text = `<image>\n\nQuestion: ${prompt}\n\nAnswer:`;
      const text_inputs = this.tokenizer(text);

      // Process the image
      const vision_inputs = await this.processor!(image);

      // Generate detection response with optimized parameters
      const generationParams = this.getGenerationParams('detailed');
      const outputs = await this.model.generate({
        ...text_inputs,
        ...vision_inputs,
        ...generationParams,
      });

      // Decode the output
      const decoded = this.tokenizer.batch_decode(outputs, { skip_special_tokens: true });
      const response = decoded[0];

      // Clean up the response
      const cleanResponse = this.cleanGeneratedText(response, text);

      // Parse the response to extract object information
      const objects = this.parseDetectionResponse(cleanResponse, objectName);

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'local-detection-inference',
        inferenceTime,
        {
          objectName,
          objectsFound: objects.length,
        },
        'local-model'
      );

      return { objects };
    } catch (error) {
      this.logger.error(
        'Local detection inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
          objectName,
        },
        'local-model'
      );

      throw new InferenceError(
        `Local detection inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async point(imageBuffer: ImageBuffer, objectName: string): Promise<{ points: any[] }> {
    await this.ensureLoaded();

    try {
      const startTime = Date.now();

      // For pointing, we use a pointing prompt
      const prompt = `Point to the ${objectName} in this image. Give me the exact coordinates.`;

      // Convert buffer to RawImage format
      const image = new RawImage(
        new Uint8Array(imageBuffer.data),
        imageBuffer.width,
        imageBuffer.height,
        imageBuffer.channels as 1 | 2 | 3 | 4
      );

      // Prepare the text input in the expected format
      const text = `<image>\n\nQuestion: ${prompt}\n\nAnswer:`;
      const text_inputs = this.tokenizer(text);

      // Process the image
      const vision_inputs = await this.processor!(image);

      // Generate pointing response with optimized parameters
      const generationParams = this.getGenerationParams('normal');
      const outputs = await this.model.generate({
        ...text_inputs,
        ...vision_inputs,
        ...generationParams,
      });

      // Decode the output
      const decoded = this.tokenizer.batch_decode(outputs, { skip_special_tokens: true });
      const response = decoded[0];

      // Clean up the response
      const cleanResponse = this.cleanGeneratedText(response, text);

      // Parse the response to extract pointing information
      const points = this.parsePointingResponse(cleanResponse, objectName);

      const inferenceTime = Date.now() - startTime;
      this.logger.performance(
        'local-pointing-inference',
        inferenceTime,
        {
          objectName,
          pointsFound: points.length,
        },
        'local-model'
      );

      return { points };
    } catch (error) {
      this.logger.error(
        'Local pointing inference failed',
        {
          error: error instanceof Error ? error.message : String(error),
          objectName,
        },
        'local-model'
      );

      throw new InferenceError(
        `Local pointing inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async cleanup(): Promise<void> {
    if (this.model) {
      // Dispose of the model if it has a dispose method
      if (typeof this.model.dispose === 'function') {
        await this.model.dispose();
      }
      this.model = null;
    }
    if (this.processor) {
      this.processor = null;
    }
    if (this.tokenizer) {
      this.tokenizer = null;
    }
    this.isLoaded = false;
    this.logger.info('Local model cleaned up', {}, 'local-model');
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      throw new ModelLoadError('Local model not loaded. Call initialize() first.');
    }
  }

  private parseDetectionResponse(response: string, objectName: string): any[] {
    const objects = [];

    // Enhanced parsing with multiple coordinate patterns
    const patterns = [
      // Standard coordinate pattern: "x:123.45 y:67.89 width:100.0 height:200.0"
      /x:\s*([\d.]+)\s+y:\s*([\d.]+)\s+width:\s*([\d.]+)\s+height:\s*([\d.]+)/gi,
      // Bracket pattern: "[123.45, 67.89, 100.0, 200.0]"
      /\[([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]/g,
      // Bounding box pattern: "bbox(123.45, 67.89, 100.0, 200.0)"
      /bbox\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g,
      // Generic number sequence (last resort)
      /\b([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\b/g,
    ];

    for (const pattern of patterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[2] && match[3] && match[4]) {
          objects.push({
            name: objectName,
            confidence: this.extractConfidence(response, 0.75),
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
            width: parseFloat(match[3]),
            height: parseFloat(match[4]),
          });
        }
      }
    }

    // If no structured coordinates found, attempt to extract from natural language
    if (objects.length === 0) {
      const naturalLanguageDetection = this.parseNaturalLanguageDetection(response, objectName);
      if (naturalLanguageDetection) {
        objects.push(naturalLanguageDetection);
      }
    }

    return objects;
  }

  private parsePointingResponse(response: string, objectName: string): any[] {
    const points = [];

    // Enhanced parsing with multiple coordinate patterns
    const patterns = [
      // Standard coordinate pattern: "x:123.45 y:67.89"
      /x:\s*([\d.]+)\s+y:\s*([\d.]+)/gi,
      // Bracket pattern: "[123.45, 67.89]"
      /\[([\d.]+),\s*([\d.]+)\]/g,
      // Point pattern: "point(123.45, 67.89)"
      /point\(([\d.]+),\s*([\d.]+)\)/g,
      // At pattern: "at 123.45, 67.89"
      /at\s+([\d.]+),\s*([\d.]+)/g,
      // Generic two-number sequence
      /\b([\d.]+)\s+([\d.]+)\b/g,
    ];

    for (const pattern of patterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[2]) {
          points.push({
            name: objectName,
            confidence: this.extractConfidence(response, 0.75),
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
          });
        }
      }
    }

    // If no structured coordinates found, attempt to extract from natural language
    if (points.length === 0) {
      const naturalLanguagePoint = this.parseNaturalLanguagePointing(response, objectName);
      if (naturalLanguagePoint) {
        points.push(naturalLanguagePoint);
      }
    }

    return points;
  }

  private cleanGeneratedText(generated: string, prompt: string): string {
    // Remove the prompt from the generated text
    let cleaned = generated;
    if (cleaned.toLowerCase().startsWith(prompt.toLowerCase())) {
      cleaned = cleaned.substring(prompt.length);
    }

    // Remove common prefixes
    const prefixes = ['Answer:', 'Response:', 'Output:', 'Result:', 'Caption:', 'Description:'];
    for (const prefix of prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.substring(prefix.length);
        break;
      }
    }

    // Remove common suffixes
    const suffixes = ['<|endoftext|>', '</s>', '<end>', '<|end|>'];
    for (const suffix of suffixes) {
      if (cleaned.toLowerCase().endsWith(suffix.toLowerCase())) {
        cleaned = cleaned.substring(0, cleaned.length - suffix.length);
        break;
      }
    }

    // Clean up extra whitespace and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  private extractConfidence(response: string, defaultConfidence: number): number {
    // Try to extract confidence from response
    const confidencePatterns = [
      /confidence:\s*([\d.]+)/i,
      /confidence\s*=\s*([\d.]+)/i,
      /([\d.]+)%\s*confidence/i,
      /score:\s*([\d.]+)/i,
    ];

    for (const pattern of confidencePatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        const confidence = parseFloat(match[1]);
        // Normalize percentage to 0-1 range
        return confidence > 1 ? confidence / 100 : confidence;
      }
    }

    return defaultConfidence;
  }

  private parseNaturalLanguageDetection(response: string, objectName: string): any | null {
    // Parse natural language descriptions like "The cat is in the center of the image"
    const centerPatterns = [/center|middle/i, /(?:in the|at the)\s+center/i];

    const cornerPatterns = [/(top|bottom)\s+(left|right)/i, /(upper|lower)\s+(left|right)/i];

    // Default to center if mentioned
    for (const pattern of centerPatterns) {
      if (pattern.test(response)) {
        return {
          name: objectName,
          confidence: 0.6,
          x: 0.5,
          y: 0.5,
          width: 0.3,
          height: 0.3,
        };
      }
    }

    // Check for corner positions
    for (const pattern of cornerPatterns) {
      const match = response.match(pattern);
      if (match) {
        const vertical = match[1].toLowerCase();
        const horizontal = match[2].toLowerCase();

        return {
          name: objectName,
          confidence: 0.6,
          x: horizontal === 'left' ? 0.25 : 0.75,
          y: vertical === 'top' || vertical === 'upper' ? 0.25 : 0.75,
          width: 0.3,
          height: 0.3,
        };
      }
    }

    return null;
  }

  private parseNaturalLanguagePointing(response: string, objectName: string): any | null {
    // Parse natural language descriptions for pointing
    const centerPatterns = [/center|middle/i, /(?:in the|at the)\s+center/i];

    const cornerPatterns = [/(top|bottom)\s+(left|right)/i, /(upper|lower)\s+(left|right)/i];

    // Default to center if mentioned
    for (const pattern of centerPatterns) {
      if (pattern.test(response)) {
        return {
          name: objectName,
          confidence: 0.6,
          x: 0.5,
          y: 0.5,
        };
      }
    }

    // Check for corner positions
    for (const pattern of cornerPatterns) {
      const match = response.match(pattern);
      if (match) {
        const vertical = match[1].toLowerCase();
        const horizontal = match[2].toLowerCase();

        return {
          name: objectName,
          confidence: 0.6,
          x: horizontal === 'left' ? 0.25 : 0.75,
          y: vertical === 'top' || vertical === 'upper' ? 0.25 : 0.75,
        };
      }
    }

    return null;
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  private async loadWithRetry<T>(
    loadFn: () => Promise<T>,
    componentName: string,
    options: { maxRetries: number; retryDelay: number }
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Loading ${componentName} (attempt ${attempt}/${options.maxRetries})`,
          {},
          'local-model'
        );
        return await loadFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Failed to load ${componentName} (attempt ${attempt}/${options.maxRetries})`,
          {
            error: lastError.message,
            attempt,
            maxRetries: options.maxRetries,
          },
          'local-model'
        );

        if (attempt < options.maxRetries) {
          await this.sleep(options.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw (
      lastError || new Error(`Failed to load ${componentName} after ${options.maxRetries} attempts`)
    );
  }

  private getOptimizedModelOptions(): any {
    const baseOptions = {
      dtype: {
        embed_tokens: 'fp16',
        vision_encoder: 'fp16',
        decoder_model_merged: 'q4', // Quantized for efficiency
      },
      device: this.config.device === 'cuda' ? 'webgpu' : 'cpu',
    };

    // Add device-specific optimizations
    if (this.config.device === 'webgpu') {
      return {
        ...baseOptions,
        device: 'webgpu',
        dtype: {
          ...baseOptions.dtype,
          // Use higher precision for GPU
          embed_tokens: 'fp32',
          vision_encoder: 'fp32',
        },
      };
    }

    if (this.config.device === 'cpu') {
      return {
        ...baseOptions,
        device: 'cpu',
        dtype: {
          ...baseOptions.dtype,
          // Use more aggressive quantization for CPU
          decoder_model_merged: 'q8',
        },
      };
    }

    return baseOptions;
  }

  private getMemoryUsage(): any {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        rss: Math.round(usage.rss / 1024 / 1024),
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      };
    }
    return {};
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getGenerationParams(length: 'short' | 'normal' | 'detailed'): any {
    const baseParams = {
      do_sample: true,
      temperature: 0.7,
      top_p: 0.95,
      top_k: 50,
      repetition_penalty: 1.1,
      pad_token_id: 0,
      eos_token_id: 2,
    };

    switch (length) {
      case 'short':
        return {
          ...baseParams,
          max_new_tokens: 50,
          temperature: 0.5, // Lower temperature for shorter, more focused responses
        };
      case 'detailed':
        return {
          ...baseParams,
          max_new_tokens: 200,
          temperature: 0.8, // Higher temperature for more creative detailed responses
        };
      case 'normal':
      default:
        return {
          ...baseParams,
          max_new_tokens: 100,
        };
    }
  }
}
