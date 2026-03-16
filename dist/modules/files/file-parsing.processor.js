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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FileParsingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParsingProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const pdf_parse_1 = require("pdf-parse");
const mammoth_1 = __importDefault(require("mammoth"));
const r2_service_1 = require("../../config/r2.service");
const supabase_service_1 = require("../../config/supabase.service");
let FileParsingProcessor = FileParsingProcessor_1 = class FileParsingProcessor extends bullmq_1.WorkerHost {
    r2;
    supabase;
    logger = new common_1.Logger(FileParsingProcessor_1.name);
    constructor(r2, supabase) {
        super();
        this.r2 = r2;
        this.supabase = supabase;
    }
    async process(job) {
        const { materialId, storagePath, fileType } = job.data;
        this.logger.log(`Processing file: ${materialId} (${fileType})`);
        try {
            const buffer = await this.r2.download(storagePath);
            let text;
            switch (fileType) {
                case 'txt':
                    text = buffer.toString('utf-8');
                    break;
                case 'pdf': {
                    const parser = new pdf_parse_1.PDFParse({ data: new Uint8Array(buffer) });
                    const result = await parser.getText();
                    text = result.text;
                    break;
                }
                case 'docx': {
                    const result = await mammoth_1.default.extractRawText({ buffer });
                    text = result.value;
                    break;
                }
                default:
                    throw new Error(`Unsupported file type: ${fileType}`);
            }
            await this.r2.upload(`parsed/${materialId}.txt`, text, 'text/plain');
            await this.supabase
                .getClient()
                .from('materials')
                .update({ status: 'ready' })
                .eq('id', materialId);
            this.logger.log(`File parsed successfully: ${materialId}`);
        }
        catch (error) {
            this.logger.error(`File parsing failed for ${materialId}: ${error.message}`, error.stack);
            await this.supabase
                .getClient()
                .from('materials')
                .update({ status: 'failed' })
                .eq('id', materialId);
        }
    }
};
exports.FileParsingProcessor = FileParsingProcessor;
exports.FileParsingProcessor = FileParsingProcessor = FileParsingProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('file-parsing'),
    __metadata("design:paramtypes", [r2_service_1.R2Service,
        supabase_service_1.SupabaseService])
], FileParsingProcessor);
//# sourceMappingURL=file-parsing.processor.js.map