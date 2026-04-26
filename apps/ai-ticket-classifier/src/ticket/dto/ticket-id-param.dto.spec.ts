import { validate } from 'class-validator';
import { TicketIdParamDto } from './ticket-id-param.dto';

describe('TicketIdParamDto', () => {
  it('accepts MongoDB ObjectId params', async () => {
    const dto = new TicketIdParamDto();
    dto.id = '507f1f77bcf86cd799439011';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid MongoDB ObjectId params', async () => {
    const dto = new TicketIdParamDto();
    dto.id = 'not-an-object-id';

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      matches: 'id must be a valid MongoDB ObjectId',
    });
  });
});
