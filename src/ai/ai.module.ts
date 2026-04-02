import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';

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
          case 'google':
            return new GoogleProvider(configService);
          default:
            throw new Error(
              `Unsupported AI provider: "${provider}". Supported providers: anthropic, google`,
            );
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [AIService],
})
export class AIModule {}
