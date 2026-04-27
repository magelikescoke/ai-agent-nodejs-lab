import { registerAs } from '@nestjs/config';
import { DEFAULT_TICKET_ANALYSIS_PROMPT_VERSION } from '../prompts/ticket-analysis.prompts';

export interface AppConfiguration {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  redisUrl: string;
  ticketAnalysisPromptVersion: string;
}

export const appConfig = registerAs(
  'app',
  (): AppConfiguration => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    mongodbUri:
      process.env.MONGODB_URI ??
      'mongodb://root:example@localhost:27017/ai_ticket_classifier?authSource=admin',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    ticketAnalysisPromptVersion:
      process.env.TICKET_ANALYSIS_PROMPT_VERSION ?? DEFAULT_TICKET_ANALYSIS_PROMPT_VERSION,
  }),
);
