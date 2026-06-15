import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { ProgressService } from './progress.service';
import { SyncProgressDto } from './dto/sync-progress.dto';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly usersService: UsersService,
  ) {}

  @Post('sync')
  @ResponseMessage('Progress synced')
  async sync(
    @Body() dto: SyncProgressDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );
    return this.progressService.sync(
      dto.lessonId,
      user.id,
      dto.currentSegment,
      dto.completed,
      dto.comprehensionScore,
    );
  }

  @Get(':lessonId')
  @ResponseMessage('Progress retrieved')
  async findOne(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );
    return this.progressService.findByLessonAndUser(lessonId, user.id);
  }
}
