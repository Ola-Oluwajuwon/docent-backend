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
var SupabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = SupabaseService_1 = class SupabaseService {
    configService;
    client;
    initialized = false;
    logger = new common_1.Logger(SupabaseService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const url = this.configService.get('SUPABASE_URL', '');
        const key = this.configService.get('SUPABASE_SERVICE_ROLE_KEY', '');
        if (!url || !key || url.includes('your-project')) {
            this.logger.warn('Supabase credentials not configured — database calls will fail until valid values are provided in .env');
            this.client = (0, supabase_js_1.createClient)('https://placeholder.supabase.co', 'placeholder', {
                auth: { autoRefreshToken: false, persistSession: false },
            });
            return;
        }
        this.client = (0, supabase_js_1.createClient)(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        this.initialized = true;
        this.logger.log('Supabase admin client initialized');
    }
    getClient() {
        return this.client;
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = SupabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map