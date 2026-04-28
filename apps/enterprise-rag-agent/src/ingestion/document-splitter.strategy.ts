import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { DocumentMetadata } from '../document/document.service';
import { Chunk } from './chunk.model';

export interface DocumentSplitterStrategy {
  supports(document: DocumentMetadata): boolean;
  split(content: string, document: DocumentMetadata): Promise<Chunk[]>;
}

export class TextDocumentSplitterStrategy implements DocumentSplitterStrategy {
  private readonly supportedExtensions = new Set(['.txt', '.md', '.markdown']);
  private readonly supportedMimeTypes = new Set(['text/plain', 'text/markdown']);
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
    separators: ['\n## ', '\n### ', '\n\n', '\n', '。', '.', ' ', ''],
  });

  supports(document: DocumentMetadata): boolean {
    return (
      this.supportedExtensions.has(document.extension) ||
      this.supportedMimeTypes.has(document.mimeType)
    );
  }

  async split(content: string, document: DocumentMetadata): Promise<Chunk[]> {
    const chunks = await this.splitter.splitText(content);

    return chunks.map((chunkContent, chunkIndex) => ({
      documentId: document.id,
      content: chunkContent,
      chunkIndex,
      tokenCount: this.estimateTokenCount(chunkContent),
      metadata: {
        source: document.originalName,
      },
    }));
  }

  private estimateTokenCount(content: string): number {
    return Math.ceil(content.trim().length / 4);
  }
}

export function createDefaultDocumentSplitterStrategies(): DocumentSplitterStrategy[] {
  return [new TextDocumentSplitterStrategy()];
}
