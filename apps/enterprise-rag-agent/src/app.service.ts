import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from './config/app.config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    const appConfig = this.configService.getOrThrow<AppConfiguration>('app');

    return {
      service: 'enterprise-rag-agent',
      status: 'ok',
      version: '0.1.0',
      vectorStore: {
        provider: 'qdrant',
        configuredUrl: appConfig.qdrantUrl,
      },
    };
  }
}
