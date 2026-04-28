import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const DocumentMongoModelName = 'RagDocument';
export const DocumentStatuses = ['uploaded', 'parsing', 'indexed', 'error'] as const;
export type DocumentStatus = (typeof DocumentStatuses)[number];
export type DocumentMongoDocument = HydratedDocument<DocumentRecord>;

@Schema({
  collection: 'rag_documents',
  id: false,
  timestamps: true,
  versionKey: false,
})
export class DocumentRecord {
  @Prop({ type: String, required: true, trim: true })
  originalName!: string;

  @Prop({ type: String, required: true, trim: true })
  filename!: string;

  @Prop({ type: String, required: true, trim: true })
  mimeType!: string;

  @Prop({ type: String, required: true, trim: true })
  extension!: string;

  @Prop({ type: Number, required: true, min: 0 })
  size!: number;

  @Prop({ type: String, required: true, trim: true })
  checksum!: string;

  @Prop({ type: String, required: true, trim: true })
  storagePath!: string;

  @Prop({ type: String, required: true, trim: true })
  storageKey!: string;

  @Prop({
    type: String,
    enum: DocumentStatuses,
    required: true,
    default: 'uploaded',
    index: true,
  })
  status!: DocumentStatus;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  chunkCount!: number;

  @Prop({ type: String, default: null })
  errorMsg!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const DocumentMongoSchema = SchemaFactory.createForClass(DocumentRecord);

DocumentMongoSchema.index({ status: 1, createdAt: -1 });
DocumentMongoSchema.index({ originalName: 'text', filename: 'text' });
