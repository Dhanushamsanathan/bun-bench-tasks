/**
 * GLM Client Configuration for Benchmarking
 * Access GLM models through Google Vertex AI infrastructure via OpenRouter
 *
 * This setup leverages the Google Cloud Partnership with Zhipu AI
 * to provide high throughput and low latency for GLM models.
 */

import OpenAI from 'openai';

// Available GLM models through Google Cloud Partnership
export const GLM_MODELS = {
  GLM_4_7: 'z-ai/glm-4.7',
  GLM_4_7_THINKING: 'z-ai/glm-4.7-thinking-preview',
  GLM_4_FLASH: 'z-ai/glm-4-flash',
} as const;

// Available Google Vertex AI models for comparison
export const VERTEX_MODELS = {
  GEMINI_3_FLASH: 'google/vertex-ai/gemini-3-flash-preview',
  GEMINI_3_PRO: 'google/vertex-ai/gemini-3-pro',
  GEMINI_2_5_FLASH: 'google/vertex-ai/gemini-2.5-flash-exp',
} as const;

// Type for response with reasoning details
export type GLMChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
  reasoning_details?: unknown;
};

/**
 * GLM Response with optional reasoning details
 */
export type GLMResponse = {
  content: string | null;
  reasoning_details?: unknown;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Main GLM client class for benchmarking
 */
export class GLMClient {
  private model: string;
  private client: OpenAI;

  constructor(model: keyof typeof GLM_MODELS | keyof typeof VERTEX_MODELS | string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not set in environment");
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });

    // Handle both GLM and Vertex models
    if (model in GLM_MODELS) {
      this.model = GLM_MODELS[model as keyof typeof GLM_MODELS];
    } else if (model in VERTEX_MODELS) {
      this.model = VERTEX_MODELS[model as keyof typeof VERTEX_MODELS];
    } else {
      this.model = model; // Use custom model string directly
    }
  }

  /**
   * Get model identifier and type info
   */
  getModelInfo(): { model: string; type: string; provider: string } {
    if (this.model.startsWith('z-ai/glm')) {
      return {
        model: this.model,
        type: 'GLM',
        provider: 'Zhipu AI via Google Cloud Partnership'
      };
    } else if (this.model.startsWith('google/vertex-ai/')) {
      return {
        model: this.model,
        type: 'Vertex AI',
        provider: 'Google Vertex AI'
      };
    } else {
      return {
        model: this.model,
        type: 'Other',
        provider: 'OpenRouter'
      };
    }
  }

  /**
   * Send a message to GLM/Vertex model
   * @param messages - Conversation history
   * @param enableReasoning - Enable extended thinking (default: true)
   * @returns Response with content and optional reasoning details
   */
  async chat(
    messages: GLMChatMessage[],
    enableReasoning: boolean = true
  ): Promise<GLMResponse> {
    try {
      const apiResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any, // OpenRouter handles the extended format
        reasoning: enableReasoning ? { enabled: true } : undefined,
      });

      const response = apiResponse.choices[0].message as GLMChatMessage;

      return {
        content: response.content || null,
        reasoning_details: (response as any).reasoning_details,
        usage: apiResponse.usage ? {
          prompt_tokens: apiResponse.usage.prompt_tokens,
          completion_tokens: apiResponse.usage.completion_tokens,
          total_tokens: apiResponse.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('GLM/Vertex API Error:', error);
      throw error;
    }
  }

  /**
   * Simple one-shot query
   * @param prompt - User message
   * @param enableReasoning - Enable extended thinking
   * @returns Response with content
   */
  async query(prompt: string, enableReasoning: boolean = true): Promise<string> {
    const messages: GLMChatMessage[] = [
      { role: 'user', content: prompt }
    ];

    const response = await this.chat(messages, enableReasoning);
    return response.content || '';
  }

  /**
   * Get current model identifier
   */
  getModel(): string {
    return this.model;
  }
}

// Convenience function for benchmark integration
export async function callModel(
  prompt: string,
  model: string,
  enableReasoning: boolean = true
): Promise<{ content: string; tokensUsed: number; duration: number; modelInfo: any }> {
  const client = new GLMClient(model);
  const modelInfo = client.getModelInfo();

  const startTime = performance.now();

  try {
    const response = await client.chat(
      [{ role: 'user', content: prompt }],
      enableReasoning
    );

    const duration = performance.now() - startTime;

    return {
      content: response.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      duration,
      modelInfo
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    throw error;
  }
}

// Export model lists for easy access
export const ALL_MODELS = {
  ...GLM_MODELS,
  ...VERTEX_MODELS
};

export const glmClient = new GLMClient('GLM_4_7');
