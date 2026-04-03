import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { SupabaseService } from '../../config/supabase.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ProgressController],
  providers: [ProgressService, SupabaseService],
  exports: [ProgressService],
})
export class ProgressModule {}
