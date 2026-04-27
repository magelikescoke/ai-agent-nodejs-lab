export const AgentEventTypes = {
  AnalysisReceived: 'analysis.received',
  AnalysisAnalyzing: 'analysis.analyzing',
  LlmToken: 'llm.token',
  AnalysisValidating: 'analysis.validating',
  AnalysisCompleted: 'analysis.completed',
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
