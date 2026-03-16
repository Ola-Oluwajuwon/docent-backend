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
var ClaudeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let ClaudeService = ClaudeService_1 = class ClaudeService {
    configService;
    client;
    logger = new common_1.Logger(ClaudeService_1.name);
    model = 'claude-sonnet-4-5-20250514';
    constructor(configService) {
        this.configService = configService;
        this.client = new sdk_1.default({
            apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
        });
    }
    async generateLessonOutline(rawText, subject) {
        const subjectHint = subject
            ? `The subject area is: ${subject}.`
            : 'Infer the subject from the content.';
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 4096,
            system: 'You are an expert curriculum designer. Your job is to transform raw educational content into a structured lesson outline. Always respond with valid JSON only — no markdown, no explanation, no preamble.',
            messages: [
                {
                    role: 'user',
                    content: `${subjectHint}

Transform the following educational content into a structured lesson outline. Return a JSON object with this exact schema:

{
  "title": "string",
  "subject": "string",
  "estimatedDurationMinutes": number,
  "prerequisites": ["string"],
  "objectives": ["string"],
  "segments": [
    {
      "id": "string (unique)",
      "title": "string",
      "type": "concept | example | analogy | check_understanding | summary",
      "content": "string",
      "checkQuestion": "string (optional, for check_understanding type)",
      "checkAnswer": "string (optional, for check_understanding type)"
    }
  ]
}

Content to transform:
${rawText}`,
                },
            ],
        });
        const textBlock = response.content.find((block) => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new common_1.InternalServerErrorException('Claude returned no text content in response');
        }
        return this.parseOutlineResponse(textBlock.text);
    }
    async generateLessonScript(segment) {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 2048,
            system: 'You are Docent, a warm, encouraging, and engaging AI tutor. Speak directly to the student in a conversational tone, as if you are in the same room.',
            messages: [
                {
                    role: 'user',
                    content: `Write a 2–4 paragraph spoken narration script for the following lesson segment.

Segment type: ${segment.type}
Segment title: ${segment.title}
Content: ${segment.content}`,
                },
            ],
        });
        const textBlock = response.content.find((block) => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new common_1.InternalServerErrorException('Claude returned no text content for script generation');
        }
        return textBlock.text;
    }
    parseOutlineResponse(raw) {
        let cleaned = raw.trim();
        const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
            cleaned = fenceMatch[1].trim();
        }
        try {
            const parsed = JSON.parse(cleaned);
            return parsed;
        }
        catch {
            this.logger.error(`Failed to parse Claude response as JSON: ${cleaned.slice(0, 200)}`);
            throw new common_1.InternalServerErrorException('Failed to parse lesson outline from AI response. The model returned invalid JSON.');
        }
    }
};
exports.ClaudeService = ClaudeService;
exports.ClaudeService = ClaudeService = ClaudeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClaudeService);
//# sourceMappingURL=claude.service.js.map