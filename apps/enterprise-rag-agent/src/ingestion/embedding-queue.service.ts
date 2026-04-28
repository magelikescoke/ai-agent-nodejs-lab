import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { StoredChunk } from './chunk.service';
import {
  CHUNK_EMBEDDING_JOB_NAME,
  CHUNK_EMBEDDING_QUEUE_NAME,
  ChunkEmbeddingJobData,
  ChunkEmbeddingJobResult,
} from './embedding-queue.constants';

const CHUNK_EMBEDDING_JOB_ATTEMPTS = 2;
const CHUNK_EMBEDDING_JOB_BACKOFF_MS = 1_000;

@Injectable()
export class EmbeddingQueueService {
  constructor(
    @InjectQueue(CHUNK_EMBEDDING_QUEUE_NAME)
    private readonly chunkEmbeddingQueue: Queue<ChunkEmbeddingJobData, ChunkEmbeddingJobResult>,
  ) {}

  public async enqueueChunks(chunks: StoredChunk[]): Promise<void> {
    await Promise.all(
      chunks.map((chunk) =>
        this.chunkEmbeddingQueue.add(
          CHUNK_EMBEDDING_JOB_NAME,
          {
            chunkId: chunk.id,
            documentId: chunk.documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata,
          },
          {
            jobId: `${CHUNK_EMBEDDING_JOB_NAME}:${chunk.id}`,
            attempts: CHUNK_EMBEDDING_JOB_ATTEMPTS,
            backoff: {
              type: 'exponential',
              delay: CHUNK_EMBEDDING_JOB_BACKOFF_MS,
            },
            removeOnComplete: {
              age: 24 * 60 * 60,
              count: 1_000,
            },
            removeOnFail: {
              age: 7 * 24 * 60 * 60,
              count: 1_000,
            },
          },
        ),
      ),
    );
  }
}
