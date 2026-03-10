import fs from 'fs';
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';
import { GoogleAuth } from 'google-auth-library';
import type { LLMProvider, LLMCallOptions, LLMStreamOptions, LLMStreamCallbacks, LLMConfig } from './types.js';

export class VertexProvider implements LLMProvider {
  private client: AnthropicVertex;
  private defaultModel: string;

  constructor(config: LLMConfig) {
    const projectId = config.vertexProjectId;
    if (!projectId) {
      throw new Error('VERTEX_PROJECT_ID / GCP_PROJECT_ID is required for Vertex AI provider');
    }

    const region = config.vertexRegion || 'us-east5';

    if (config.vertexCredentials) {
      let creds: Record<string, unknown>;
      const raw = config.vertexCredentials.trim();
      if (raw.startsWith('{')) {
        try {
          creds = JSON.parse(raw);
        } catch {
          throw new Error('VERTEX_SA_CREDENTIALS must be valid JSON');
        }
      } else {
        // Treat as a file path (GOOGLE_APPLICATION_CREDENTIALS)
        try {
          creds = JSON.parse(fs.readFileSync(raw, 'utf-8'));
        } catch {
          throw new Error(`Cannot read credentials file: ${raw}`);
        }
      }
      const auth = new GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.client = new AnthropicVertex({ projectId, region, googleAuth: auth as any, timeout: 10 * 60 * 1000 });
    } else {
      this.client = new AnthropicVertex({ projectId, region, timeout: 10 * 60 * 1000 });
    }

    this.defaultModel = config.model;
  }

  async call(options: LLMCallOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 4096,
      system: [{ type: 'text' as const, text: options.system, cache_control: { type: 'ephemeral' as const } }],
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
