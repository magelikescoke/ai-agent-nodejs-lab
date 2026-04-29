import type { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('calls the configured embedding provider and maps vectors by index', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [
          { index: 1, object: 'embedding', embedding: [0.3, 0.4] },
          { index: 0, object: 'embedding', embedding: [0.1, 0.2] },
        ],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const service = new EmbeddingService(createConfigService());

    await expect(service.embedBatch(['first', 'second'])).resolves.toEqual([
      {
        embedding: [0.1, 0.2],
        model: 'embedding-3',
        dimensions: 1024,
      },
      {
        embedding: [0.3, 0.4],
        model: 'embedding-3',
        dimensions: 1024,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://open.bigmodel.cn/api/paas/v4/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          model: 'embedding-3',
          input: ['first', 'second'],
          dimensions: 1024,
        }),
      }),
    );
  });

  function createConfigService(): ConfigService {
    return {
      getOrThrow: jest.fn(() => ({
        apiKey: 'test-key',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        embeddingModel: 'embedding-3',
        embeddingDimensions: 1024,
        timeoutMs: 30000,
      })),
    } as unknown as ConfigService;
  }
});
