// Type declarations for @xenova/transformers
declare module '@xenova/transformers' {
  export interface ModelConfig {
    revision?: string;
    dtype?: string;
    device?: string;
  }

  export interface ProcessorConfig {
    revision?: string;
  }

  export interface GenerationConfig {
    max_new_tokens?: number;
    do_sample?: boolean;
    temperature?: number;
  }

  export interface DecodingConfig {
    skip_special_tokens?: boolean;
  }

  export const env: {
    allowLocalModels: boolean;
    useBrowserCache: boolean;
    cacheDir?: string;
  };

  export class AutoModelForCausalLM {
    static from_pretrained(modelId: string, config?: ModelConfig): Promise<AutoModelForCausalLM>;
    generate(inputIds: any, config?: GenerationConfig): Promise<any[]>;
  }

  export class AutoProcessor {
    static from_pretrained(modelId: string, config?: ProcessorConfig): Promise<AutoProcessor>;
    process(image: Uint8Array | any, text?: string): Promise<any>;
    decode(tokens: any, config?: DecodingConfig): string;
  }

  export function pipeline(task: string, model?: string, config?: any): Promise<any>;
}
