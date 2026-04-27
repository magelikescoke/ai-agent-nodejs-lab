import 'reflect-metadata';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { AnalyzeTicketDto } from './analyze-ticket.dto';

export class BatchAnalyzeTicketsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AnalyzeTicketDto)
  tickets!: AnalyzeTicketDto[];
}
