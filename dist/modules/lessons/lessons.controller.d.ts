import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { LessonsService } from './lessons.service';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import { LessonOutline } from './interfaces/lesson-outline.interface';
export declare class LessonsController {
    private readonly lessonsService;
    private readonly usersService;
    constructor(lessonsService: LessonsService, usersService: UsersService);
    generate(dto: GenerateLessonDto, currentUser: AuthenticatedUser): Promise<{
        lessonId: string;
        outline: LessonOutline;
    }>;
    findAll(currentUser: AuthenticatedUser): Promise<import("./interfaces/lesson-outline.interface").LessonListItem[]>;
    findOne(id: string, currentUser: AuthenticatedUser): Promise<import("./interfaces/lesson-outline.interface").Lesson>;
}
