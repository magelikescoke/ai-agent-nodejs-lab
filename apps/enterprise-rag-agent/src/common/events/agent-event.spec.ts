import { AgentEventTypes, createAgentEvent } from './agent-event';

describe('RAG agent event', () => {
  it('creates a timestamped event', () => {
    const event = createAgentEvent(AgentEventTypes.IngestionReceived, {
      documentId: 'doc-1',
    });

    expect(event).toMatchObject({
      type: AgentEventTypes.IngestionReceived,
      data: { documentId: 'doc-1' },
    });
    expect(new Date(event.timestamp).toString()).not.toBe('Invalid Date');
  });
});
