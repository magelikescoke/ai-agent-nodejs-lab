import { ChunkMetadata } from './chunk.model';

export const CHUNK_EMBEDDING_QUEUE_NAME = 'chunk-embedding';
export const CHUNK_EMBEDDING_JOB_NAME = 'chunk.embedding';

export interface ChunkEmbeddingJobData {
  chunkId: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: ChunkMetadata;
}

export interface ChunkEmbeddingJobResult {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  status: 'mocked';
}
