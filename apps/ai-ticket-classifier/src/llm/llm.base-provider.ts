export abstract class LLMBaseProvider {
  public abstract getDefaultModelName(): string;

  public abstract generateText(prompt: string): Promise<string>;
}
