import { BadRequestException } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { QdrantVectorStoreService } from '../embedding/qdrant-vector-store.service';
import { RetrievalService } from './retrieval.service';

describe('RetrievalService', () => {
  let embeddingService: { embedText: jest.Mock };
  let vectorStoreService: { searchChunks: jest.Mock };
  let service: RetrievalService;

  beforeEach(() => {
    embeddingService = {
      embedText: jest.fn().mockResolvedValue({
        embedding: [0.1, 0.2],
        model: 'embedding-3',
        dimensions: 1024,
      }),
    };
    vectorStoreService = {
      searchChunks: jest.fn().mockResolvedValue([
        {
          chunkId: 'chunk-id',
          documentId: 'document-id',
          chunkIndex: 1,
          content: 'SAML single sign-on setup',
          score: 0.91,
          metadata: {
            source: 'product-faq.md',
          },
        },
      ]),
    };
    service = new RetrievalService(
      embeddingService as unknown as EmbeddingService,
      vectorStoreService as unknown as QdrantVectorStoreService,
    );
  });

  it('embeds the query and searches all indexed chunks by default', async () => {
    await expect(
      service.search({
        query: '  SAML 登录怎么配置？  ',
        topK: 3,
      }),
    ).resolves.toEqual({
      query: 'SAML 登录怎么配置？',
      topK: 3,
      filters: {},
      chunks: [
        {
          chunkId: 'chunk-id',
          documentId: 'document-id',
          chunkIndex: 1,
          content: 'SAML single sign-on setup',
          score: 0.91,
          metadata: {
            source: 'product-faq.md',
          },
        },
      ],
    });
    expect(embeddingService.embedText).toHaveBeenCalledWith('SAML 登录怎么配置？');
    expect(vectorStoreService.searchChunks).toHaveBeenCalledWith({
      vector: [0.1, 0.2],
      topK: 3,
      filter: undefined,
    });
  });

  it('applies documentId only when the caller scopes retrieval to one document', async () => {
    await service.search({
      query: 'SAML 登录怎么配置？',
      topK: 3,
      documentId: 'document-id',
    });

    expect(vectorStoreService.searchChunks).toHaveBeenCalledWith({
      vector: [0.1, 0.2],
      topK: 3,
      filter: {
        documentId: 'document-id',
      },
    });
  });

  it('uses default topK and rejects invalid search input', async () => {
    await service.search({ query: 'billing' });

    expect(vectorStoreService.searchChunks).toHaveBeenLastCalledWith({
      vector: [0.1, 0.2],
      topK: 5,
      filter: undefined,
    });
    await expect(service.search({ query: '' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search({ query: 'test', topK: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
