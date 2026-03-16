import { ConfigService } from '@nestjs/config';
import { LessonOutline, LessonSegment } from './interfaces/lesson-outline.interface';
export declare class ClaudeService {
    private readonly configService;
    private readonly client;
    private readonly logger;
    private readonly model;
    constructor(configService: ConfigService);
    generateLessonOutline(rawText: string, subject?: string): Promise<LessonOutline>;
    generateLessonScript(segment: LessonSegment): Promise<string>;
    private parseOutlineResponse;
}
