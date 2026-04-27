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

  it('rejects ticket content longer than 10000 characters', async () => {
    const dto = plainToInstance(AnalyzeTicketDto, {
      content: 'a'.repeat(10_001),
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      maxLength: 'content must be shorter than or equal to 10000 characters',
    });
  });
});
