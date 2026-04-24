import { GLMProvider } from './glm.provider';
import { LLMProviderFactory } from './llm.provider-factory';

describe('LLMProviderFactory', () => {
  const config = {
    provider: 'glm' as const,
    glm: {
      apiKey: 'test-key',
      baseUrl: 'https://example.test/v1',
      model: 'glm-test',
      timeoutMs: 5000,
    },
  };

  it('creates a GLM provider from GLM-specific config', () => {
    const glmProvider = new GLMProvider(config.glm);
    const provider = new LLMProviderFactory(glmProvider, 'glm').getProvider();

    expect(provider).toBeInstanceOf(GLMProvider);
    expect(provider.getDefaultModelName()).toBe('glm-test');
  });
});
