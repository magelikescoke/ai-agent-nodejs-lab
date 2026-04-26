import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LlmModule } from '../llm/llm.module';
import {
  TicketAnalysisMongoModelName,
  TicketAnalysisMongoSchema,
} from './ticket-analysis.model';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  imports: [
    LlmModule,
    MongooseModule.forFeature([
      {
        name: TicketAnalysisMongoModelName,
        schema: TicketAnalysisMongoSchema,
      },
    ]),
  ],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [MongooseModule],
})
export class TicketModule {}
