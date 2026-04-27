import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('returns health status', () => {
    expect(service.getHealth()).toEqual({
      status: 'ok',
      service: 'ai-ticket-classifier',
    });
  });
});
