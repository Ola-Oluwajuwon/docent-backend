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
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const uuid_1 = require("uuid");
const supabase_service_1 = require("../../config/supabase.service");
const r2_service_1 = require("../../config/r2.service");
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];
const MIME_TO_EXT = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
};
let FilesService = FilesService_1 = class FilesService {
    supabase;
    r2;
    fileParsingQueue;
    logger = new common_1.Logger(FilesService_1.name);
    constructor(supabase, r2, fileParsingQueue) {
        this.supabase = supabase;
        this.r2 = r2;
        this.fileParsingQueue = fileParsingQueue;
    }
    async uploadFile(file, clerkId, userId) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: pdf, docx, txt`);
        }
        const ext = MIME_TO_EXT[file.mimetype];
        const fileId = (0, uuid_1.v4)();
        const storagePath = `uploads/${clerkId}/${fileId}.${ext}`;
        await this.r2.upload(storagePath, file.buffer, file.mimetype);
        const client = this.supabase.getClient();
        const { data: material, error } = await client
            .from('materials')
            .insert({
            user_id: userId,
            file_name: file.originalname,
            file_type: ext,
            storage_path: storagePath,
            status: 'uploading',
        })
            .select()
            .single();
        if (error || !material) {
            this.logger.error(`Failed to insert material: ${error?.message}`);
            throw new Error(`Failed to insert material: ${error?.message}`);
        }
        const mat = material;
        await client
            .from('materials')
            .update({ status: 'processing' })
            .eq('id', mat.id);
        if (this.fileParsingQueue) {
            await this.fileParsingQueue.add('parse', {
                materialId: mat.id,
                storagePath,
                fileType: ext,
                clerkId,
            });
            this.logger.log(`File queued for parsing: ${mat.id}`);
        }
        else {
            this.logger.warn(`Redis not available — file ${mat.id} uploaded but parsing is deferred`);
        }
        return { materialId: mat.id, fileName: file.originalname };
    }
    async getMaterialStatus(materialId, userId) {
        const client = this.supabase.getClient();
        const { data: material, error } = await client
            .from('materials')
            .select('*')
            .eq('id', materialId)
            .eq('user_id', userId)
            .single();
        if (error || !material) {
            throw new common_1.NotFoundException('Material not found');
        }
        const mat = material;
        const result = {
            materialId: mat.id,
            status: mat.status,
        };
        if (mat.status === 'ready') {
            const { data: lesson } = await client
                .from('lessons')
                .select('id')
                .eq('material_id', materialId)
                .single();
            if (lesson) {
                result.lessonId = lesson.id;
            }
        }
        return result;
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)('BullQueue_file-parsing')),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        r2_service_1.R2Service,
        bullmq_1.Queue])
], FilesService);
//# sourceMappingURL=files.service.js.map