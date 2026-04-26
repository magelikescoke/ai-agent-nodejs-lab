import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { TicketIdParamDto } from './dto/ticket-id-param.dto';
import { TicketService } from './ticket.service';

@Controller('/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('/analyze')
  analyzeTicket(@Body() dto: AnalyzeTicketDto) {
    return this.ticketService.analyzeTicket(dto);
  }

  @Get('/:id')
  getTicketAnalysis(@Param() params: TicketIdParamDto) {
    return this.ticketService.getTicketAnalysis(params.id);
  }
}
