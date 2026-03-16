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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../config/supabase.service");
let UsersService = UsersService_1 = class UsersService {
    supabase;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findOrCreate(clerkId, email, name) {
        const client = this.supabase.getClient();
        const { data: existing, error: findError } = await client
            .from('users')
            .select('*')
            .eq('clerk_id', clerkId)
            .single();
        if (existing && !findError) {
            return existing;
        }
        const { data: created, error: createError } = await client
            .from('users')
            .upsert({ clerk_id: clerkId, email, name }, { onConflict: 'clerk_id' })
            .select()
            .single();
        if (createError || !created) {
            this.logger.error(`Failed to upsert user: ${createError?.message}`);
            throw new Error(`Failed to upsert user: ${createError?.message}`);
        }
        this.logger.log(`User upserted: ${clerkId}`);
        return created;
    }
    async findByClerkId(clerkId) {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('clerk_id', clerkId)
            .single();
        if (error || !data) {
            return null;
        }
        return data;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map