import OpenAI from 'openai';
import { LLMBaseProvider, type LLMJsonOutput, type LLMResponseFormat } from './llm.base-provider';

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
    const res = await client.chat.completions.create({
      model: this.getDefaultModelName(),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return res.choices[0]?.message.content ?? '';
  }

  public async generateJsonOutput<T>(
    systemPrompt: string,
    userPrompt: string,
    format: LLMResponseFormat,
  ): Promise<T> {
    const { parsedOutput } = await this.generateJsonOutputWithRaw<T>(
      systemPrompt,
      userPrompt,
      format,
    );

    return parsedOutput;
  }

  public async generateJsonOutputWithRaw<T>(
    systemPrompt: string,
    userPrompt: string,
    format: LLMResponseFormat,
  ): Promise<LLMJsonOutput<T>> {
    const client = this.getClient();
    const res = await client.chat.completions.create({
      model: this.getDefaultModelName(),
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        { role: 'user', content: userPrompt },
      ],
      response_format: format,
    });

    const choice = res.choices[0];
    if (choice?.finish_reason === 'stop' && choice.message.content) {
      const rawOutput = choice.message.content;

      return {
        rawOutput,
        parsedOutput: JSON.parse(rawOutput) as T,
      };
    }

    throw new Error(`LLM JSON output failed with finish_reason=${choice?.finish_reason ?? 'none'}`);
  }
}
