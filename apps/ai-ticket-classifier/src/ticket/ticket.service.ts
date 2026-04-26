import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ZodError } from 'zod';
import { LLMService } from '../llm/llm.service';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { TicketAnalysisMongoModelName, TicketAnalysisRecord } from './ticket-analysis.model';
import {
  TicketAnalysis,
  TicketAnalysisCategories,
  TicketAnalysisResponseFormat,
  TicketAnalysisSchema,
} from './ticket-analysis.schema';

const TICKET_ANALYSIS_MAX_ATTEMPTS = 2;

const TICKET_ANALYSIS_SYSTEM_PROMPT = [
  'You are a support ticket triage assistant.',
  'Analyze the user ticket and return JSON only.',
  `Classify the ticket into exactly one allowed category. Categories: [${TicketAnalysisCategories.join(',')}]`,
  'Keep overview and suggestedAction concise.',
  'Answer with a JSON string, Allowed fields: [category,overview,suggestedAction],',
  'Example: {"category":"billing","overview":"User has doubt about details of billing.","suggestedAction":"Check the amount of billing."}',
].join(' ');

interface ValidatedTicketAnalysis {
  analysis: TicketAnalysis;
  rawOutput: string;
  parsedOutput: TicketAnalysis;
  retryCount: number;
}

class TicketAnalysisValidationError extends Error {
  public constructor(
    message: string,
    public readonly rawOutput: string | undefined,
    public readonly parsedOutput: unknown,
    public readonly retryCount: number,
  ) {
    super(message);
  }
}

@Injectable()
export class TicketService {
  constructor(
    private readonly llmService: LLMService,
    @InjectModel(TicketAnalysisMongoModelName)
    private readonly ticketAnalysisModel: Model<TicketAnalysisRecord>,
  ) {}

  async analyzeTicket(dto: AnalyzeTicketDto) {
    const content = dto.content;
    const startedAt = Date.now();
    const modelName = this.llmService.getDefaultModelName();

    try {
      const { analysis, rawOutput, parsedOutput, retryCount } =
        await this.generateValidatedAnalysis(content);
      const analyzedAt = new Date();
      const latencyMs = Date.now() - startedAt;

      const record = await this.ticketAnalysisModel.create({
        content,
        ...analysis,
        rawOutput,
        parsedOutput,
        retryCount,
        modelName,
        latencyMs,
        status: 'analyzed',
        submittedAt: new Date(startedAt),
        analyzedAt,
      });

      return this.serializeTicketAnalysisRecord(record);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ticket analysis failed';
      const latencyMs = Date.now() - startedAt;

      const record = await this.ticketAnalysisModel.create({
        content,
        status: 'error',
        errorMsg,
        rawOutput: error instanceof TicketAnalysisValidationError ? error.rawOutput : undefined,
        parsedOutput:
          error instanceof TicketAnalysisValidationError ? error.parsedOutput : undefined,
        retryCount: error instanceof TicketAnalysisValidationError ? error.retryCount : 0,
        modelName,
        latencyMs,
        submittedAt: new Date(startedAt),
      });

      return this.serializeTicketAnalysisRecord(record);
    }
  }

  async getTicketAnalysis(id: string) {
    const record = await this.ticketAnalysisModel.findById(id).exec();

    if (!record) {
      throw new NotFoundException('ticket analysis not found');
    }

    return this.serializeTicketAnalysisRecord(record);
  }

  private async generateValidatedAnalysis(content: string): Promise<ValidatedTicketAnalysis> {
    let lastRawOutput: string | undefined;
    let lastParsedOutput: unknown;
    let lastValidationError: ZodError | undefined;

    for (let attemptIndex = 0; attemptIndex < TICKET_ANALYSIS_MAX_ATTEMPTS; attemptIndex += 1) {
      const output = await this.llmService.generateJsonOutputWithRaw<unknown>(
        TICKET_ANALYSIS_SYSTEM_PROMPT,
        this.getTicketAnalysisUserPrompt(content, attemptIndex),
        TicketAnalysisResponseFormat,
      );

      lastRawOutput = output.rawOutput;
      lastParsedOutput = output.parsedOutput;

      const validationResult = TicketAnalysisSchema.safeParse(output.parsedOutput);
      if (validationResult.success) {
        return {
          analysis: validationResult.data,
          rawOutput: output.rawOutput,
          parsedOutput: validationResult.data,
          retryCount: attemptIndex,
        };
      }

      lastValidationError = validationResult.error;
    }

    throw new TicketAnalysisValidationError(
      lastValidationError?.message ?? 'LLM ticket analysis output failed schema validation',
      lastRawOutput,
      lastParsedOutput,
      TICKET_ANALYSIS_MAX_ATTEMPTS - 1,
    );
  }

  private getTicketAnalysisUserPrompt(content: string, attemptIndex: number): string {
    if (attemptIndex === 0) {
      return content;
    }

    return [
      'The previous output failed schema validation.',
      'Retry once and return only a JSON object matching the required schema.',
      `Ticket content: ${content}`,
    ].join('\n');
  }

  private serializeTicketAnalysisRecord(record: TicketAnalysisRecord & { id?: string }) {
    return {
      id: record.id,
      content: record.content,
      category: record.category,
      overview: record.overview,
      suggestedAction: record.suggestedAction,
      rawOutput: record.rawOutput,
      parsedOutput: record.parsedOutput,
      status: record.status,
      errorMsg: record.errorMsg,
      retryCount: record.retryCount,
      modelName: record.modelName,
      latencyMs: record.latencyMs,
      submittedAt: record.submittedAt,
      analyzedAt: record.analyzedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
