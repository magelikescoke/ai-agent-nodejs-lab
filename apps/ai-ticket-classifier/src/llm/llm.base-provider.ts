import type { Stream } from 'openai/core/streaming';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import type { ResponseFormatJSONObject, ResponseFormatJSONSchema } from 'openai/resources/shared';

export type LLMResponseFormat = ResponseFormatJSONObject | ResponseFormatJSONSchema;
export type LLMTextStream = Stream<ChatCompletionChunk>;

export interface LLMJsonOutput<T> {
  rawOutput: string;
  parsedOutput: T;
}

export abstract class LLMBaseProvider {
  public abstract getDefaultModelName(): string;

  public abstract generateText(prompt: string): Promise<string>;

  public abstract generateJsonOutputWithRaw<T>(
    systemPrompt: string,
    userPrompt: string,
    format: LLMResponseFormat,
  ): Promise<LLMJsonOutput<T>>;

  public abstract generateJsonOutput<T>(
    systemPrompt: string,
    userPrompt: string,
    format: LLMResponseFormat,
  ): Promise<T>;

  public abstract generateTextWithStream(
    systemPrompt: string,
    userPrompt: string,
    format: LLMResponseFormat,
  ): Promise<LLMTextStream>;
}
