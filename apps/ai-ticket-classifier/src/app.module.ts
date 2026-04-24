import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { llmConfig } from './config/llm.config';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/ai-ticket-classifier/.env', '.env'],
      load: [appConfig, llmConfig],
    }),
    LlmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
