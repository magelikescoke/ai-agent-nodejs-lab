import { readFile } from 'fs/promises';
import { join } from 'path';
import { DocumentMetadata } from '../document/document.service';
import { TextDocumentSplitterStrategy } from './document-splitter.strategy';

describe('TextDocumentSplitterStrategy', () => {
  const strategy = new TextDocumentSplitterStrategy();

  it('supports text-like document metadata', () => {
    expect(
      strategy.supports(
        createDocumentMetadata({
          extension: '.md',
          mimeType: 'application/octet-stream',
        }),
      ),
    ).toBe(true);
    expect(
      strategy.supports(
        createDocumentMetadata({
          extension: '.bin',
          mimeType: 'text/plain',
        }),
      ),
    ).toBe(true);
    expect(
      strategy.supports(
        createDocumentMetadata({
          extension: '.pdf',
          mimeType: 'application/pdf',
        }),
      ),
    ).toBe(false);
  });

  it.each([
    ['product FAQ', 'product-faq.md'],
    ['technical guide', 'technical-guide.md'],
    ['operations runbook', 'operations-runbook.md'],
  ])('splits the %s sample into traceable chunks', async (_, filename) => {
    const content = await readFile(join(__dirname, '../../test-data', filename), 'utf8');
    const document = createDocumentMetadata({
      originalName: filename,
      extension: '.md',
      mimeType: 'text/markdown',
    });

    const chunks = await strategy.split(content, document);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk, index) => {
      expect(chunk.documentId).toBe(document.id);
      expect(chunk.chunkIndex).toBe(index);
      expect(chunk.content.trim().length).toBeGreaterThan(0);
      expect(chunk.content.length).toBeLessThanOrEqual(1000);
      expect(chunk.tokenCount).toBe(Math.ceil(chunk.content.trim().length / 4));
      expect(chunk.metadata).toEqual({
        source: filename,
      });
    });
  });

  function createDocumentMetadata(
    overrides: Partial<Pick<DocumentMetadata, 'originalName' | 'extension' | 'mimeType'>> = {},
  ): DocumentMetadata {
    return {
      id: 'document-id',
      originalName: 'sample.md',
      filename: 'stored-sample',
      mimeType: 'text/markdown',
      extension: '.md',
      size: 1,
      checksum: 'checksum',
      storagePath: '/tmp/sample.md',
      storageKey: 'stored-sample',
      status: 'uploaded',
      chunkCount: 0,
      errorMsg: null,
      createdAt: new Date('2026-04-29T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-04-29T00:00:00.000Z').toISOString(),
      ...overrides,
    };
  }
});
