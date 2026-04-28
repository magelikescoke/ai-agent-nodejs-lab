import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentService } from '../document/document.service';
import {
  INGESTION_QUEUE_NAME,
  IngestionJobData,
  IngestionJobResult,
} from './ingestion-queue.constants';
import { IngestionService } from './ingestion.service';

@Processor(INGESTION_QUEUE_NAME, {
  concurrency: 2,
})
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly documentService: DocumentService,
    private readonly ingestionService: IngestionService,
  ) {
    super();
  }

  async process(job: Job<IngestionJobData, IngestionJobResult>): Promise<IngestionJobResult> {
    const { documentId } = job.data;

    await job.updateProgress({ status: 'parsing', documentId });
    await this.documentService.updateStatus(documentId, 'parsing', null);

    try {
      await this.ingestionService.executeIngestionJob(documentId);
      await job.updateProgress({ status: 'indexed', documentId });
      await this.documentService.updateStatus(documentId, 'indexed', null);

      return {
        documentId,
        status: 'indexed',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ingestion failed';

      await job.updateProgress({ status: 'error', documentId, message });
      await this.documentService.updateStatus(documentId, 'error', message);
      this.logger.error(`Ingestion failed for document ${documentId}: ${message}`);

      throw error;
    }
  }
}
