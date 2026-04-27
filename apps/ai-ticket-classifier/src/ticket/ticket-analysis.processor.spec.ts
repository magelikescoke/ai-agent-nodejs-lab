import type { Job } from 'bullmq';
import { TicketAnalysisProcessor } from './ticket-analysis.processor';
import type { TicketAnalysisJobData, TicketAnalysisJobResult } from './ticket-queue.constants';
import type { TicketService } from './ticket.service';

describe('TicketAnalysisProcessor', () => {
  it('analyzes a queued ticket and returns the analysis job result', async () => {
    const analyzeTicket = jest.fn(() =>
      Promise.resolve({
        id: 'ticket-analysis-id',
        status: 'analyzed',
        cacheHit: false,
      }),
    );
    const ticketService = {
      analyzeTicket,
    } as unknown as TicketService;
    const processor = new TicketAnalysisProcessor(ticketService);
    const updateProgress = jest.fn(() => Promise.resolve());
    const job = {
      data: {
        batchId: 'batch-id',
        index: 0,
        content: 'I cannot sign in.',
      },
      updateProgress,
    } as unknown as Job<TicketAnalysisJobData, TicketAnalysisJobResult>;

    await expect(processor.process(job)).resolves.toEqual({
      ticketAnalysisId: 'ticket-analysis-id',
      status: 'analyzed',
      cacheHit: false,
    });
    expect(analyzeTicket).toHaveBeenCalledWith({
      content: 'I cannot sign in.',
    });
    expect(updateProgress).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        status: 'analyzing',
        batchId: 'batch-id',
        index: 0,
      }),
    );
    expect(updateProgress).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        status: 'completed',
        ticketAnalysisId: 'ticket-analysis-id',
      }),
    );
  });
});
