import type { Queue } from 'bullmq';
import {
  TICKET_ANALYSIS_JOB_NAME,
  type TicketAnalysisJobData,
  type TicketAnalysisJobResult,
} from './ticket-queue.constants';
import { TicketQueueService } from './ticket-queue.service';

function createQueueMock() {
  return {
    add: jest.fn((name: string, data: TicketAnalysisJobData, options: { jobId: string }) => {
      void name;
      void data;

      return Promise.resolve({
        id: options.jobId,
        name: TICKET_ANALYSIS_JOB_NAME,
      });
    }),
    getJob: jest.fn(),
  };
}

describe('TicketQueueService', () => {
  it('enqueues each submitted ticket as a BullMQ job', async () => {
    const queue = createQueueMock();
    const service = new TicketQueueService(
      queue as unknown as Queue<TicketAnalysisJobData, TicketAnalysisJobResult>,
    );

    const response = await service.batchAnalyzeTickets({
      tickets: [
        {
          content: 'I cannot sign in.',
        },
        {
          content: 'The dashboard returns a 500 error.',
        },
      ],
    });

    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(queue.add).toHaveBeenNthCalledWith(
      1,
      TICKET_ANALYSIS_JOB_NAME,
      expect.objectContaining({
        batchId: response.batchId,
        index: 0,
        content: 'I cannot sign in.',
      }),
      expect.objectContaining({
        attempts: 2,
        jobId: `${response.batchId}-0`,
      }),
    );
    expect(response).toMatchObject({
      count: 2,
      jobs: [
        {
          id: `${response.batchId}-0`,
          name: TICKET_ANALYSIS_JOB_NAME,
          status: 'queued',
        },
        {
          id: `${response.batchId}-1`,
          name: TICKET_ANALYSIS_JOB_NAME,
          status: 'queued',
        },
      ],
    });
  });

  it('returns job state and result by id', async () => {
    const queue = createQueueMock();
    queue.getJob.mockResolvedValueOnce({
      id: 'job-id',
      name: TICKET_ANALYSIS_JOB_NAME,
      data: {
        batchId: 'batch-id',
        index: 0,
        content: 'I cannot sign in.',
      },
      progress: {
        status: 'completed',
      },
      attemptsMade: 1,
      failedReason: undefined,
      returnvalue: {
        ticketAnalysisId: 'ticket-analysis-id',
        status: 'analyzed',
        cacheHit: false,
      },
      timestamp: 1_774_863_600_000,
      processedOn: 1_774_863_601_000,
      finishedOn: 1_774_863_602_000,
      getState: jest.fn(() => Promise.resolve('completed')),
    });
    const service = new TicketQueueService(
      queue as unknown as Queue<TicketAnalysisJobData, TicketAnalysisJobResult>,
    );

    await expect(service.getJob('job-id')).resolves.toMatchObject({
      id: 'job-id',
      state: 'completed',
      result: {
        ticketAnalysisId: 'ticket-analysis-id',
        status: 'analyzed',
        cacheHit: false,
      },
    });
  });

  it('throws not found when the job id does not exist', async () => {
    const queue = createQueueMock();
    queue.getJob.mockResolvedValueOnce(undefined);
    const service = new TicketQueueService(
      queue as unknown as Queue<TicketAnalysisJobData, TicketAnalysisJobResult>,
    );

    await expect(service.getJob('missing-job')).rejects.toThrow('ticket analysis job not found');
  });
});
