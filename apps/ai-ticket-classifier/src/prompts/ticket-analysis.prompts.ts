import {
  TicketAnalysisCategories,
  TicketAnalysisPriorities,
} from '../ticket/ticket-analysis.schema';

export interface TicketAnalysisPrompt {
  version: string;
  systemPrompt: string;
  buildUserPrompt(content: string, attemptIndex: number): string;
}

const ticketAnalysisPromptV1: TicketAnalysisPrompt = {
  version: 'ticket-analysis-v1',
  systemPrompt: [
    'You are a support ticket triage assistant.',
    'Analyze the user ticket and return JSON only.',
    `Classify the ticket into exactly one allowed category. Categories: [${TicketAnalysisCategories.join(',')}]`,
    `Assign exactly one priority. Priorities: [${TicketAnalysisPriorities.join(',')}]`,
    'Keep overview and suggestedAction concise.',
    'Answer with a JSON string, Allowed fields: [category,priority,overview,suggestedAction],',
    'Example: {"category":"billing","priority":"medium","overview":"User has doubt about details of billing.","suggestedAction":"Check the amount of billing."}',
  ].join(' '),
  buildUserPrompt: buildTicketAnalysisUserPrompt,
};

const ticketAnalysisPromptV2: TicketAnalysisPrompt = {
  version: 'ticket-analysis-v2',
  systemPrompt: [
    'You are a support ticket triage assistant.',
    'Analyze the user ticket and return JSON only.',
    `Classify the ticket into exactly one allowed category. Categories: [${TicketAnalysisCategories.join(',')}]`,
    `Assign exactly one priority. Priorities: [${TicketAnalysisPriorities.join(',')}]`,
    'Keep overview and suggestedAction concise and operational.',
    'Priority guide: urgent means security risk, outage, data loss, or imminent duplicate charge; high means blocked work or strong dissatisfaction; medium means normal support follow-up; low means general information.',
    'Do not add fields outside [category,priority,overview,suggestedAction].',
    'Few-shot examples:',
    'Ticket: "I was charged after canceling my plan." Output: {"category":"billing","priority":"high","overview":"User reports an unexpected charge after cancellation.","suggestedAction":"Review cancellation and billing history, then refund if confirmed."}',
    'Ticket: "The API returns 500 for every export request." Output: {"category":"technical","priority":"urgent","overview":"User reports API failures during export requests.","suggestedAction":"Check API error logs and recent export service changes."}',
    'Ticket: "I lost access to my admin email and cannot sign in." Output: {"category":"account","priority":"high","overview":"User cannot access the admin account email.","suggestedAction":"Verify ownership and start the account recovery flow."}',
    'Ticket: "Your agent ignored my messages and closed the case." Output: {"category":"complaint","priority":"high","overview":"User is dissatisfied with prior support handling.","suggestedAction":"Escalate for support quality review and reopen the case if needed."}',
    'Ticket: "Do you provide a security questionnaire for vendor review?" Output: {"category":"other","priority":"low","overview":"User asks for vendor security documentation.","suggestedAction":"Share the security questionnaire or direct the user to the vendor documentation."}',
  ].join(' '),
  buildUserPrompt: buildTicketAnalysisUserPrompt,
};

export const DEFAULT_TICKET_ANALYSIS_PROMPT_VERSION = ticketAnalysisPromptV1.version;

const ticketAnalysisPrompts = {
  [ticketAnalysisPromptV1.version]: ticketAnalysisPromptV1,
  [ticketAnalysisPromptV2.version]: ticketAnalysisPromptV2,
} satisfies Record<string, TicketAnalysisPrompt>;

export function getTicketAnalysisPrompt(version: string): TicketAnalysisPrompt {
  const prompt = ticketAnalysisPrompts[version];

  if (!prompt) {
    throw new Error(`Unsupported ticket analysis prompt version: ${version}`);
  }

  return prompt;
}

function buildTicketAnalysisUserPrompt(content: string, attemptIndex: number): string {
  if (attemptIndex === 0) {
    return content;
  }

  return [
    'The previous output failed schema validation.',
    'Retry once and return only a JSON object matching the required schema.',
    `Ticket content: ${content}`,
  ].join('\n');
}
