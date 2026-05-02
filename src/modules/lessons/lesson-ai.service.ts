import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import {
  LessonOutline,
  LessonSegment,
} from './interfaces/lesson-outline.interface';

@Injectable()
export class LessonAIService {
  private readonly logger = new Logger(LessonAIService.name);

  constructor(private readonly ai: AIService) {}

  async generateLessonOutline(
    rawText: string,
    subject?: string,
  ): Promise<LessonOutline> {
    const subjectHint = subject
      ? `The subject area is: ${subject}.`
      : 'Infer the subject from the content.';

    const text = await this.ai.generateText({
      systemPrompt:
        'You are an expert curriculum designer. Your job is to transform raw educational content into a structured lesson outline. ' +
        'Create a concise, focused lesson (30-60 minutes total). Limit the number of segments to a maximum of 15. ' +
        'Always respond with valid JSON only — no explanation, no preamble.',
      userMessage: `${subjectHint}

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
      maxTokens: 4096,
      responseType: 'json',
    });

    return this.parseOutlineResponse(text);
  }

  async generateLessonScript(segment: LessonSegment): Promise<string> {
    return this.ai.generateText({
      systemPrompt:
        'You are Docent, a warm, encouraging, and engaging AI tutor. Speak directly to the student in a conversational tone, as if you are in the same room.',
      userMessage: `Write a 2–4 paragraph spoken narration script for the following lesson segment.

Segment type: ${segment.type}
Segment title: ${segment.title}
Content: ${segment.content}`,
      maxTokens: 2048,
    });
  }

  private parseOutlineResponse(raw: string): LessonOutline {
    let cleaned = raw.trim();

    // Remove markdown code fences if present, even if closing fence is missing
    if (cleaned.includes('```')) {
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
      if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
      }
    }

    // Sometimes models add a preamble or postamble outside the braces
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else if (firstBrace !== -1) {
      cleaned = cleaned.substring(firstBrace);
    }

    try {
      return JSON.parse(cleaned) as LessonOutline;
    } catch (err) {
      this.logger.error(
        `Failed to parse AI response as JSON. Error: ${err.message}. Raw prefix: ${cleaned.slice(0, 200)}`,
      );
      throw new InternalServerErrorException(
        'Failed to parse lesson outline from AI response. The model returned invalid or truncated JSON.',
      );
    }
  }
}
