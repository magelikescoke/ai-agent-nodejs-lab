import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chunk, ChunkMongoModelName, ChunkRecord } from './chunk.model';

export interface StoredChunk extends Chunk {
  id: string;
}

type PersistedChunkRecord = ChunkRecord & {
  _id: { toString(): string };
};

@Injectable()
export class ChunkService {
  constructor(
    @InjectModel(ChunkMongoModelName)
    private readonly chunkModel: Model<ChunkRecord>,
  ) {}

  public async replaceDocumentChunks(documentId: string, chunks: Chunk[]): Promise<StoredChunk[]> {
    await this.chunkModel.deleteMany({ documentId }).exec();

    if (chunks.length === 0) {
      return [];
    }

    const records = await this.chunkModel.create(chunks.map((chunk) => this.toChunkRecord(chunk)));

    return records.map((record) => this.toStoredChunk(record));
  }

  private toChunkRecord(chunk: Chunk): Chunk {
    return {
      documentId: chunk.documentId,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      tokenCount: chunk.tokenCount,
      metadata: chunk.metadata,
    };
  }

  private toStoredChunk(record: PersistedChunkRecord): StoredChunk {
    return {
      id: record._id.toString(),
      documentId: record.documentId,
      content: record.content,
      chunkIndex: record.chunkIndex,
      tokenCount: record.tokenCount,
      metadata: {
        source: record.metadata.source,
        heading: record.metadata.heading,
        pageNumber: record.metadata.pageNumber,
      },
    };
  }
}
