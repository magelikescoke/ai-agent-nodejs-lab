import { Injectable, NotFoundException, UnsupportedMediaTypeException } from '@nestjs/common';
import { DocumentMetadata, DocumentService } from '../document/document.service';
import { Chunk } from './chunk.model';
import { ChunkService } from './chunk.service';
import {
  createDefaultDocumentContentStrategies,
  DocumentContentStrategy,
} from './document-content.strategy';
import {
  createDefaultDocumentSplitterStrategies,
  DocumentSplitterStrategy,
} from './document-splitter.strategy';
import { EmbeddingQueueService } from './embedding-queue.service';

export interface IngestionExecutionResult {
  documentId: string;
  content: string;
}

@Injectable()
export class IngestionService {
  private readonly contentStrategies: DocumentContentStrategy[] =
    createDefaultDocumentContentStrategies();
  private readonly splitterStrategies: DocumentSplitterStrategy[] =
    createDefaultDocumentSplitterStrategies();

  constructor(
    private readonly documentService: DocumentService,
    private readonly chunkService: ChunkService,
    private readonly embeddingQueueService: EmbeddingQueueService,
  ) {}

  public async executeIngestionJob(documentId: string): Promise<void> {
    const document = await this.documentService.getDocument(documentId);

    if (!document) {
      throw new NotFoundException(`document ${documentId} not found`);
    }

    const content = await this.getDocumentContent(document);
    const chunks = await this.splitDocumentContent(document, content);
    const storedChunks = await this.chunkService.replaceDocumentChunks(document.id, chunks);

    await this.documentService.updateChunkCount(document.id, storedChunks.length);
    await this.embeddingQueueService.enqueueChunks(storedChunks);
  }

  private async getDocumentContent(document: DocumentMetadata): Promise<string> {
    const strategy = this.contentStrategies.find((contentStrategy) =>
      contentStrategy.supports(document),
    );

    if (!strategy) {
      throw new UnsupportedMediaTypeException(
        `No document content strategy for ${document.extension}`,
      );
    }

    return strategy.read(document);
  }

  private async splitDocumentContent(
    document: DocumentMetadata,
    content: string,
  ): Promise<Chunk[]> {
    const strategy = this.splitterStrategies.find((splitterStrategy) =>
      splitterStrategy.supports(document),
    );

    if (!strategy) {
      throw new UnsupportedMediaTypeException(
        `No document splitter strategy for ${document.extension}`,
      );
    }

    return strategy.split(content, document);
  }
}
