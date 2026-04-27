import { validate } from 'class-validator';
import { JobIdParamDto } from './job-id-param.dto';

describe('JobIdParamDto', () => {
  it('accepts BullMQ job ids', async () => {
    const dto = new JobIdParamDto();
    dto.id = '31d7e4df-bd20-4109-8857-f198f522f3a3-0';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects empty job ids', async () => {
    const dto = new JobIdParamDto();
    dto.id = '';

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      minLength: 'id must be longer than or equal to 1 characters',
    });
  });
});
