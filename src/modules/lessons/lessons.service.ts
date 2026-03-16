import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { R2Service } from '../../config/r2.service';
import { ClaudeService } from './claude.service';
import {
  Lesson,
  LessonListItem,
  LessonOutline,
} from './interfaces/lesson-outline.interface';

@Injectable()
export class LessonsService {
  private readonly logger = new Logger(LessonsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly r2: R2Service,
    private readonly claude: ClaudeService,
  ) {}

  async generateLesson(
    materialId: string,
    userId: string,
  ): Promise<{ lessonId: string; outline: LessonOutline }> {
    const parsedTextBuffer = await this.r2.download(
      `parsed/${materialId}.txt`,
    );
    const rawText = parsedTextBuffer.toString('utf-8');

    this.logger.log(`Generating lesson outline for material: ${materialId}`);
    const outline = await this.claude.generateLessonOutline(rawText);

    const client = this.supabase.getClient();
    const { data: lesson, error } = await client
      .from('lessons')
      .insert({
        material_id: materialId,
        user_id: userId,
        title: outline.title,
        subject: outline.subject,
        outline,
      })
      .select()
      .single();

    if (error || !lesson) {
      this.logger.error(`Failed to insert lesson: ${error?.message}`);
      throw new Error(`Failed to insert lesson: ${error?.message}`);
    }

    const created = lesson as Lesson;
    this.logger.log(`Lesson created: ${created.id}`);

    return { lessonId: created.id, outline };
  }

  async findAllByUser(userId: string): Promise<LessonListItem[]> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('lessons')
      .select('id, title, subject, outline, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch lessons: ${error.message}`);
      throw new Error(`Failed to fetch lessons: ${error.message}`);
    }

    return (data as Lesson[]).map((lesson) => ({
      lessonId: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      estimatedDurationMinutes: lesson.outline.estimatedDurationMinutes,
      createdAt: lesson.created_at,
    }));
  }

  async findOneByUser(
    lessonId: string,
    userId: string,
  ): Promise<Lesson> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Lesson not found');
    }

    return data as Lesson;
  }
}
