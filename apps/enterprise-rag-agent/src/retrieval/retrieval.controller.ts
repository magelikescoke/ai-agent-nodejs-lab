import { Body, Controller, Post } from '@nestjs/common';
import { RetrievalSearchRequest, RetrievalSearchResponse } from './dto/retrieval-search.dto';
import { RetrievalService } from './retrieval.service';

@Controller('retrieval')
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  @Post('search')
  search(@Body() request: RetrievalSearchRequest): Promise<RetrievalSearchResponse> {
    return this.retrievalService.search(request);
  }
}
