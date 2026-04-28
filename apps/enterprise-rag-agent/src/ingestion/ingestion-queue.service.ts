import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  INGESTION_JOB_NAME,
  INGESTION_QUEUE_NAME,
  IngestionJobData,
  IngestionJobResult,
  IngestionJobSummary,
} from './ingestion-queue.constants';

const INGESTION_JOB_ATTEMPTS = 3;
const INGESTION_JOB_BACKOFF_MS = 1_000;

@Injectable()
export class IngestionQueueService {
  constructor(
    @InjectQueue(INGESTION_QUEUE_NAME)
    private readonly ingestionQueue: Queue<IngestionJobData, IngestionJobResult>,
  ) {}

  public async enqueueDocument(documentId: string): Promise<IngestionJobSummary> {
    const job = await this.ingestionQueue.add(
      INGESTION_JOB_NAME,
      { documentId },
      {
        jobId: `${INGESTION_JOB_NAME}:${documentId}`,
        attempts: INGESTION_JOB_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: INGESTION_JOB_BACKOFF_MS,
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
    );

    return this.toJobSummary(job, documentId);
  }

  private toJobSummary(
    job: Job<IngestionJobData, IngestionJobResult>,
    documentId: string,
  ): IngestionJobSummary {
    return {
      id: String(job.id),
      documentId,
      queue: INGESTION_QUEUE_NAME,
      status: 'queued',
      createdAt: new Date(job.timestamp).toISOString(),
    };
  }
}
