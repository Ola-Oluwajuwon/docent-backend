import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIService, GenerateTextOptions } from '../ai.service';

export class AnthropicProvider extends AIService {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(configService: ConfigService) {
    super();
    this.client = new Anthropic({
      apiKey: configService.getOrThrow<string>('AI_API_KEY'),
    });
    this.model = configService.getOrThrow<string>('AI_MODEL');
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new InternalServerErrorException(
        'AI provider returned no text content in response',
      );
    }

    return textBlock.text;
  }
}
