import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfiguration } from './config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appConfiguration = configService.getOrThrow<AppConfiguration>('app');

  await app.listen(appConfiguration.port);
}

void bootstrap();
