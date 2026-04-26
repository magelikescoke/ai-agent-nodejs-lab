import { Body, Controller, Post } from '@nestjs/common';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { TicketService } from './ticket.service';

@Controller('/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('/analyze')
  analyzeTicket(@Body() dto: AnalyzeTicketDto) {
    return this.ticketService.analyzeTicket(dto);
  }
}
