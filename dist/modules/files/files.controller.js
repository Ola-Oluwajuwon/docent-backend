"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const authenticated_user_interface_1 = require("../../common/interfaces/authenticated-user.interface");
const users_service_1 = require("../users/users.service");
const files_service_1 = require("./files.service");
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];
let FilesController = class FilesController {
    filesService;
    usersService;
    constructor(filesService, usersService) {
        this.filesService = filesService;
        this.usersService = usersService;
    }
    async uploadFile(file, currentUser) {
        const user = await this.usersService.findOrCreate(currentUser.clerkId, currentUser.email, '');
        return this.filesService.uploadFile(file, currentUser.clerkId, user.id);
    }
    async getStatus(materialId, currentUser) {
        const user = await this.usersService.findOrCreate(currentUser.clerkId, currentUser.email, '');
        return this.filesService.getMaterialStatus(materialId, user.id);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (_req, file, cb) => {
            if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new Error('Unsupported file type'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, authenticated_user_interface_1.AuthenticatedUser]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(':materialId/status'),
    __param(0, (0, common_1.Param)('materialId', new common_1.ParseUUIDPipe())),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, authenticated_user_interface_1.AuthenticatedUser]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getStatus", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService,
        users_service_1.UsersService])
], FilesController);
//# sourceMappingURL=files.controller.js.map