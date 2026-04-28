export const AgentEventTypes = {
  IngestionReceived: 'ingestion.received',
  IngestionParsing: 'ingestion.parsing',
  IngestionChunking: 'ingestion.chunking',
  IngestionEmbedding: 'ingestion.embedding',
  IngestionIndexed: 'ingestion.indexed',
  RetrievalSearching: 'retrieval.searching',
  ChatAnswering: 'chat.answering',
  Error: 'error',
} as const;

export type AgentEventType = (typeof AgentEventTypes)[keyof typeof AgentEventTypes];

export interface AgentEvent<T = unknown> {
  type: AgentEventType;
  timestamp: string;
  data?: T;
}

export function createAgentEvent<T = unknown>(
  type: AgentEventType,
  data?: T,
): AgentEvent<T> {
  return {
    type,
    timestamp: new Date().toISOString(),
    ...(data === undefined ? {} : { data }),
  };
}
