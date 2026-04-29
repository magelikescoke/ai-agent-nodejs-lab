import { BadRequestException, Injectable } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { QdrantVectorStoreService } from '../embedding/qdrant-vector-store.service';
import { RetrievalSearchRequest, RetrievalSearchResponse } from './dto/retrieval-search.dto';

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const MAX_QUERY_LENGTH = 2_000;

@Injectable()
export class RetrievalService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: QdrantVectorStoreService,
  ) {}

  public async search(request: RetrievalSearchRequest): Promise<RetrievalSearchResponse> {
    const normalizedRequest = this.normalizeSearchRequest(request);
    const embedding = await this.embeddingService.embedText(normalizedRequest.query);
    const chunks = await this.vectorStoreService.searchChunks({
      vector: embedding.embedding,
      topK: normalizedRequest.topK,
      filter: normalizedRequest.documentId
        ? {
            documentId: normalizedRequest.documentId,
          }
        : undefined,
    });

    return {
      query: normalizedRequest.query,
      topK: normalizedRequest.topK,
      filters: {
        documentId: normalizedRequest.documentId,
      },
      chunks,
    };
  }

  private normalizeSearchRequest(
    request: RetrievalSearchRequest,
  ): Required<Pick<RetrievalSearchRequest, 'query' | 'topK'>> &
    Pick<RetrievalSearchRequest, 'documentId'> {
    const query = typeof request.query === 'string' ? request.query.trim() : '';

    if (!query) {
      throw new BadRequestException('query is required');
    }

    if (query.length > MAX_QUERY_LENGTH) {
      throw new BadRequestException(`query must be ${MAX_QUERY_LENGTH} characters or fewer`);
    }

    const topK = request.topK ?? DEFAULT_TOP_K;

    if (!Number.isInteger(topK) || topK < 1 || topK > MAX_TOP_K) {
      throw new BadRequestException(`topK must be an integer between 1 and ${MAX_TOP_K}`);
    }

    return {
      query,
      topK,
      documentId: this.normalizeOptionalFilter(request.documentId, 'documentId'),
    };
  }

  private normalizeOptionalFilter(value: unknown, fieldName: string): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }
}
