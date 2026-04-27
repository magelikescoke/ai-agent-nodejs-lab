import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { ZodError } from 'zod';
import {
  AgentEventTypes,
  createAgentEvent,
  type AgentEvent,
} from '../common/events/agent-event';
import { sha256Hex } from '../common/utils';
import type { AppConfiguration } from '../config/app.config';
import { LLMService } from '../llm/llm.service';
import {
  getTicketAnalysisPrompt,
  type TicketAnalysisPrompt,
} from '../prompts/ticket-analysis.prompts';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { TicketAnalysisMongoModelName, TicketAnalysisRecord } from './ticket-analysis.model';
import {
  TicketAnalysis,
  TicketAnalysisResponseFormat,
  TicketAnalysisSchema,
} from './ticket-analysis.schema';

const TICKET_ANALYSIS_MAX_ATTEMPTS = 2;
const TICKET_ANALYSIS_CACHE_TTL_MS = 10 * 60 * 1000;

interface ValidatedTicketAnalysis {
  analysis: TicketAnalysis;
  rawOutput: string;
  parsedOutput: TicketAnalysis;
  retryCount: number;
}

interface TicketAnalysisStreamCallbacks {
  onEvent: (event: AgentEvent) => void;
}

export interface TicketAnalysisResponse {
  id?: string;
  content: string;
  category?: string;
  priority?: string;
  overview?: string;
  suggestedAction?: string;
  rawOutput?: string;
  parsedOutput?: unknown;
  status: string;
  errorMsg?: string;
  retryCount: number;
  promptVersion?: string;
  modelName?: string;
  latencyMs?: number;
  cacheHit: boolean;
  submittedAt: Date;
  analyzedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
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
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async analyzeTicket(dto: AnalyzeTicketDto) {
    const content = dto.content;
    const prompt = this.getConfiguredTicketAnalysisPrompt();
    const cached = await this.getTicketFromCache(content, prompt.version);

    if (cached) {
      return {
        ...cached,
        cacheHit: true,
      };
    }

    const startedAt = Date.now();
    const modelName = this.llmService.getDefaultModelName();

    try {
      const { analysis, rawOutput, parsedOutput, retryCount } =
        await this.generateValidatedAnalysis(content, prompt);
      const analyzedAt = new Date();
      const latencyMs = Date.now() - startedAt;

      const record = await this.ticketAnalysisModel.create({
        content,
        ...analysis,
        rawOutput,
        parsedOutput,
        retryCount,
        promptVersion: prompt.version,
        modelName,
        latencyMs,
        status: 'analyzed',
        submittedAt: new Date(startedAt),
        analyzedAt,
      });

      const response = this.serializeTicketAnalysisRecord(record);
      await this.setTicketCache(content, prompt.version, response);

      return response;
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
        promptVersion: prompt.version,
        modelName,
        latencyMs,
        submittedAt: new Date(startedAt),
      });

      return this.serializeTicketAnalysisRecord(record);
    }
  }

  public async analyzeTicketStream(
    dto: AnalyzeTicketDto,
    callbacks: TicketAnalysisStreamCallbacks,
  ) {
    const content = dto.content;
    const prompt = this.getConfiguredTicketAnalysisPrompt();
    this.emitAgentEvent(callbacks, AgentEventTypes.AnalysisReceived);
    const cached = await this.getTicketFromCache(content, prompt.version);

    if (cached) {
      this.emitAgentEvent(callbacks, AgentEventTypes.LlmToken, {
        delta: JSON.stringify({
          ...cached,
          cacheHit: true,
        }),
      });
      this.emitAgentEvent(callbacks, AgentEventTypes.AnalysisCompleted);
      return;
    }

    const startedAt = Date.now();
    const modelName = this.llmService.getDefaultModelName();

    this.emitAgentEvent(callbacks, AgentEventTypes.AnalysisAnalyzing);
    const record = await this.ticketAnalysisModel.create({
      content,
      promptVersion: prompt.version,
      modelName,
      status: 'submitted',
      submittedAt: new Date(startedAt),
    });

    try {
      const rawOutputChunks: string[] = [];
      const stream = await this.llmService.generateTextWithStream(
        prompt.systemPrompt,
        prompt.buildUserPrompt(content, 0),
        TicketAnalysisResponseFormat,
      );

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;

        if (token) {
          rawOutputChunks.push(token);
          this.emitAgentEvent(callbacks, AgentEventTypes.LlmToken, { delta: token });
        }
      }

      const latencyMs = Date.now() - startedAt;
      const analyzedAt = new Date();
      const rawOutput = rawOutputChunks.join('');
      const parsedOutput = JSON.parse(rawOutput) as unknown;
      const parseRes = TicketAnalysisSchema.safeParse(parsedOutput);

      this.emitAgentEvent(callbacks, AgentEventTypes.AnalysisValidating);

      if (!parseRes.success) {
        throw new TicketAnalysisValidationError(
          'LLM ticket analysis output failed schema validation',
          rawOutput,
          parsedOutput,
          0,
        );
      }

      const newRecord = await this.ticketAnalysisModel.findByIdAndUpdate(
        record._id,
        {
          $set: {
            status: 'analyzed',
            ...parseRes.data,
            latencyMs,
            rawOutput,
            parsedOutput,
            analyzedAt,
          },
        },
        {
          returnDocument: 'after',
        },
      );

      if (newRecord) {
        const response = this.serializeTicketAnalysisRecord(newRecord);
        await this.setTicketCache(content, prompt.version, response);
      }
    } catch (error) {
      await this.ticketAnalysisModel.findByIdAndUpdate(record._id, {
        $set: {
          status: 'error',
          errorMsg: this.getErrorMessage(error),
          rawOutput: error instanceof TicketAnalysisValidationError ? error.rawOutput : undefined,
          parsedOutput:
            error instanceof TicketAnalysisValidationError ? error.parsedOutput : undefined,
        },
      });
      this.emitAgentEvent(callbacks, AgentEventTypes.Error, {
        message: this.getErrorMessage(error),
      });
      return;
    }

    this.emitAgentEvent(callbacks, AgentEventTypes.AnalysisCompleted);
  }

  async getTicketAnalysis(id: string) {
    const record = await this.ticketAnalysisModel.findById(id).exec();

    if (!record) {
      throw new NotFoundException('ticket analysis not found');
    }

    return this.serializeTicketAnalysisRecord(record);
  }

  private async generateValidatedAnalysis(
    content: string,
    prompt: TicketAnalysisPrompt,
  ): Promise<ValidatedTicketAnalysis> {
    let lastRawOutput: string | undefined;
    let lastParsedOutput: unknown;
    let lastValidationError: ZodError | undefined;

    for (let attemptIndex = 0; attemptIndex < TICKET_ANALYSIS_MAX_ATTEMPTS; attemptIndex += 1) {
      const output = await this.llmService.generateJsonOutputWithRaw<unknown>(
        prompt.systemPrompt,
        prompt.buildUserPrompt(content, attemptIndex),
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

  private getConfiguredTicketAnalysisPrompt(): TicketAnalysisPrompt {
    const appConfiguration = this.configService.getOrThrow<AppConfiguration>('app');
    return getTicketAnalysisPrompt(appConfiguration.ticketAnalysisPromptVersion);
  }

  private serializeTicketAnalysisRecord(record: TicketAnalysisRecord & { id?: string }) {
    return {
      id: record.id,
      content: record.content,
      category: record.category,
      priority: record.priority,
      overview: record.overview,
      suggestedAction: record.suggestedAction,
      rawOutput: record.rawOutput,
      parsedOutput: record.parsedOutput,
      status: record.status,
      errorMsg: record.errorMsg,
      retryCount: record.retryCount,
      promptVersion: record.promptVersion,
      modelName: record.modelName,
      latencyMs: record.latencyMs,
      cacheHit: false,
      submittedAt: record.submittedAt,
      analyzedAt: record.analyzedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    } satisfies TicketAnalysisResponse;
  }

  private getContentCacheKey(content: string, promptVersion: string): string {
    const hash = sha256Hex(content);
    return `TicketContentCache:${promptVersion}:${hash}`;
  }

  private emitAgentEvent<T>(
    callbacks: TicketAnalysisStreamCallbacks,
    type: AgentEvent['type'],
    data?: T,
  ): void {
    callbacks.onEvent(createAgentEvent(type, data));
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ticket analysis failed';
  }

  private async getTicketFromCache(content: string, promptVersion: string) {
    const key = this.getContentCacheKey(content, promptVersion);
    return this.cacheManager.get<TicketAnalysisResponse>(key);
  }

  private async setTicketCache(
    content: string,
    promptVersion: string,
    response: TicketAnalysisResponse,
  ): Promise<void> {
    const key = this.getContentCacheKey(content, promptVersion);
    await this.cacheManager.set(key, response, TICKET_ANALYSIS_CACHE_TTL_MS);
  }
}
