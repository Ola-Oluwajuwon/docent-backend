import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileParsingProcessor } from './file-parsing.processor';
import { R2Service } from '../../config/r2.service';
import { SupabaseService } from '../../config/supabase.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'file-parsing' }),
    UsersModule,
  ],
  controllers: [FilesController],
  providers: [FilesService, FileParsingProcessor, R2Service, SupabaseService],
})
export class FilesModule {}
