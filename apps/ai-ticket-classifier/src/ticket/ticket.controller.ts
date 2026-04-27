import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { type AgentEvent } from '../common/events/agent-event';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { BatchAnalyzeTicketsDto } from './dto/batch-analyze-tickets.dto';
import { TicketIdParamDto } from './dto/ticket-id-param.dto';
import { TicketQueueService } from './ticket-queue.service';
import { TicketService } from './ticket.service';

@Controller('/tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly ticketQueueService: TicketQueueService,
  ) {}

  @Post('/analyze')
  analyzeTicket(@Body() dto: AnalyzeTicketDto) {
    return this.ticketService.analyzeTicket(dto);
  }

  @Post('/batch-analyze')
  batchAnalyzeTickets(@Body() dto: BatchAnalyzeTicketsDto) {
    return this.ticketQueueService.batchAnalyzeTickets(dto);
  }

  @Get('/analyze/stream')
  async getTicketAnalysisStream(@Query() query: AnalyzeTicketDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await this.ticketService.analyzeTicketStream(query, {
      onEvent: (event) => res.write(this.formatSseEvent(event)),
    });

    res.end();
  }

  @Get('/:id')
  getTicketAnalysis(@Param() params: TicketIdParamDto) {
    return this.ticketService.getTicketAnalysis(params.id);
  }

  private formatSseEvent(event: AgentEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  }
}
