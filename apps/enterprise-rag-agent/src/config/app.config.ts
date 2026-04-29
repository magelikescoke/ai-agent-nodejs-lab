import { registerAs } from '@nestjs/config';

export interface AppConfiguration {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  redisUrl: string;
  qdrantUrl: string;
  qdrantCollectionName: string;
  documentStorageDir: string;
}

export const appConfig = registerAs(
  'app',
  (): AppConfiguration => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3001),
    mongodbUri:
      process.env.MONGODB_URI ??
      'mongodb://root:example@localhost:27017/enterprise_rag_agent?authSource=admin',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    qdrantUrl: process.env.QDRANT_URL ?? 'http://localhost:6333',
    qdrantCollectionName: process.env.QDRANT_COLLECTION_NAME ?? 'rag_chunks',
    documentStorageDir: process.env.DOCUMENT_STORAGE_DIR ?? 'storage/documents',
  }),
);
