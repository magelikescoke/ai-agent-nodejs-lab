import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LLMService } from '../llm/llm.service';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import {
  TicketAnalysisMongoModelName,
  TicketAnalysisRecord,
} from './ticket-analysis.model';
import {
  TicketAnalysis,
  TicketAnalysisCategories,
  TicketAnalysisSchema,
} from './ticket-analysis.schema';

const TICKET_ANALYSIS_SYSTEM_PROMPT = [
  'You are a support ticket triage assistant.',
  'Analyze the user ticket and return JSON only.',
  `Classify the ticket into exactly one allowed category. Categories: [${TicketAnalysisCategories.join(',')}]`,
  'Keep overview and suggestedAction concise.',
  'Answer with a JSON string, Allowed fields: [category,overview,suggestedAction],',
  'Example: {"category":"billing","overview":"User has doubt about details of billing.","suggestedAction":"Check the amount of billing.",}'
].join(' ');

@Injectable()
export class TicketService {
  constructor(
    private readonly llmService: LLMService,
    @InjectModel(TicketAnalysisMongoModelName)
    private readonly ticketAnalysisModel: Model<TicketAnalysisRecord>,
  ) {}

  async analyzeTicket(dto: AnalyzeTicketDto) {
    const content = dto.content?.trim();

    if (!content) {
      throw new BadRequestException('content is required');
    }

    const startedAt = Date.now();

    try {
      const rawAnalysis = await this.llmService.generateJsonOutput<TicketAnalysis>(
        TICKET_ANALYSIS_SYSTEM_PROMPT,
        content,
        { "type": "json_object" },
      );
      const analysis = TicketAnalysisSchema.parse(rawAnalysis);
      const analyzedAt = new Date();

      const record = await this.ticketAnalysisModel.create({
        content,
        ...analysis,
        status: 'analyzed',
        submittedAt: new Date(startedAt),
        analyzedAt,
      });

      return {
        id: record.id,
        content: record.content,
        category: record.category,
        overview: record.overview,
        suggestedAction: record.suggestedAction,
        status: record.status,
        latencyMs: Date.now() - startedAt,
        submittedAt: record.submittedAt,
        analyzedAt: record.analyzedAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ticket analysis failed';

      const record = await this.ticketAnalysisModel.create({
        content,
        status: 'error',
        errorMsg,
        submittedAt: new Date(startedAt),
      });

      return {
        id: record.id,
        content: record.content,
        status: record.status,
        errorMsg: record.errorMsg,
        latencyMs: Date.now() - startedAt,
        submittedAt: record.submittedAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    }
  }
}
