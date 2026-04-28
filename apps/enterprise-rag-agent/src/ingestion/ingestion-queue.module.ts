import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { INGESTION_QUEUE_NAME } from './ingestion-queue.constants';
import { IngestionQueueService } from './ingestion-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: INGESTION_QUEUE_NAME,
    }),
  ],
  providers: [IngestionQueueService],
  exports: [BullModule, IngestionQueueService],
})
export class IngestionQueueModule {}
