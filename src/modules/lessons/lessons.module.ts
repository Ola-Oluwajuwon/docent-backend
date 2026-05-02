import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonAIService } from './lesson-ai.service';
import { R2Service } from '../../config/r2.service';
import { SupabaseService } from '../../config/supabase.service';
import { UsersModule } from '../users/users.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [UsersModule, ProgressModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonAIService, R2Service, SupabaseService],
  exports: [LessonAIService],
})
export class LessonsModule {}
