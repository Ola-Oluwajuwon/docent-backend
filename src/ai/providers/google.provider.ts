import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService, GenerateTextOptions } from '../ai.service';

export class GoogleProvider extends AIService {
  private readonly client: GoogleGenerativeAI;
  private readonly model: string;

  constructor(configService: ConfigService) {
    super();
    this.client = new GoogleGenerativeAI(
      configService.getOrThrow<string>('AI_API_KEY'),
    );
    this.model = configService.getOrThrow<string>('AI_MODEL');
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: options.systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: options.userMessage }] }],
      generationConfig: { maxOutputTokens: options.maxTokens },
    });

    const text = result.response.text();
    if (!text) {
      throw new InternalServerErrorException(
        'AI provider returned no text content in response',
      );
    }

    return text;
  }
}
