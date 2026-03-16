import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
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

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

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
      fileFilter: (
        _req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
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
