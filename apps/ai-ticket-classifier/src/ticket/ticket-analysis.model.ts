import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  TicketAnalysisCategories,
  TicketAnalysisStatuses,
  type TicketAnalysisCategory,
  type TicketAnalysisStatus,
} from './ticket-analysis.schema';

export const TicketAnalysisMongoModelName = 'TicketAnalysis';
export type TicketAnalysisDocument = HydratedDocument<TicketAnalysisRecord>;

@Schema({
  collection: 'ticket_analyses',
  timestamps: true,
  versionKey: false,
})
export class TicketAnalysisRecord {
  @Prop({ type: String, required: true, trim: true })
  content!: string;

  @Prop({ type: String, enum: TicketAnalysisCategories })
  category?: TicketAnalysisCategory;

  @Prop({ type: String, trim: true })
  overview?: string;

  @Prop({ type: String, trim: true })
  suggestedAction?: string;

  @Prop({ type: String, trim: true })
  rawOutput?: string;

  @Prop({ type: Object })
  parsedOutput?: unknown;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  retryCount!: number;

  @Prop({
    type: String,
    enum: TicketAnalysisStatuses,
    required: true,
    default: 'submitted',
    index: true,
  })
  status!: TicketAnalysisStatus;

  @Prop({ type: String, trim: true })
  errorMsg?: string;

  @Prop({ type: Date, required: true, default: Date.now, index: true })
  submittedAt!: Date;

  @Prop({ type: Date })
  analyzedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TicketAnalysisMongoSchema = SchemaFactory.createForClass(TicketAnalysisRecord);

TicketAnalysisMongoSchema.index({ status: 1, createdAt: -1 });
TicketAnalysisMongoSchema.index({ category: 1, createdAt: -1 });
TicketAnalysisMongoSchema.index({ content: 'text', overview: 'text' });

TicketAnalysisMongoSchema.pre<TicketAnalysisDocument>('validate', function validateStatusFields() {
  if (this.status === 'analyzed') {
    if (
      !this.category ||
      !hasText(this.overview) ||
      !hasText(this.suggestedAction) ||
      !this.analyzedAt
    ) {
      throw new Error(
        'Analyzed ticket analysis requires category, overview, suggestedAction, and analyzedAt.',
      );
    }
  }

  if (this.status === 'error' && !hasText(this.errorMsg)) {
    throw new Error('Failed ticket analysis requires errorMsg.');
  }
});

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
