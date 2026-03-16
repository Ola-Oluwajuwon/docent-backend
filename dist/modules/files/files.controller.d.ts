import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { FilesService } from './files.service';
import { UploadFileResponseDto } from './dto/upload-file-response.dto';
import { MaterialStatusResponseDto } from './dto/material-status-response.dto';
export declare class FilesController {
    private readonly filesService;
    private readonly usersService;
    constructor(filesService: FilesService, usersService: UsersService);
    uploadFile(file: Express.Multer.File, currentUser: AuthenticatedUser): Promise<UploadFileResponseDto>;
    getStatus(materialId: string, currentUser: AuthenticatedUser): Promise<MaterialStatusResponseDto>;
}
