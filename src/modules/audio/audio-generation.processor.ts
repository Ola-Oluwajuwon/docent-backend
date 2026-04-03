import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SupabaseService } from '../../config/supabase.service';
import { ElevenLabsService } from './elevenlabs.service';
import { Lesson } from '../lessons/interfaces/lesson-outline.interface';

interface AudioGenerationJobData {
  lessonId: string;
  clerkId: string;
}

@Processor('audio-generation')
export class AudioGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioGenerationProcessor.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly elevenLabs: ElevenLabsService,
  ) {
    super();
  }

  async process(job: Job<AudioGenerationJobData>): Promise<void> {
    const { lessonId } = job.data;
    this.logger.log(`Processing audio generation for lesson: ${lessonId}`);

    try {
      const client = this.supabase.getClient();

      const lessonResult = await client
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonResult.error || !lessonResult.data) {
        throw new Error(`Lesson not found: ${lessonId}`);
      }

      const typedLesson = lessonResult.data as Lesson;
      const manifest = await this.elevenLabs.generateLessonAudio(
        lessonId,
        typedLesson.outline.segments,
      );

      const { error: manifestError } = await client
        .from('audio_manifests')
        .upsert({ lesson_id: lessonId, manifest }, { onConflict: 'lesson_id' });

      if (manifestError) {
        throw new Error(
          `Failed to save audio manifest: ${manifestError.message}`,
        );
      }

      await client
        .from('lessons')
        .update({ audio_status: 'ready' })
        .eq('id', lessonId);

      this.logger.log(`Audio generation complete for lesson: ${lessonId}`);
    } catch (error) {
      this.logger.error(
        `Audio generation failed for lesson ${lessonId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      await this.supabase
        .getClient()
        .from('lessons')
        .update({ audio_status: 'failed' })
        .eq('id', lessonId);

      throw error;
    }
  }
}
