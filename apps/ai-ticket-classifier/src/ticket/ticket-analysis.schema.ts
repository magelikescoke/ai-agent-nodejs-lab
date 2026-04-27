import { z } from 'zod';

export const TicketAnalysisCategories = [
  'billing',
  'technical',
  'account',
  'complaint',
  'other',
] as const;

export const TicketAnalysisPriorities = ['low', 'medium', 'high', 'urgent'] as const;

export const TicketAnalysisStatuses = ['submitted', 'analyzing', 'analyzed', 'error'] as const;

export const TicketAnalysisCategorySchema = z.enum(TicketAnalysisCategories);
export const TicketAnalysisPrioritySchema = z.enum(TicketAnalysisPriorities);
export const TicketAnalysisStatusSchema = z.enum(TicketAnalysisStatuses);

export const TicketAnalysisSchema = z
  .object({
    category: TicketAnalysisCategorySchema,
    priority: TicketAnalysisPrioritySchema,
    overview: z.string().trim().min(1),
    suggestedAction: z.string().trim().min(1),
  })
  .strict();

export const TicketAnalysisResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'ticket_analysis',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['category', 'priority', 'overview', 'suggestedAction'],
      properties: {
        category: {
          type: 'string',
          enum: TicketAnalysisCategories,
          description: 'Primary support ticket category.',
        },
        priority: {
          type: 'string',
          enum: TicketAnalysisPriorities,
          description: 'Support urgency based on customer impact.',
        },
        overview: {
          type: 'string',
          description: 'Brief summary of the customer issue.',
        },
        suggestedAction: {
          type: 'string',
          description: 'Recommended next support action.',
        },
      },
    },
  },
} as const;

export type TicketAnalysisCategory = z.infer<typeof TicketAnalysisCategorySchema>;
export type TicketAnalysisPriority = z.infer<typeof TicketAnalysisPrioritySchema>;
export type TicketAnalysisStatus = z.infer<typeof TicketAnalysisStatusSchema>;
export type TicketAnalysis = z.infer<typeof TicketAnalysisSchema>;
