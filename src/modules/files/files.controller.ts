import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { FilesService } from './files.service';
import { UploadFileResponseDto } from './dto/upload-file-response.dto';
import { MaterialStatusResponseDto } from './dto/material-status-response.dto';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /(pdf|plain|wordprocessingml)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UploadFileResponseDto> {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );
    return this.filesService.uploadFile(file, currentUser.clerkId, user.id);
  }

  @Get(':materialId/status')
  async getStatus(
    @Param('materialId', new ParseUUIDPipe()) materialId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<MaterialStatusResponseDto> {
    const user = await this.usersService.findOrCreate(
      currentUser.clerkId,
      currentUser.email,
      '',
    );
    return this.filesService.getMaterialStatus(materialId, user.id);
  }
}
