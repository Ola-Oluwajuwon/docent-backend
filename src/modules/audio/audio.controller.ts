import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  NotFoundException,
  ParseUUIDPipe,
  Optional,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../../config/supabase.service';
import { ChatterboxService } from './chatterbox.service';
import { GenerateAudioDto } from './dto/generate-audio.dto';

@Controller('audio')
export class AudioController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabase: SupabaseService,
    private readonly chatterbox: ChatterboxService,
    @Optional()
    @Inject('BullQueue_audio-generation')
    private readonly audioQueue?: Queue,
  ) {}

  @Get('tts/health')
  @Public()
  @ResponseMessage('TTS health check')
  async ttsHealth() {
    return this.chatterbox.healthCheck();
  }

  @Post('generate')
  @ResponseMessage('Audio generation started')
  async generate(
    @Body() dto: GenerateAudioDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );

    const client = this.supabase.getClient();
    const { data: lesson, error } = await client
      .from('lessons')
      .select('id, user_id')
      .eq('id', dto.lessonId)
      .eq('user_id', user.id)
      .single();

    if (error || !lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await client
      .from('lessons')
      .update({ audio_status: 'generating' })
      .eq('id', dto.lessonId);

    if (this.audioQueue) {
      await this.audioQueue.add(
        'generate-audio',
        { lessonId: dto.lessonId, clerkId: currentUser.clerkId },
        { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
      );
    }

    return { lessonId: dto.lessonId, audioStatus: 'generating' };
  }

  @Get(':lessonId/status')
  @ResponseMessage('Audio status retrieved')
  async getStatus(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );

    const client = this.supabase.getClient();
    const { data: lesson, error } = await client
      .from('lessons')
      .select('id, user_id, audio_status')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single();

    if (error || !lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const typedLesson = lesson as {
      id: string;
      user_id: string;
      audio_status: string;
    };

    const result: {
      lessonId: string;
      audioStatus: string;
      manifest?: unknown;
    } = {
      lessonId: typedLesson.id,
      audioStatus: typedLesson.audio_status,
    };

    if (typedLesson.audio_status === 'ready') {
      const { data: manifestRow } = await client
        .from('audio_manifests')
        .select('manifest')
        .eq('lesson_id', lessonId)
        .single();

      if (manifestRow) {
        result.manifest = (manifestRow as { manifest: unknown }).manifest;
      }
    }

    return result;
  }
}
