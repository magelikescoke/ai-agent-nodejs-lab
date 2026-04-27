import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { LlmModule } from '../llm/llm.module';
import { JobController } from './job.controller';
import { TicketAnalysisProcessor } from './ticket-analysis.processor';
import { TicketAnalysisMongoModelName, TicketAnalysisMongoSchema } from './ticket-analysis.model';
import { TICKET_ANALYSIS_QUEUE_NAME } from './ticket-queue.constants';
import { TicketQueueService } from './ticket-queue.service';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  imports: [
    LlmModule,
    BullModule.registerQueue({
      name: TICKET_ANALYSIS_QUEUE_NAME,
    }),
    MongooseModule.forFeature([
      {
        name: TicketAnalysisMongoModelName,
        schema: TicketAnalysisMongoSchema,
      },
    ]),
  ],
  controllers: [TicketController, JobController],
  providers: [TicketService, TicketQueueService, TicketAnalysisProcessor],
  exports: [MongooseModule, TicketQueueService],
})
export class TicketModule {}
