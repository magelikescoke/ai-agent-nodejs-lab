import {
  TicketAnalysisResponseFormat,
  TicketAnalysisSchema,
} from './ticket-analysis.schema';

describe('TicketAnalysisSchema', () => {
  it('accepts the LLM ticket analysis output', () => {
    const result = TicketAnalysisSchema.parse({
      category: 'billing',
      overview: 'Customer reports a duplicate subscription charge.',
      suggestedAction: 'Verify invoice history and refund duplicate charge if confirmed.',
    });

    expect(result).toEqual({
      category: 'billing',
      overview: 'Customer reports a duplicate subscription charge.',
      suggestedAction: 'Verify invoice history and refund duplicate charge if confirmed.',
    });
  });

  it('rejects unsupported categories', () => {
    expect(() =>
      TicketAnalysisSchema.parse({
        category: 'sales',
        overview: 'Customer asks about pricing.',
        suggestedAction: 'Route to billing support.',
      }),
    ).toThrow();
  });

  it('rejects missing analysis fields', () => {
    expect(() =>
      TicketAnalysisSchema.parse({
        category: 'technical',
        overview: 'Customer cannot sign in.',
      }),
    ).toThrow();
  });

  it('rejects persistence-only fields from the model output', () => {
    expect(() =>
      TicketAnalysisSchema.parse({
        content: 'I cannot sign in.',
        category: 'technical',
        overview: 'Customer cannot sign in.',
        suggestedAction: 'Check account authentication logs.',
        status: 'analyzed',
      }),
    ).toThrow();
  });
});

describe('TicketAnalysisResponseFormat', () => {
  it('declares the chat completions response_format payload', () => {
    expect(TicketAnalysisResponseFormat).toMatchObject({
      type: 'json_schema',
      json_schema: {
        name: 'ticket_analysis',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['category', 'overview', 'suggestedAction'],
        },
      },
    });
  });
});
