export const TICKET_ANALYSIS_QUEUE_NAME = 'ticket-analysis';
export const TICKET_ANALYSIS_JOB_NAME = 'ticket.analysis';

export interface TicketAnalysisJobData {
  batchId: string;
  index: number;
  content: string;
}

export interface TicketAnalysisJobResult {
  ticketAnalysisId?: string;
  status: string;
  cacheHit: boolean;
}
