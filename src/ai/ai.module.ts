import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';

@Global()
@Module({
  providers: [
    {
      provide: AIService,
      useFactory: (configService: ConfigService) => {
        const provider = configService.getOrThrow<string>('AI_PROVIDER');

        switch (provider) {
          case 'anthropic':
            return new AnthropicProvider(configService);
          default:
            throw new Error(
              `Unsupported AI provider: "${provider}". Supported providers: anthropic`,
            );
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [AIService],
})
export class AIModule {}
