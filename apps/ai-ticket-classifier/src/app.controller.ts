import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ClassifyTicketDto } from './dto/classify-ticket.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Post('tickets/classify')
  classifyTicket(@Body() ticket: ClassifyTicketDto) {
    return this.appService.classifyTicket(ticket);
  }
}
