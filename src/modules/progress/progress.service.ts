import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';

export interface ProgressRecord {
  id: string;
  lesson_id: string;
  user_id: string;
  current_segment: number;
  completed: boolean;
  comprehension_score: number | null;
  updated_at: string;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async sync(
    lessonId: string,
    userId: string,
    currentSegment: number,
    completed: boolean,
    comprehensionScore?: number,
  ): Promise<ProgressRecord> {
    const client = this.supabase.getClient();

    const upsertResult = await client
      .from('progress')
      .upsert(
        {
          lesson_id: lessonId,
          user_id: userId,
          current_segment: currentSegment,
          completed,
          comprehension_score: comprehensionScore ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lesson_id,user_id' },
      )
      .select()
      .single();

    if (upsertResult.error || !upsertResult.data) {
      this.logger.error(
        `Failed to upsert progress: ${upsertResult.error?.message}`,
      );
      throw new InternalServerErrorException('Failed to sync progress');
    }

    return upsertResult.data as ProgressRecord;
  }

  async findByLessonAndUser(
    lessonId: string,
    userId: string,
  ): Promise<ProgressRecord> {
    const client = this.supabase.getClient();

    const selectResult = await client
      .from('progress')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('user_id', userId)
      .single();

    if (selectResult.error || !selectResult.data) {
      return {
        id: '',
        lesson_id: lessonId,
        user_id: userId,
        current_segment: 0,
        completed: false,
        comprehension_score: null,
        updated_at: new Date().toISOString(),
      };
    }

    return selectResult.data as ProgressRecord;
  }
}
