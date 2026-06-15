export interface GenerateTextOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  responseType?: 'text' | 'json';
}

export abstract class AIService {
  abstract generateText(options: GenerateTextOptions): Promise<string>;
}
