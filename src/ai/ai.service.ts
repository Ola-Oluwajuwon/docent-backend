export interface GenerateTextOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
}

export abstract class AIService {
  abstract generateText(options: GenerateTextOptions): Promise<string>;
}
