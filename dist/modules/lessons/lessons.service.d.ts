import { SupabaseService } from '../../config/supabase.service';
import { R2Service } from '../../config/r2.service';
import { ClaudeService } from './claude.service';
import { Lesson, LessonListItem, LessonOutline } from './interfaces/lesson-outline.interface';
export declare class LessonsService {
    private readonly supabase;
    private readonly r2;
    private readonly claude;
    private readonly logger;
    constructor(supabase: SupabaseService, r2: R2Service, claude: ClaudeService);
    generateLesson(materialId: string, userId: string): Promise<{
        lessonId: string;
        outline: LessonOutline;
    }>;
    findAllByUser(userId: string): Promise<LessonListItem[]>;
    findOneByUser(lessonId: string, userId: string): Promise<Lesson>;
}
