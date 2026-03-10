import OpenAI from 'openai';
import type { LLMProvider, LLMCallOptions, LLMStreamOptions, LLMStreamCallbacks, LLMConfig } from './types.js';

export class OpenAICompatProvider implements LLMProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseUrl && { baseURL: config.baseUrl }),
    });
    this.defaultModel = config.model;
  }

  async call(options: LLMCallOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 4096,
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.prompt },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }

  async stream(options: LLMStreamOptions, callbacks: LLMStreamCallbacks): Promise<void> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: options.system },
    ];

    if (options.messages) {
      for (const msg of options.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: options.prompt });

    const stream = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 10240,
      messages,
      stream: true,
    });

    try {
      let stopReason: string | undefined;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta != null) callbacks.onText(delta);
        const finishReason = chunk.choices[0]?.finish_reason;
        if (finishReason) stopReason = finishReason === 'length' ? 'max_tokens' : finishReason;
      }
      callbacks.onEnd({ stopReason });
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
