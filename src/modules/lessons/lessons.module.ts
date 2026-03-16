import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { ClaudeService } from './claude.service';
import { R2Service } from '../../config/r2.service';
import { SupabaseService } from '../../config/supabase.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [LessonsController],
  providers: [LessonsService, ClaudeService, R2Service, SupabaseService],
})
export class LessonsModule {}
