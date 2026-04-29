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
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { status: 'green' } }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
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
    const [collectionUrl, createCollectionRequest] = fetchMock.mock.calls[1];
    expect(collectionUrl).toBe('http://localhost:6333/collections/rag_chunks');
    expect(createCollectionRequest?.method).toBe('PUT');
    expect(createCollectionRequest?.body).toBe(
      JSON.stringify({
        vectors: {
          size: 1024,
          distance: 'Cosine',
        },
      }),
    );

    const [pointsUrl, upsertRequest] = fetchMock.mock.calls[2];
    expect(pointsUrl).toBe('http://localhost:6333/collections/rag_chunks/points?wait=true');
    expect(upsertRequest?.method).toBe('PUT');
    expect(upsertRequest?.body).toEqual(expect.stringContaining('"chunkId":"chunk-id"'));
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
