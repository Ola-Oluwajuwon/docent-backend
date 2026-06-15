import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2Service } from '../../config/r2.service';
import { LessonAIService } from '../lessons/lesson-ai.service';
import { LessonOutline } from '../lessons/interfaces/lesson-outline.interface';
import { AudioManifest } from './interfaces/audio-manifest.interface';

interface ChatterboxTTSRequest {
  text: string;
  voice_mode: 'predefined';
  predefined_voice_id: string;
  language: string;
  output_format: 'wav';
  exaggeration: number;
  cfg_weight: number;
  temperature: number;
  speed_factor: number;
  chunk_size: number;
  seed: number;
  split_text: boolean;
}

@Injectable()
export class ChatterboxService {
  private readonly baseUrl: string;
  private readonly voice: string;
  private readonly exaggeration: number;
  private readonly cfgWeight: number;
  private readonly temperature: number;
  private readonly logger = new Logger(ChatterboxService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly r2: R2Service,
    private readonly lessonAI: LessonAIService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('CHATTERBOX_API_URL');
    this.voice = this.configService.get<string>(
      'CHATTERBOX_VOICE',
      'Emily.wav',
    );
    this.exaggeration = parseFloat(
      this.configService.get<string>('CHATTERBOX_EXAGGERATION', '0.5'),
    );
    this.cfgWeight = parseFloat(
      this.configService.get<string>('CHATTERBOX_CFG_WEIGHT', '0.5'),
    );
    this.temperature = parseFloat(
      this.configService.get<string>('CHATTERBOX_TEMPERATURE', '0.8'),
    );
  }

  async generateSpeech(text: string): Promise<Buffer> {
    this.logger.log(`Generating speech for text (${text.length} chars)`);

    const requestBody: ChatterboxTTSRequest = {
      text,
      voice_mode: 'predefined',
      predefined_voice_id: this.voice,
      language: 'en',
      output_format: 'wav',
      exaggeration: this.exaggeration,
      cfg_weight: this.cfgWeight,
      temperature: this.temperature,
      speed_factor: 1,
      chunk_size: 140,
      seed: 4096,
      split_text: true,
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      this.logger.error(
        `Chatterbox network error: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        `Chatterbox network error: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      const errorBody = await response
        .text()
        .catch(() => 'Unable to read response body');
      this.logger.error(`Chatterbox returned ${response.status}: ${errorBody}`);
      throw new InternalServerErrorException(
        `Chatterbox returned ${response.status}: ${errorBody}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async healthCheck(): Promise<{ ok: boolean; url: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/api/model-info`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return { ok: response.ok, url: this.baseUrl };
    } catch {
      return { ok: false, url: this.baseUrl };
    }
  }

  async generateLessonAudio(
    lessonId: string,
    segments: LessonOutline['segments'],
  ): Promise<AudioManifest> {
    this.logger.log(
      `Generating audio for lesson ${lessonId} (${segments.length} segments)`,
    );

    const manifestSegments: AudioManifest['segments'] = [];

    for (const segment of segments) {
      const script = await this.lessonAI.generateLessonScript(segment);
      const audioBuffer = await this.generateSpeech(script);

      const r2Key = `audio/${lessonId}/${segment.id}.wav`;
      const audioUrl = await this.r2.upload(r2Key, audioBuffer, 'audio/wav');

      this.logger.log(`Audio uploaded for segment ${segment.id}: ${r2Key}`);

      manifestSegments.push({
        segmentId: segment.id,
        title: segment.title,
        type: segment.type,
        audioUrl,
        checkQuestion: segment.checkQuestion,
      });
    }

    this.logger.log(`Audio generation complete for lesson ${lessonId}`);
    return { lessonId, segments: manifestSegments };
  }
}
