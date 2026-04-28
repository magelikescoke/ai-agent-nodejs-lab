import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { DocumentService } from '../document/document.service';
import { DocumentMetadata } from '../document/document.service';
import type { ChunkService } from './chunk.service';
import type { EmbeddingQueueService } from './embedding-queue.service';
import { IngestionService } from './ingestion.service';

describe('IngestionService', () => {
  let storageDir: string;
  let documentService: { getDocument: jest.Mock; updateChunkCount: jest.Mock };
  let chunkService: { replaceDocumentChunks: jest.Mock };
  let embeddingQueueService: { enqueueChunks: jest.Mock };
  let service: IngestionService;

  beforeEach(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'enterprise-rag-ingestion-'));
    documentService = {
      getDocument: jest.fn(),
      updateChunkCount: jest.fn(),
    };
    chunkService = {
      replaceDocumentChunks: jest.fn((_: string, chunks: unknown[]) =>
        Promise.resolve(
          chunks.map((chunk, index) => ({
            ...(chunk as object),
            id: `chunk-${index}`,
          })),
        ),
      ),
    };
    embeddingQueueService = {
      enqueueChunks: jest.fn(),
    };
    service = new IngestionService(
      documentService as unknown as DocumentService,
      chunkService as unknown as ChunkService,
      embeddingQueueService as unknown as EmbeddingQueueService,
    );
  });

  afterEach(async () => {
    await rm(storageDir, { force: true, recursive: true });
  });

  it('reads text-like document content through the text strategy', async () => {
    const storagePath = join(storageDir, 'handbook.md');
    await writeFile(storagePath, '# Handbook\n\nInternal onboarding notes.');
    const document = createDocumentMetadata({
      extension: '.md',
      mimeType: 'text/markdown',
      storagePath,
    });
    documentService.getDocument.mockResolvedValue(document);

    await service.executeIngestionJob(document.id);

    expect(chunkService.replaceDocumentChunks).toHaveBeenCalledWith(
      document.id,
      expect.arrayContaining([
        expect.objectContaining({
          documentId: document.id,
          content: expect.stringContaining('Internal onboarding notes.'),
          chunkIndex: 0,
        }),
      ]),
    );
    expect(documentService.updateChunkCount).toHaveBeenCalledWith(document.id, 1);
    expect(embeddingQueueService.enqueueChunks).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'chunk-0',
          documentId: document.id,
        }),
      ]),
    );
  });

  it('routes PDF documents to the reserved PDF strategy', async () => {
    const storagePath = join(storageDir, 'handbook.pdf');
    await writeFile(storagePath, 'pdf bytes');
    const document = createDocumentMetadata({
      extension: '.pdf',
      mimeType: 'application/pdf',
      storagePath,
    });
    documentService.getDocument.mockResolvedValue(document);

    await expect(service.executeIngestionJob(document.id)).rejects.toThrow(
      'PDF parsing is not implemented yet',
    );
  });

  it('throws when the document does not exist', async () => {
    documentService.getDocument.mockResolvedValue(null);

    await expect(service.executeIngestionJob('missing-id')).rejects.toThrow(
      'document missing-id not found',
    );
  });

  function createDocumentMetadata(
    overrides: Pick<DocumentMetadata, 'extension' | 'mimeType' | 'storagePath'>,
  ): DocumentMetadata {
    return {
      id: 'document-id',
      originalName: 'handbook.md',
      filename: 'stored-handbook',
      size: 1,
      checksum: 'checksum',
      storageKey: 'stored-handbook',
      status: 'uploaded',
      chunkCount: 0,
      errorMsg: null,
      createdAt: new Date('2026-04-28T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-04-28T00:00:00.000Z').toISOString(),
      ...overrides,
    };
  }
});
