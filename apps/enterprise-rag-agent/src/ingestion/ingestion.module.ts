import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentModule } from '../document/document.module';
import { ChunkMongoModelName, ChunkMongoSchema } from './chunk.model';
import { ChunkService } from './chunk.service';
import { CHUNK_EMBEDDING_QUEUE_NAME } from './embedding-queue.constants';
import { EmbeddingQueueService } from './embedding-queue.service';
import { ChunkEmbeddingProcessor } from './embedding.processor';
import { IngestionQueueModule } from './ingestion-queue.module';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    DocumentModule,
    IngestionQueueModule,
    BullModule.registerQueue({
      name: CHUNK_EMBEDDING_QUEUE_NAME,
    }),
    MongooseModule.forFeature([
      {
        name: ChunkMongoModelName,
        schema: ChunkMongoSchema,
      },
    ]),
  ],
  providers: [
    IngestionService,
    IngestionProcessor,
    ChunkService,
    EmbeddingQueueService,
    ChunkEmbeddingProcessor,
  ],
  exports: [IngestionService, ChunkService],
})
export class IngestionModule {}
