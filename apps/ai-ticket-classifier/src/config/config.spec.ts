import { appConfig } from './app.config';
import { llmConfig } from './llm.config';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads app defaults', () => {
    delete process.env.PORT;
    delete process.env.MONGODB_URI;
    delete process.env.REDIS_URL;
    delete process.env.TICKET_ANALYSIS_PROMPT_VERSION;

    expect(appConfig()).toMatchObject({
      nodeEnv: 'test',
      port: 3000,
      redisUrl: 'redis://localhost:6379',
      ticketAnalysisPromptVersion: 'ticket-analysis-v1',
    });
  });

  it('loads ticket prompt version from environment variables', () => {
    process.env.TICKET_ANALYSIS_PROMPT_VERSION = 'ticket-analysis-v2';

    expect(appConfig()).toMatchObject({
      ticketAnalysisPromptVersion: 'ticket-analysis-v2',
    });
  });

  it('loads llm settings from environment variables', () => {
    process.env.GLM_MODEL = 'glm-test';
    process.env.GLM_API_KEY = 'test-key';
    process.env.GLM_BASE_URL = 'https://example.test/v1';
    process.env.GLM_TIMEOUT_MS = '5000';

    expect(llmConfig()).toEqual({
      providers: {
        glm: {
          model: 'glm-test',
          apiKey: 'test-key',
          baseUrl: 'https://example.test/v1',
          timeoutMs: 5000,
        },
      },
    });
  });
});
