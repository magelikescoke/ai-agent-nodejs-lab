import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('health:app')
  @CacheTTL(30_000)
  getHealth() {
    return this.appService.getHealth();
  }
}
