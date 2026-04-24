import { Injectable } from '@nestjs/common';
import { ClassifyTicketDto } from './dto/classify-ticket.dto';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'ai-ticket-classifier',
    };
  }

  classifyTicket(ticket: ClassifyTicketDto) {
    const text = `${ticket.title} ${ticket.description}`.toLowerCase();
    const priority = text.includes('urgent') || text.includes('down') ? 'high' : 'normal';

    return {
      category: 'general',
      priority,
      confidence: 0.5,
      summary: ticket.title,
    };
  }
}
