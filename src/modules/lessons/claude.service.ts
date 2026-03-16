import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  LessonOutline,
  LessonSegment,
} from './interfaces/lesson-outline.interface';

@Injectable()
export class ClaudeService {
  private readonly client: Anthropic;
  private readonly logger = new Logger(ClaudeService.name);
  private readonly model = 'claude-sonnet-4-5-20250514';

  constructor(private readonly configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateLessonOutline(
    rawText: string,
    subject?: string,
  ): Promise<LessonOutline> {
    const subjectHint = subject
      ? `The subject area is: ${subject}.`
      : 'Infer the subject from the content.';

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system:
        'You are an expert curriculum designer. Your job is to transform raw educational content into a structured lesson outline. Always respond with valid JSON only — no markdown, no explanation, no preamble.',
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
      throw new InternalServerErrorException(
        'Claude returned no text content in response',
      );
    }

    return this.parseOutlineResponse(textBlock.text);
  }

  async generateLessonScript(segment: LessonSegment): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system:
        'You are Docent, a warm, encouraging, and engaging AI tutor. Speak directly to the student in a conversational tone, as if you are in the same room.',
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
      throw new InternalServerErrorException(
        'Claude returned no text content for script generation',
      );
    }

    return textBlock.text;
  }

  private parseOutlineResponse(raw: string): LessonOutline {
    let cleaned = raw.trim();

    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    try {
      const parsed: unknown = JSON.parse(cleaned);
      return parsed as LessonOutline;
    } catch {
      this.logger.error(`Failed to parse Claude response as JSON: ${cleaned.slice(0, 200)}`);
      throw new InternalServerErrorException(
        'Failed to parse lesson outline from AI response. The model returned invalid JSON.',
      );
    }
  }
}
