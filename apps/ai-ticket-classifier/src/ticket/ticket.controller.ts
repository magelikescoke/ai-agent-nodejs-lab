import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { BatchAnalyzeTicketsDto } from './dto/batch-analyze-tickets.dto';
import { TicketIdParamDto } from './dto/ticket-id-param.dto';
import { TicketQueueService } from './ticket-queue.service';
import { TicketService } from './ticket.service';
import { Response } from 'express';
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

  @Get('/analyze/stream')
  async getTicketAnalysisStream(@Query() query: AnalyzeTicketDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    await this.ticketService.analyzeTicketStream(query, {
      onReceived: () => res.write(`event: analysis.received\ndata: {} \n\n`),
      onAnalyzing: () => res.write(`event: analysis.analyzing\ndata: {}\n\n`),
      onToken: (delta) => res.write(`event: llm.token\ndata: ${JSON.stringify({ delta })}\n\n`),
      onDone: () => res.write(`event: analysis.completed\ndata: {}\n\n`),
      onValidating: () => res.write(`event: analysis.validating\ndata: {}\n\n`),
      onError: (error) => res.write(`event: error\ndata: ${JSON.stringify({ message: (error as any).message })}\n\n`),
    });

    res.end();
  }
}
