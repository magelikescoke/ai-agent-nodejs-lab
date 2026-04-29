import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmbeddingService } from '../embedding/embedding.service';
import { QdrantVectorStoreService } from '../embedding/qdrant-vector-store.service';
import {
  CHUNK_EMBEDDING_QUEUE_NAME,
  ChunkEmbeddingJobData,
  ChunkEmbeddingJobResult,
} from './embedding-queue.constants';

@Processor(CHUNK_EMBEDDING_QUEUE_NAME, {
  concurrency: 3,
})
export class ChunkEmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(ChunkEmbeddingProcessor.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: QdrantVectorStoreService,
  ) {
    super();
  }

  async process(
    job: Job<ChunkEmbeddingJobData, ChunkEmbeddingJobResult>,
  ): Promise<ChunkEmbeddingJobResult> {
    await job.updateProgress({
      status: 'embedding',
      chunkId: job.data.chunkId,
      documentId: job.data.documentId,
      chunkIndex: job.data.chunkIndex,
    });

    const embedding = await this.embeddingService.embedText(job.data.content);

    await job.updateProgress({
      status: 'upserting',
      chunkId: job.data.chunkId,
      documentId: job.data.documentId,
      chunkIndex: job.data.chunkIndex,
      embeddingModel: embedding.model,
      embeddingDimensions: embedding.dimensions,
    });

    await this.vectorStoreService.upsertChunkVector({
      chunkId: job.data.chunkId,
      documentId: job.data.documentId,
      content: job.data.content,
      chunkIndex: job.data.chunkIndex,
      metadata: job.data.metadata,
      embedding: embedding.embedding,
      embeddingModel: embedding.model,
      embeddingDimensions: embedding.dimensions,
    });

    this.logger.debug(`Indexed chunk ${job.data.chunkId} for document ${job.data.documentId}`);

    await job.updateProgress({
      status: 'indexed',
      chunkId: job.data.chunkId,
    });

    return {
      chunkId: job.data.chunkId,
      documentId: job.data.documentId,
      chunkIndex: job.data.chunkIndex,
      embeddingModel: embedding.model,
      embeddingDimensions: embedding.dimensions,
      status: 'indexed',
    };
  }
}
