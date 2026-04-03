import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AudioController } from './audio.controller';
import { ChatterboxService } from './chatterbox.service';
import { AudioGenerationProcessor } from './audio-generation.processor';
import { R2Service } from '../../config/r2.service';
import { SupabaseService } from '../../config/supabase.service';
import { LessonsModule } from '../lessons/lessons.module';
import { UsersModule } from '../users/users.module';

const redisUrl = process.env.REDIS_URL;
const redisConfigured =
  !!redisUrl && !redisUrl.includes('your-') && redisUrl.startsWith('redis');

@Module({
  imports: [
    ...(redisConfigured
      ? [BullModule.registerQueue({ name: 'audio-generation' })]
      : []),
    LessonsModule,
    UsersModule,
  ],
  controllers: [AudioController],
  providers: [
    ChatterboxService,
    ...(redisConfigured ? [AudioGenerationProcessor] : []),
    R2Service,
    SupabaseService,
  ],
  exports: [ChatterboxService],
})
export class AudioModule {}
