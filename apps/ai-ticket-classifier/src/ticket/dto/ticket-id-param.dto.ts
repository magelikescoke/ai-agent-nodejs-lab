import { Matches } from 'class-validator';

export class TicketIdParamDto {
  @Matches(/^[a-f\d]{24}$/i, { message: 'id must be a valid MongoDB ObjectId' })
  id!: string;
}
