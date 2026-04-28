export const INGESTION_QUEUE_NAME = 'ingestion';
export const INGESTION_JOB_NAME = 'document.ingestion';

export interface IngestionJobData {
  documentId: string;
}

export interface IngestionJobResult {
  documentId: string;
  status: 'indexed';
}

export interface IngestionJobSummary {
  id: string;
  documentId: string;
  queue: typeof INGESTION_QUEUE_NAME;
  status: 'queued';
  createdAt: string;
}
