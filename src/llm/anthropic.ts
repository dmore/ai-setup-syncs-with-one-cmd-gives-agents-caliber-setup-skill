import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMCallOptions, LLMStreamOptions, LLMStreamCallbacks, LLMConfig } from './types.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor(config: LLMConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.defaultModel = config.model;
  }

  async call(options: LLMCallOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 4096,
      system: [{ type: 'text', text: options.system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: options.prompt }],
    });

    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }

  async stream(options: LLMStreamOptions, callbacks: LLMStreamCallbacks): Promise<void> {
    const messages = options.messages
      ? [
          ...options.messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          { role: 'user' as const, content: options.prompt },
        ]
      : [{ role: 'user' as const, content: options.prompt }];

    const stream = this.client.messages.stream({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 10240,
      system: [{ type: 'text' as const, text: options.system, cache_control: { type: 'ephemeral' as const } }],
      messages,
    });

    let stopReason: string | undefined;

    stream.on('message', (message) => {
      stopReason = (message as unknown as Record<string, unknown>).stop_reason as string | undefined;
    });
    stream.on('text', (text) => callbacks.onText(text));
    stream.on('end', () => callbacks.onEnd({ stopReason }));
    stream.on('error', (error) => callbacks.onError(error));
  }
}
