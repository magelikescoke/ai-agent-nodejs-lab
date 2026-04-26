import type { Model } from 'mongoose';
import { LLMService } from '../llm/llm.service';
import type { TicketAnalysisRecord } from './ticket-analysis.model';
import { TicketService } from './ticket.service';

function createTicketAnalysisModelMock() {
  return {
    create: jest.fn(async (doc: Partial<TicketAnalysisRecord>) => ({
      id: 'ticket-analysis-id',
      createdAt: new Date('2026-04-26T08:00:00.000Z'),
      updatedAt: new Date('2026-04-26T08:00:00.000Z'),
      ...doc,
    })),
    findById: jest.fn(),
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
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
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
        retryCount: 1,
        status: 'analyzed',
      }),
    );
    expect(response).toMatchObject({
      category: 'billing',
      modelName: 'glm-test',
      retryCount: 1,
      status: 'analyzed',
    });
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
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
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
        retryCount: 1,
      }),
    );
    expect(response).toMatchObject({
      status: 'error',
      modelName: 'glm-test',
      retryCount: 1,
    });
  });

  it('returns a stored ticket analysis by id', async () => {
    const llmService = {
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    ticketAnalysisModel.findById.mockReturnValue({
      exec: jest.fn(async () => ({
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
        modelName: 'glm-test',
        latencyMs: 321,
        submittedAt: new Date('2026-04-26T08:00:00.000Z'),
        analyzedAt: new Date('2026-04-26T08:00:01.000Z'),
        createdAt: new Date('2026-04-26T08:00:01.000Z'),
        updatedAt: new Date('2026-04-26T08:00:01.000Z'),
      })),
    });
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
    );

    await expect(service.getTicketAnalysis('507f1f77bcf86cd799439011')).resolves.toMatchObject({
      id: '507f1f77bcf86cd799439011',
      category: 'account',
      modelName: 'glm-test',
      latencyMs: 321,
      status: 'analyzed',
    });
  });

  it('throws not found when the ticket analysis id does not exist', async () => {
    const llmService = {
      getDefaultModelName: jest.fn(() => 'glm-test'),
    } as unknown as LLMService;
    const ticketAnalysisModel = createTicketAnalysisModelMock();
    ticketAnalysisModel.findById.mockReturnValue({
      exec: jest.fn(async () => null),
    });
    const service = new TicketService(
      llmService,
      ticketAnalysisModel as unknown as Model<TicketAnalysisRecord>,
    );

    await expect(service.getTicketAnalysis('507f1f77bcf86cd799439011')).rejects.toThrow(
      'ticket analysis not found',
    );
  });
});
