import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyAppConfig, setupSwagger } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  applyAppConfig(app);
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
