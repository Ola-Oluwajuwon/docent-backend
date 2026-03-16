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
var LessonsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../config/supabase.service");
const r2_service_1 = require("../../config/r2.service");
const claude_service_1 = require("./claude.service");
let LessonsService = LessonsService_1 = class LessonsService {
    supabase;
    r2;
    claude;
    logger = new common_1.Logger(LessonsService_1.name);
    constructor(supabase, r2, claude) {
        this.supabase = supabase;
        this.r2 = r2;
        this.claude = claude;
    }
    async generateLesson(materialId, userId) {
        const parsedTextBuffer = await this.r2.download(`parsed/${materialId}.txt`);
        const rawText = parsedTextBuffer.toString('utf-8');
        this.logger.log(`Generating lesson outline for material: ${materialId}`);
        const outline = await this.claude.generateLessonOutline(rawText);
        const client = this.supabase.getClient();
        const { data: lesson, error } = await client
            .from('lessons')
            .insert({
            material_id: materialId,
            user_id: userId,
            title: outline.title,
            subject: outline.subject,
            outline,
        })
            .select()
            .single();
        if (error || !lesson) {
            this.logger.error(`Failed to insert lesson: ${error?.message}`);
            throw new Error(`Failed to insert lesson: ${error?.message}`);
        }
        const created = lesson;
        this.logger.log(`Lesson created: ${created.id}`);
        return { lessonId: created.id, outline };
    }
    async findAllByUser(userId) {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from('lessons')
            .select('id, title, subject, outline, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            this.logger.error(`Failed to fetch lessons: ${error.message}`);
            throw new Error(`Failed to fetch lessons: ${error.message}`);
        }
        return data.map((lesson) => ({
            lessonId: lesson.id,
            title: lesson.title,
            subject: lesson.subject,
            estimatedDurationMinutes: lesson.outline.estimatedDurationMinutes,
            createdAt: lesson.created_at,
        }));
    }
    async findOneByUser(lessonId, userId) {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        return data;
    }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = LessonsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        r2_service_1.R2Service,
        claude_service_1.ClaudeService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map