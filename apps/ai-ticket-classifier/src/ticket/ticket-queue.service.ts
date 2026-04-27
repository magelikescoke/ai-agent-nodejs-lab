import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Job, Queue } from 'bullmq';
import { BatchAnalyzeTicketsDto } from './dto/batch-analyze-tickets.dto';
import {
  TICKET_ANALYSIS_JOB_NAME,
  TICKET_ANALYSIS_QUEUE_NAME,
  type TicketAnalysisJobData,
  type TicketAnalysisJobResult,
} from './ticket-queue.constants';

const TICKET_ANALYSIS_JOB_ATTEMPTS = 2;
const TICKET_ANALYSIS_JOB_BACKOFF_MS = 1_000;

@Injectable()
export class TicketQueueService {
  constructor(
    @InjectQueue(TICKET_ANALYSIS_QUEUE_NAME)
    private readonly ticketAnalysisQueue: Queue<TicketAnalysisJobData, TicketAnalysisJobResult>,
  ) {}

  async batchAnalyzeTickets(dto: BatchAnalyzeTicketsDto) {
    const batchId = randomUUID();
    const jobs = await Promise.all(
      dto.tickets.map((ticket, index) =>
        this.ticketAnalysisQueue.add(
          TICKET_ANALYSIS_JOB_NAME,
          {
            batchId,
            index,
            content: ticket.content,
          },
          {
            jobId: `${batchId}-${index}`,
            attempts: TICKET_ANALYSIS_JOB_ATTEMPTS,
            backoff: {
              type: 'exponential',
              delay: TICKET_ANALYSIS_JOB_BACKOFF_MS,
            },
            removeOnComplete: {
              age: 24 * 60 * 60,
              count: 1_000,
            },
            removeOnFail: {
              age: 7 * 24 * 60 * 60,
              count: 1_000,
            },
          },
        ),
      ),
    );

    return {
      batchId,
      count: jobs.length,
      jobs: jobs.map((job) => ({
        id: String(job.id),
        name: job.name,
        status: 'queued',
      })),
    };
  }

  async getJob(id: string) {
    const job = await this.ticketAnalysisQueue.getJob(id);

    if (!job) {
      throw new NotFoundException('ticket analysis job not found');
    }

    return this.serializeJob(job);
  }

  private async serializeJob(job: Job<TicketAnalysisJobData, TicketAnalysisJobResult>) {
    return {
      id: String(job.id),
      name: job.name,
      state: await job.getState(),
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      result: job.returnvalue,
      data: job.data,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }
}
