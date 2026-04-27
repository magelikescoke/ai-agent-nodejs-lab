import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Get('/:id')
  getTicketAnalysis(@Param() params: TicketIdParamDto) {
    return this.ticketService.getTicketAnalysis(params.id);
  }
}
