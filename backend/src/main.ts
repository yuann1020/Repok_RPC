import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { RequestTimingInterceptor } from './common/interceptors/request-timing.interceptor';

const DEFAULT_BACKEND_PORT = 3001;
const LOCAL_FRONTEND_ORIGIN = 'http://localhost:3000';
const STRIPE_WEBHOOK_PATH = '/payments/stripe/webhook';

function getAllowedOrigins() {
  return [
    LOCAL_FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Stripe signature verification needs the unparsed request body on the backend webhook route.
  app.use(STRIPE_WEBHOOK_PATH, express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new RequestTimingInterceptor());
  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Allow curl/Postman/Stripe CLI requests that do not send an Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  });
  const port = process.env.PORT || DEFAULT_BACKEND_PORT;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
void bootstrap();
