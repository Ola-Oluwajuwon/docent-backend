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
exports.LessonsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const authenticated_user_interface_1 = require("../../common/interfaces/authenticated-user.interface");
const users_service_1 = require("../users/users.service");
const lessons_service_1 = require("./lessons.service");
const generate_lesson_dto_1 = require("./dto/generate-lesson.dto");
let LessonsController = class LessonsController {
    lessonsService;
    usersService;
    constructor(lessonsService, usersService) {
        this.lessonsService = lessonsService;
        this.usersService = usersService;
    }
    async generate(dto, currentUser) {
        const user = await this.usersService.findOrCreate(currentUser.clerkId, currentUser.email, '');
        return this.lessonsService.generateLesson(dto.materialId, user.id);
    }
    async findAll(currentUser) {
        const user = await this.usersService.findOrCreate(currentUser.clerkId, currentUser.email, '');
        return this.lessonsService.findAllByUser(user.id);
    }
    async findOne(id, currentUser) {
        const user = await this.usersService.findOrCreate(currentUser.clerkId, currentUser.email, '');
        return this.lessonsService.findOneByUser(id, user.id);
    }
};
exports.LessonsController = LessonsController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_lesson_dto_1.GenerateLessonDto,
        authenticated_user_interface_1.AuthenticatedUser]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [authenticated_user_interface_1.AuthenticatedUser]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, authenticated_user_interface_1.AuthenticatedUser]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "findOne", null);
exports.LessonsController = LessonsController = __decorate([
    (0, common_1.Controller)('lessons'),
    __metadata("design:paramtypes", [lessons_service_1.LessonsService,
        users_service_1.UsersService])
], LessonsController);
//# sourceMappingURL=lessons.controller.js.map