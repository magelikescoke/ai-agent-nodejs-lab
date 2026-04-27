import { IsString, MaxLength, MinLength } from 'class-validator';

export class JobIdParamDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  id!: string;
}
