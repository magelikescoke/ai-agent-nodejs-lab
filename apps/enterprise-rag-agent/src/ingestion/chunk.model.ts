import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const ChunkMongoModelName = 'RagChunk';
export type ChunkMongoDocument = HydratedDocument<ChunkRecord>;

export interface ChunkMetadata {
  source: string;
  heading?: string;
  pageNumber?: number;
}

export interface Chunk {
  documentId: string;
  content: string;
  chunkIndex: number;
  tokenCount?: number;
  metadata: ChunkMetadata;
}

@Schema({
  _id: false,
  id: false,
})
export class ChunkRecordMetadata {
  @Prop({ type: String, required: true, trim: true })
  source!: string;

  @Prop({ type: String, trim: true })
  heading?: string;

  @Prop({ type: Number, min: 1 })
  pageNumber?: number;
}

export const ChunkRecordMetadataSchema = SchemaFactory.createForClass(ChunkRecordMetadata);

@Schema({
  collection: 'rag_chunks',
  id: false,
  timestamps: true,
  versionKey: false,
})
export class ChunkRecord {
  @Prop({ type: String, required: true, index: true })
  documentId!: string;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: Number, required: true, min: 0 })
  chunkIndex!: number;

  @Prop({ type: Number, min: 0 })
  tokenCount?: number;

  @Prop({ type: ChunkRecordMetadataSchema, required: true })
  metadata!: ChunkMetadata;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ChunkMongoSchema = SchemaFactory.createForClass(ChunkRecord);

ChunkMongoSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
ChunkMongoSchema.index({ 'metadata.source': 1 });
