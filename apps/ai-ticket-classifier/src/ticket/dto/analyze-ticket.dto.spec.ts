import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AnalyzeTicketDto } from './analyze-ticket.dto';

describe('AnalyzeTicketDto', () => {
  it('trims and accepts valid ticket content', async () => {
    const dto = plainToInstance(AnalyzeTicketDto, {
      content: '  I cannot sign in.  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.content).toBe('I cannot sign in.');
  });

  it('rejects empty ticket content', async () => {
    const dto = plainToInstance(AnalyzeTicketDto, {
      content: '   ',
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      minLength: 'content is required',
    });
  });
});
