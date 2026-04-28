import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngestionQueueModule } from '../ingestion/ingestion-queue.module';
import { DocumentController } from './document.controller';
import { DocumentMongoModelName, DocumentMongoSchema } from './document.model';
import { DocumentService } from './document.service';

@Module({
  imports: [
    IngestionQueueModule,
    MongooseModule.forFeature([
      {
        name: DocumentMongoModelName,
        schema: DocumentMongoSchema,
      },
    ]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
