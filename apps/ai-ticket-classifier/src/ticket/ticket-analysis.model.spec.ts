import { model } from 'mongoose';
import { TicketAnalysisMongoSchema, type TicketAnalysisRecord } from './ticket-analysis.model';

const TicketAnalysisTestModel = model<TicketAnalysisRecord>(
  'TicketAnalysisModelSpec',
  TicketAnalysisMongoSchema,
);

const now = new Date('2026-04-25T08:00:00.000Z');

describe('TicketAnalysisMongoSchema', () => {
  it('accepts a submitted ticket without analysis output', async () => {
    const ticket = new TicketAnalysisTestModel({
      content: 'I cannot sign in.',
      status: 'submitted',
      submittedAt: now,
    });

    await expect(ticket.validate()).resolves.toBeUndefined();
  });

  it('requires completed analysis fields when status is analyzed', async () => {
    const ticket = new TicketAnalysisTestModel({
      content: 'I was charged twice.',
      status: 'analyzed',
      submittedAt: now,
    });

    await expect(ticket.validate()).rejects.toThrow(
      'Analyzed ticket analysis requires category, overview, suggestedAction, and analyzedAt.',
    );
  });

  it('requires errorMsg when status is error', async () => {
    const ticket = new TicketAnalysisTestModel({
      content: 'The classifier timed out.',
      status: 'error',
      submittedAt: now,
    });

    await expect(ticket.validate()).rejects.toThrow('Failed ticket analysis requires errorMsg.');
  });

  it('stores raw output, parsed output, and retry count', async () => {
    const ticket = new TicketAnalysisTestModel({
      content: 'I was charged twice.',
      category: 'billing',
      overview: 'Customer reports a duplicate subscription charge.',
      suggestedAction: 'Verify billing history and refund duplicate charge if confirmed.',
      rawOutput:
        '{"category":"billing","overview":"Customer reports a duplicate subscription charge.","suggestedAction":"Verify billing history and refund duplicate charge if confirmed."}',
      parsedOutput: {
        category: 'billing',
        overview: 'Customer reports a duplicate subscription charge.',
        suggestedAction: 'Verify billing history and refund duplicate charge if confirmed.',
      },
      retryCount: 1,
      status: 'analyzed',
      submittedAt: now,
      analyzedAt: now,
    });

    await expect(ticket.validate()).resolves.toBeUndefined();
    expect(ticket.rawOutput).toContain('"category":"billing"');
    expect(ticket.parsedOutput).toMatchObject({ category: 'billing' });
    expect(ticket.retryCount).toBe(1);
  });
});
