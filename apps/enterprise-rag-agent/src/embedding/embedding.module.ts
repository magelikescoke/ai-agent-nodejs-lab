import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { QdrantVectorStoreService } from './qdrant-vector-store.service';

@Module({
  providers: [EmbeddingService, QdrantVectorStoreService],
  exports: [EmbeddingService, QdrantVectorStoreService],
})
export class EmbeddingModule {}
