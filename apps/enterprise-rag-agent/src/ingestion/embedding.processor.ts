import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
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

  async process(
    job: Job<ChunkEmbeddingJobData, ChunkEmbeddingJobResult>,
  ): Promise<ChunkEmbeddingJobResult> {
    await job.updateProgress({
      status: 'mock-vectorizing',
      chunkId: job.data.chunkId,
      documentId: job.data.documentId,
      chunkIndex: job.data.chunkIndex,
    });

    this.logger.debug(
      `Mock vectorized chunk ${job.data.chunkId} for document ${job.data.documentId}`,
    );

    await job.updateProgress({
      status: 'mock-completed',
      chunkId: job.data.chunkId,
    });

    return {
      chunkId: job.data.chunkId,
      documentId: job.data.documentId,
      chunkIndex: job.data.chunkIndex,
      status: 'mocked',
    };
  }
}
