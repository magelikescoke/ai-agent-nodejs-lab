import type { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

describe('EnterpriseRagAgent AppService', () => {
  it('returns service health and vector store target', () => {
    const configService = {
      getOrThrow: jest.fn(() => ({
        qdrantUrl: 'http://localhost:6333',
      })),
    } as unknown as ConfigService;
    const service = new AppService(configService);

    expect(service.getHealth()).toEqual({
      service: 'enterprise-rag-agent',
      status: 'ok',
      version: '0.1.0',
      vectorStore: {
        provider: 'qdrant',
        configuredUrl: 'http://localhost:6333',
      },
    });
  });
});
