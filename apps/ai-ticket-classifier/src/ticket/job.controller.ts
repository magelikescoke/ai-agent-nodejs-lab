import { Controller, Get, Param } from '@nestjs/common';
import { JobIdParamDto } from './dto/job-id-param.dto';
import { TicketQueueService } from './ticket-queue.service';

@Controller('/jobs')
export class JobController {
  constructor(private readonly ticketQueueService: TicketQueueService) {}

  @Get('/:id')
  getJob(@Param() params: JobIdParamDto) {
    return this.ticketQueueService.getJob(params.id);
  }
}
