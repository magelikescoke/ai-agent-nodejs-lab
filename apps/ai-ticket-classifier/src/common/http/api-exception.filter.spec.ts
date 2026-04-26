import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

function createHostMock() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const host = {
    switchToHttp: jest.fn(() => ({
      getResponse: jest.fn(() => response),
    })),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('ApiExceptionFilter', () => {
  it('formats HTTP exceptions with the shared API envelope', () => {
    const { host, response } = createHostMock();
    const filter = new ApiExceptionFilter();

    filter.catch(new BadRequestException(['content is required']), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: 400,
      data: {},
      errors: ['content is required'],
    });
  });

  it('formats unknown exceptions as internal server errors', () => {
    const { host, response } = createHostMock();
    const filter = new ApiExceptionFilter();

    filter.catch(new Error('database failed'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      code: 500,
      data: {},
      errors: ['database failed'],
    });
  });
});
