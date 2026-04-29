import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagConfiguration } from '../config/rag.config';

interface EmbeddingApiItem {
  index: number;
  object: string;
  embedding: number[];
}

interface EmbeddingApiResponse {
  data?: EmbeddingApiItem[];
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}

  public async embedText(text: string): Promise<EmbeddingResult> {
    const [embedding] = await this.embedBatch([text]);

    return embedding;
  }

  public async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) {
      return [];
    }

    const config = this.configService.getOrThrow<RagConfiguration>('rag');
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        input: texts,
        dimensions: config.embeddingDimensions,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!response.ok) {
      throw new BadGatewayException(`embedding provider returned ${response.status}`);
    }

    const body = (await response.json()) as EmbeddingApiResponse;
    const items = body.data ?? [];

    if (items.length !== texts.length) {
      throw new BadGatewayException('embedding provider returned an unexpected result count');
    }

    return items
      .sort((left, right) => left.index - right.index)
      .map((item) => ({
        embedding: item.embedding,
        model: config.embeddingModel,
        dimensions: config.embeddingDimensions,
      }));
  }
}
