import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BatchAnalyzeTicketsDto } from './batch-analyze-tickets.dto';

describe('BatchAnalyzeTicketsDto', () => {
  it('accepts up to 20 ticket analysis requests', async () => {
    const dto = plainToInstance(BatchAnalyzeTicketsDto, {
      tickets: [
        {
          content: 'I cannot sign in.',
        },
        {
          content: 'The dashboard returns a 500 error.',
        },
      ],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.tickets[0]?.content).toBe('I cannot sign in.');
  });

  it('rejects empty ticket batches', async () => {
    const dto = plainToInstance(BatchAnalyzeTicketsDto, {
      tickets: [],
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      arrayMinSize: 'tickets must contain at least 1 elements',
    });
  });

  it('rejects batches larger than 20 tickets', async () => {
    const dto = plainToInstance(BatchAnalyzeTicketsDto, {
      tickets: Array.from({ length: 21 }, (_value, index) => ({
        content: `Ticket ${index}`,
      })),
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      arrayMaxSize: 'tickets must contain no more than 20 elements',
    });
  });

  it('rejects invalid nested ticket content', async () => {
    const dto = plainToInstance(BatchAnalyzeTicketsDto, {
      tickets: [
        {
          content: '   ',
        },
      ],
    });

    const errors = await validate(dto);

    expect(errors[0]?.children?.[0]?.children?.[0]?.constraints).toMatchObject({
      minLength: 'content is required',
    });
  });
});
