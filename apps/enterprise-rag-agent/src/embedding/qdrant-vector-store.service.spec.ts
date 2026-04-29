import type { ConfigService } from '@nestjs/config';
import { QdrantVectorStoreService } from './qdrant-vector-store.service';

describe('QdrantVectorStoreService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('ensures the collection and upserts chunk vectors with retrieval payload', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ result: { status: 'green' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });
    global.fetch = fetchMock as unknown as typeof fetch;
    const service = new QdrantVectorStoreService(createConfigService());

    await service.upsertChunkVector({
      chunkId: 'chunk-id',
      documentId: 'document-id',
      chunkIndex: 0,
      content: 'chunk content',
      metadata: {
        source: 'handbook.md',
      },
      embedding: [0.1, 0.2],
      embeddingModel: 'embedding-3',
      embeddingDimensions: 1024,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:6333/collections/rag_chunks');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:6333/collections/rag_chunks',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          vectors: {
            size: 1024,
            distance: 'Cosine',
          },
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:6333/collections/rag_chunks/points?wait=true',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"chunkId":"chunk-id"'),
      }),
    );
  });

  function createConfigService(): ConfigService {
    return {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'app') {
          return {
            qdrantUrl: 'http://localhost:6333',
            qdrantCollectionName: 'rag_chunks',
          };
        }

        return {
          embeddingDimensions: 1024,
        };
      }),
    } as unknown as ConfigService;
  }
});
