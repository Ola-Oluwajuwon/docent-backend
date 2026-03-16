export interface LessonSegment {
    id: string;
    title: string;
    type: 'concept' | 'example' | 'analogy' | 'check_understanding' | 'summary';
    content: string;
    checkQuestion?: string;
    checkAnswer?: string;
}
export interface LessonOutline {
    title: string;
    subject: string;
    estimatedDurationMinutes: number;
    prerequisites: string[];
    objectives: string[];
    segments: LessonSegment[];
}
export interface Lesson {
    id: string;
    material_id: string;
    user_id: string;
    title: string;
    subject: string | null;
    outline: LessonOutline;
    created_at: string;
}
export interface LessonListItem {
    lessonId: string;
    title: string;
    subject: string | null;
    estimatedDurationMinutes: number;
    createdAt: string;
}
