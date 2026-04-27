import { AgentEventTypes, createAgentEvent } from './agent-event';

describe('agent event', () => {
  it('creates a timestamped agent event with optional data', () => {
    const event = createAgentEvent(AgentEventTypes.LlmToken, { delta: 'hello' });

    expect(event).toMatchObject({
      type: AgentEventTypes.LlmToken,
      data: { delta: 'hello' },
    });
    expect(new Date(event.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('omits data when payload is not provided', () => {
    expect(createAgentEvent(AgentEventTypes.AnalysisReceived)).not.toHaveProperty('data');
  });
});
