import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { LessonsModule } from './modules/lessons/lessons.module';

const logger = new Logger('AppModule');
const redisUrl = process.env.REDIS_URL;
const redisConfigured =
  !!redisUrl && !redisUrl.includes('your-') && redisUrl.startsWith('redis');

if (!redisConfigured) {
  logger.warn(
    'REDIS_URL not configured — BullMQ queues disabled. File parsing will not work until Redis is available.',
  );
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),

    ...(redisConfigured
      ? [
          BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              connection: {
                url: config.getOrThrow<string>('REDIS_URL'),
                maxRetriesPerRequest: null,
              },
            }),
          }),
        ]
      : []),

    UsersModule,
    FilesModule,
    LessonsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
