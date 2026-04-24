import OpenAI from 'openai';
import { LLMBaseProvider } from './llm.base-provider';

export interface OpenAiCompatibleProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export abstract class OpenAiCompatibleProvider extends LLMBaseProvider {
  private client?: OpenAI;

  protected constructor(protected readonly config: OpenAiCompatibleProviderConfig) {
    super();
  }

  protected getClient(): OpenAI {
    this.client ??= new OpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
      timeout: this.config.timeoutMs,
    });

    return this.client;
  }

  async generateText(prompt: string): Promise<string> {
    const client = this.getClient();
    const res = await client.responses.create({
      model: this.getDefaultModelName(),
      input: prompt,
    });

    return res.output_text;
  }
}
