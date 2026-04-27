/* eslint-disable @typescript-eslint/unbound-method */
import type { Cache } from 'cache-manager';
import type { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { LLMService } from '../llm/llm.service';
import type { TicketAnalysisRecord } from './ticket-analysis.model';
import { TicketService } from './ticket.service';

const TICKET_ANALYSIS_PROMPT_VERSION = 'ticket-analysis-v1';

function createTicketAnalysisModelMock() {
  return {
    create: jest.fn((doc: Partial<TicketAnalysisRecord>) =>
      Promise.resolve({
        id: 'ticket-analysis-id',
        createdAt: new Date('2026-04-26T08:00:00.000Z'),
        updatedAt: new Date('2026-04-26T08:00:00.000Z'),
        ...doc,
      }),
    ),
    findById: jest.fn(),
  };
}

function createCacheManagerMock() {
  return {
    get: jest.fn((): Promise<unknown> => Promise.resolve(undefined)),
    set: jest.fn((): Promise<void> => Promise.resolve()),
  };
}

function createConfigServiceMock(promptVersion = TICKET_ANALYSIS_PROMPT_VERSION) {
  return {
    getOrThrow: jest.fn(() => ({
      ticketAnalysisPromptVersion: promptVersion,
    })),
  };
}

describe('TicketService', () => {
  it('retries once when parsed LLM output fails schema validation', async () => {
    const llmService = {
      generateJsonOutputWithRaw: jest
        .fn()
        .mockResolvedValueOnce({
          rawOutput:
            '{"category":"sales","overview":"Customer asks about pricing.","suggestedAction":"Route to billing support."}',
          parsedOutput: {
            category: 'sales',
            overview: 'Customer asks about pricing.',
            suggestedAction: 'Route to billing support.',
          },
        })
        .mockResolvedValueOnce({
          rawOutput:
            '{"category":"billing","overview":"Customer reports a duplicate charge.","suggestedAction":"Check invoice history and refund if confirmed."}',
          parsedOutput: {
            category: 'billing',
            overview: 'Customer reports a duplicate charge.',
            suggestedAction: 'Check invoice history and refund if confirmed.',
          },
        }),
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    const cacheManager = createCacheManagerMock();
    const configService = createConfigServiceMock();
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
      cacheManager as unknown as Cache,
      configService as unknown as ConfigService,
    );

    const response = await service.analyzeTicket({
      content: 'I was charged twice for the same subscription.',
    });

    expect(llmService.generateJsonOutputWithRaw).toHaveBeenCalledTimes(2);
    expect(ticketAnalysisModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'billing',
        rawOutput:
          '{"category":"billing","overview":"Customer reports a duplicate charge.","suggestedAction":"Check invoice history and refund if confirmed."}',
        parsedOutput: {
          category: 'billing',
          overview: 'Customer reports a duplicate charge.',
          suggestedAction: 'Check invoice history and refund if confirmed.',
        },
        modelName: 'glm-test',
        promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
        retryCount: 1,
        status: 'analyzed',
      }),
    );
    expect(cacheManager.set).toHaveBeenCalledWith(
      expect.stringMatching(/^TicketContentCache:/),
      expect.objectContaining({
        category: 'billing',
        cacheHit: false,
        promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
      }),
      600000,
    );
    expect(response).toMatchObject({
      category: 'billing',
      cacheHit: false,
      modelName: 'glm-test',
      promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
      retryCount: 1,
      status: 'analyzed',
    });
  });

  it('uses the configured ticket analysis prompt version', async () => {
    const llmService = {
      generateJsonOutputWithRaw: jest.fn().mockResolvedValueOnce({
        rawOutput:
          '{"category":"technical","overview":"Customer reports an API timeout.","suggestedAction":"Check service logs and recent incidents."}',
        parsedOutput: {
          category: 'technical',
          overview: 'Customer reports an API timeout.',
          suggestedAction: 'Check service logs and recent incidents.',
        },
      }),
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    const cacheManager = createCacheManagerMock();
    const configService = createConfigServiceMock('ticket-analysis-v2');
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
      cacheManager as unknown as Cache,
      configService as unknown as ConfigService,
    );

    await service.analyzeTicket({
      content: 'The API keeps timing out.',
    });

    expect(llmService.generateJsonOutputWithRaw).toHaveBeenCalledWith(
      expect.stringContaining('Keep overview and suggestedAction concise and operational.'),
      'The API keeps timing out.',
      expect.any(Object),
    );
    expect(ticketAnalysisModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        promptVersion: 'ticket-analysis-v2',
        status: 'analyzed',
      }),
    );
  });

  it('stores the final raw and parsed output when schema validation fails twice', async () => {
    const llmService = {
      generateJsonOutputWithRaw: jest
        .fn()
        .mockResolvedValueOnce({
          rawOutput: '{"category":"sales","overview":"Pricing question","suggestedAction":"Route"}',
          parsedOutput: {
            category: 'sales',
            overview: 'Pricing question',
            suggestedAction: 'Route',
          },
        })
        .mockResolvedValueOnce({
          rawOutput:
            '{"category":"unknown","overview":"Cannot classify","suggestedAction":"Review"}',
          parsedOutput: {
            category: 'unknown',
            overview: 'Cannot classify',
            suggestedAction: 'Review',
          },
        }),
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    const cacheManager = createCacheManagerMock();
    const configService = createConfigServiceMock();
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
      cacheManager as unknown as Cache,
      configService as unknown as ConfigService,
    );

    const response = await service.analyzeTicket({
      content: 'I need help with something unusual.',
    });

    expect(llmService.generateJsonOutputWithRaw).toHaveBeenCalledTimes(2);
    expect(ticketAnalysisModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        rawOutput: '{"category":"unknown","overview":"Cannot classify","suggestedAction":"Review"}',
        parsedOutput: {
          category: 'unknown',
          overview: 'Cannot classify',
          suggestedAction: 'Review',
        },
        modelName: 'glm-test',
        promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
        retryCount: 1,
      }),
    );
    expect(response).toMatchObject({
      status: 'error',
      cacheHit: false,
      modelName: 'glm-test',
      promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
      retryCount: 1,
    });
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('returns cached ticket analysis without calling the LLM', async () => {
    const llmService = {
      generateJsonOutputWithRaw: jest.fn(),
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    const cacheManager = createCacheManagerMock();
    const configService = createConfigServiceMock();
    cacheManager.get.mockResolvedValueOnce({
      id: 'cached-ticket-id',
      content: 'I cannot sign in.',
      category: 'account',
      overview: 'Customer cannot sign in.',
      suggestedAction: 'Check account recovery settings.',
      status: 'analyzed',
      retryCount: 0,
      promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
      modelName: 'glm-test',
      latencyMs: 123,
      cacheHit: false,
      submittedAt: new Date('2026-04-26T08:00:00.000Z'),
      analyzedAt: new Date('2026-04-26T08:00:01.000Z'),
      createdAt: new Date('2026-04-26T08:00:01.000Z'),
      updatedAt: new Date('2026-04-26T08:00:01.000Z'),
    });
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
      cacheManager as unknown as Cache,
      configService as unknown as ConfigService,
    );

    await expect(service.analyzeTicket({ content: 'I cannot sign in.' })).resolves.toMatchObject({
      id: 'cached-ticket-id',
      category: 'account',
      cacheHit: true,
      promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
      status: 'analyzed',
    });
    expect(cacheManager.get).toHaveBeenCalledWith(
      expect.stringMatching(/^TicketContentCache:ticket-analysis-v1:/),
    );
    expect(llmService.generateJsonOutputWithRaw).not.toHaveBeenCalled();
    expect(ticketAnalysisModel.create).not.toHaveBeenCalled();
  });

  it('returns a stored ticket analysis by id', async () => {
    const llmService = {
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    const cacheManager = createCacheManagerMock();
    const configService = createConfigServiceMock();
    ticketAnalysisModel.findById.mockReturnValue({
      exec: jest.fn(() =>
        Promise.resolve({
          id: '507f1f77bcf86cd799439011',
          content: 'I cannot sign in.',
          category: 'account',
          overview: 'Customer cannot access the account.',
          suggestedAction: 'Check account recovery settings.',
          rawOutput:
            '{"category":"account","overview":"Customer cannot access the account.","suggestedAction":"Check account recovery settings."}',
          parsedOutput: {
            category: 'account',
            overview: 'Customer cannot access the account.',
            suggestedAction: 'Check account recovery settings.',
          },
          status: 'analyzed',
          retryCount: 0,
          promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
          modelName: 'glm-test',
          latencyMs: 321,
          submittedAt: new Date('2026-04-26T08:00:00.000Z'),
          analyzedAt: new Date('2026-04-26T08:00:01.000Z'),
          createdAt: new Date('2026-04-26T08:00:01.000Z'),
          updatedAt: new Date('2026-04-26T08:00:01.000Z'),
        }),
      ),
    });
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
      cacheManager as unknown as Cache,
      configService as unknown as ConfigService,
    );

    await expect(service.getTicketAnalysis('507f1f77bcf86cd799439011')).resolves.toMatchObject({
      id: '507f1f77bcf86cd799439011',
      category: 'account',
      modelName: 'glm-test',
      promptVersion: TICKET_ANALYSIS_PROMPT_VERSION,
      latencyMs: 321,
      status: 'analyzed',
    });
  });

  it('throws not found when the ticket analysis id does not exist', async () => {
    const llmService = {
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    const cacheManager = createCacheManagerMock();
    const configService = createConfigServiceMock();
    ticketAnalysisModel.findById.mockReturnValue({
      exec: jest.fn(() => Promise.resolve(null)),
    });
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
      cacheManager as unknown as Cache,
      configService as unknown as ConfigService,
    );

    await expect(service.getTicketAnalysis('507f1f77bcf86cd799439011')).rejects.toThrow(
      'ticket analysis not found',
    );
  });
});
