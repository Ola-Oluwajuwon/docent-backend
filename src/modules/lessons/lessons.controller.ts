import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { LessonsService } from './lessons.service';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import { LessonOutline } from './interfaces/lesson-outline.interface';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('generate')
  async generate(
    @Body() dto: GenerateLessonDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ lessonId: string; outline: LessonOutline }> {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );
    return this.lessonsService.generateLesson(dto.materialId, user.id);
  }

  @Get()
  async findAll(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );
    return this.lessonsService.findAllByUser(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );
    return this.lessonsService.findOneByUser(id, user.id);
  }
}
