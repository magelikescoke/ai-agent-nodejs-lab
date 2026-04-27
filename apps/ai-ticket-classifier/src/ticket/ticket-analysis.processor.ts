import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  TICKET_ANALYSIS_QUEUE_NAME,
  type TicketAnalysisJobData,
  type TicketAnalysisJobResult,
} from './ticket-queue.constants';
import { TicketService } from './ticket.service';

@Processor(TICKET_ANALYSIS_QUEUE_NAME, {
  concurrency: 3,
  limiter: {
    max: 60,
    duration: 60_000,
  },
})
export class TicketAnalysisProcessor extends WorkerHost {
  constructor(private readonly ticketService: TicketService) {
    super();
  }

  async process(
    job: Job<TicketAnalysisJobData, TicketAnalysisJobResult>,
  ): Promise<TicketAnalysisJobResult> {
    await job.updateProgress({
      status: 'analyzing',
      batchId: job.data.batchId,
      index: job.data.index,
    });

    const analysis = await this.ticketService.analyzeTicket({
      content: job.data.content,
    });

    await job.updateProgress({
      status: 'completed',
      ticketAnalysisId: analysis.id,
    });

    return {
      ticketAnalysisId: analysis.id,
      status: analysis.status,
      cacheHit: analysis.cacheHit,
    };
  }
}
