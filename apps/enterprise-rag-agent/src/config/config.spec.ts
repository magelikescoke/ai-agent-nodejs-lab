import { appConfig } from './app.config';
import { ragConfig } from './rag.config';

describe('enterprise rag config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads app defaults', () => {
    delete process.env.PORT;
    delete process.env.QDRANT_URL;
    delete process.env.QDRANT_COLLECTION_NAME;

    expect(appConfig()).toMatchObject({
      port: 3001,
      qdrantUrl: 'http://localhost:6333',
      qdrantCollectionName: 'rag_chunks',
      documentStorageDir: 'storage/documents',
    });
  });

  it('loads RAG provider settings from environment variables', () => {
    process.env.RAG_CHAT_MODEL = 'chat-test';
    process.env.RAG_EMBEDDING_MODEL = 'embedding-test';
    process.env.RAG_EMBEDDING_DIMENSIONS = '512';

    expect(ragConfig()).toMatchObject({
      chatModel: 'chat-test',
      embeddingModel: 'embedding-test',
      embeddingDimensions: 512,
    });
  });
});
