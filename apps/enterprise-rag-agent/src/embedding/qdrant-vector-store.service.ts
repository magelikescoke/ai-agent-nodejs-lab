import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AppConfiguration } from '../config/app.config';
import { RagConfiguration } from '../config/rag.config';
import { ChunkMetadata } from '../ingestion/chunk.model';

export interface UpsertChunkVectorInput {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: ChunkMetadata;
  embedding: number[];
  embeddingModel: string;
  embeddingDimensions: number;
}

interface QdrantCollectionResponse {
  result?: {
    status?: string;
  };
}

@Injectable()
export class QdrantVectorStoreService {
  constructor(private readonly configService: ConfigService) {}

  public async upsertChunkVector(input: UpsertChunkVectorInput): Promise<void> {
    await this.ensureCollection();

    const appConfig = this.configService.getOrThrow<AppConfiguration>('app');
    const response = await fetch(
      `${this.getQdrantUrl(appConfig)}/collections/${appConfig.qdrantCollectionName}/points?wait=true`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: [
            {
              id: this.toPointId(input.chunkId),
              vector: input.embedding,
              payload: {
                chunkId: input.chunkId,
                documentId: input.documentId,
                chunkIndex: input.chunkIndex,
                content: input.content,
                metadata: input.metadata,
                embeddingModel: input.embeddingModel,
                embeddingDimensions: input.embeddingDimensions,
              },
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new BadGatewayException(`qdrant upsert returned ${response.status}`);
    }
  }

  private async ensureCollection(): Promise<void> {
    const appConfig = this.configService.getOrThrow<AppConfiguration>('app');
    const ragConfig = this.configService.getOrThrow<RagConfiguration>('rag');

    const collectionUrl = `${this.getQdrantUrl(appConfig)}/collections/${
      appConfig.qdrantCollectionName
    }`;
    const existingCollectionResponse = await fetch(collectionUrl);

    if (existingCollectionResponse.ok) {
      return;
    }

    if (existingCollectionResponse.status !== 404) {
      throw new BadGatewayException(
        `qdrant collection lookup returned ${existingCollectionResponse.status}`,
      );
    }

    const createCollectionResponse = await fetch(collectionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: {
          size: ragConfig.embeddingDimensions,
          distance: 'Cosine',
        },
      }),
    });

    if (!createCollectionResponse.ok) {
      throw new BadGatewayException(
        `qdrant collection setup returned ${createCollectionResponse.status}`,
      );
    }

    const body = (await createCollectionResponse.json()) as QdrantCollectionResponse;

    if (body.result?.status === 'red') {
      throw new BadGatewayException('qdrant collection is not ready');
    }
  }

  private getQdrantUrl(appConfig: AppConfiguration): string {
    return appConfig.qdrantUrl.replace(/\/$/, '');
  }

  private toPointId(chunkId: string): string {
    const hex = createHash('sha256').update(chunkId).digest('hex').slice(0, 32);

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20,
    )}-${hex.slice(20)}`;
  }
}
