import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import {
  getTicketAnalysisPrompt,
  type TicketAnalysisPrompt,
} from '../src/prompts/ticket-analysis.prompts';
import {
  TicketAnalysisResponseFormat,
  TicketAnalysisSchema,
  type TicketAnalysis,
} from '../src/ticket/ticket-analysis.schema';

interface TicketCase {
  id: string;
  content: string;
  expectedCategory: string;
}

interface EvalResult {
  promptVersion: string;
  caseId: string;
  expectedCategory: string;
  userPrompt: string;
  rawOutput: string;
  parsedOutput: unknown;
  schemaPassed: boolean;
  categoryMatched: boolean;
  error?: string;
  latencyMs: number;
}

const repoRoot = path.resolve(__dirname, '../../..');
const reportPath = path.join(repoRoot, 'docs/prompt-stability-few-shot-eval.md');
const ticketCasesPath = path.join(
  repoRoot,
  'apps/ai-ticket-classifier/test-data/ticket-cases.json',
);

loadEnvFile(path.join(repoRoot, '.env'));
loadEnvFile(path.join(repoRoot, 'apps/ai-ticket-classifier/.env'));

const apiKey = process.env.GLM_API_KEY ?? '';
if (!apiKey) {
  throw new Error('GLM_API_KEY is required to run prompt stability eval.');
}

const model = process.env.GLM_MODEL ?? 'GLM-4.7-Flash';
const baseURL = process.env.GLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4';
const timeout = Number(process.env.GLM_TIMEOUT_MS ?? 30000);

const client = new OpenAI({
  apiKey,
  baseURL,
  timeout,
});

async function main() {
  const cases = JSON.parse(fs.readFileSync(ticketCasesPath, 'utf8')) as TicketCase[];
  const evalCases = cases.slice(0, 10);
  const promptVersions = ['ticket-analysis-v1', 'ticket-analysis-v2'];
  const results: EvalResult[] = [];

  for (const promptVersion of promptVersions) {
    const prompt = getTicketAnalysisPrompt(promptVersion);

    for (const ticketCase of evalCases) {
      results.push(await runCase(prompt, ticketCase));
    }
  }

  fs.writeFileSync(
    reportPath,
    renderReport({
      model,
      baseURL,
      cases: evalCases,
      prompts: promptVersions.map(getTicketAnalysisPrompt),
      results,
    }),
  );

  console.log(`Wrote ${reportPath}`);
}

async function runCase(prompt: TicketAnalysisPrompt, ticketCase: TicketCase): Promise<EvalResult> {
  const startedAt = Date.now();
  const userPrompt = prompt.buildUserPrompt(ticketCase.content, 0);
  let rawOutput = '';

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: prompt.systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: TicketAnalysisResponseFormat,
    });
    rawOutput = response.choices[0]?.message.content ?? '';
    const parsedOutput = JSON.parse(rawOutput) as TicketAnalysis;
    const validationResult = TicketAnalysisSchema.safeParse(parsedOutput);

    return {
      promptVersion: prompt.version,
      caseId: ticketCase.id,
      expectedCategory: ticketCase.expectedCategory,
      userPrompt,
      rawOutput,
      parsedOutput,
      schemaPassed: validationResult.success,
      categoryMatched:
        validationResult.success && validationResult.data.category === ticketCase.expectedCategory,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      promptVersion: prompt.version,
      caseId: ticketCase.id,
      expectedCategory: ticketCase.expectedCategory,
      userPrompt,
      rawOutput,
      parsedOutput: undefined,
      schemaPassed: false,
      categoryMatched: false,
      error: error instanceof Error ? error.message : 'Unknown eval error',
      latencyMs: Date.now() - startedAt,
    };
  }
}

function renderReport(input: {
  model: string;
  baseURL: string;
  cases: TicketCase[];
  prompts: TicketAnalysisPrompt[];
  results: EvalResult[];
}): string {
  const lines: string[] = [
    '# Prompt Stability Eval: Few-Shot vs No Few-Shot',
    '',
    `Generated at: ${new Date().toISOString()}`,
    `Model: ${input.model}`,
    `Base URL: ${input.baseURL}`,
    '',
    '## Scope',
    '',
    '- No few-shot: `ticket-analysis-v1`, 10 ticket cases.',
    '- With few-shot: `ticket-analysis-v2`, the same 10 ticket cases.',
    '- Output validation: strict ticket analysis schema plus expected category match.',
    '',
    '## Summary',
    '',
    '| Prompt version | Schema pass | Category match | Avg latency |',
    '| --- | ---: | ---: | ---: |',
    ...input.prompts.map((prompt) => renderSummaryRow(prompt.version, input.results)),
    '',
    '## Original Prompts',
    '',
  ];

  for (const prompt of input.prompts) {
    lines.push(
      `### ${prompt.version}`,
      '',
      'System prompt:',
      '',
      '```text',
      prompt.systemPrompt,
      '```',
      '',
    );
  }

  lines.push('## Test Cases', '', '| Case | Expected category | Content |', '| --- | --- | --- |');
  for (const ticketCase of input.cases) {
    lines.push(
      `| ${ticketCase.id} | ${ticketCase.expectedCategory} | ${escapeTableCell(ticketCase.content)} |`,
    );
  }

  lines.push('', '## Raw Results', '');
  for (const result of input.results) {
    lines.push(
      `### ${result.promptVersion} / ${result.caseId}`,
      '',
      `Expected category: ${result.expectedCategory}`,
      `Schema passed: ${String(result.schemaPassed)}`,
      `Category matched: ${String(result.categoryMatched)}`,
      `Latency: ${result.latencyMs}ms`,
      '',
      'User prompt:',
      '',
      '```text',
      result.userPrompt,
      '```',
      '',
      'Raw output:',
      '',
      codeBlock(result.rawOutput || JSON.stringify({ error: result.error }, null, 2), 'json'),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderSummaryRow(promptVersion: string, results: EvalResult[]): string {
  const promptResults = results.filter((result) => result.promptVersion === promptVersion);
  const schemaPassCount = promptResults.filter((result) => result.schemaPassed).length;
  const categoryMatchCount = promptResults.filter((result) => result.categoryMatched).length;
  const avgLatency = Math.round(
    promptResults.reduce((sum, result) => sum + result.latencyMs, 0) / promptResults.length,
  );

  return `| ${promptVersion} | ${schemaPassCount}/${promptResults.length} | ${categoryMatchCount}/${promptResults.length} | ${avgLatency}ms |`;
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|');
}

function codeBlock(value: string, language: string): string {
  const fence = value.includes('```') ? '````' : '```';
  return [language ? `${fence}${language}` : fence, value, fence].join('\n');
}

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    process.env[key] ??= value;
  }
}

void main();
