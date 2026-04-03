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

@Injectable()
export class ChatterboxService {
  private readonly apiUrl: string;
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
    this.apiUrl = this.configService.getOrThrow<string>('CHATTERBOX_API_URL');
    this.voice = this.configService.get<string>('CHATTERBOX_VOICE', '');
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

  async generateSpeech(
    script: string,
    lessonId: string,
    segmentId: string,
  ): Promise<string> {
    this.logger.log(`Generating speech for segment: ${segmentId}`);

    const body: Record<string, unknown> = {
      input: script,
      exaggeration: this.exaggeration,
      cfg_weight: this.cfgWeight,
      temperature: this.temperature,
    };

    if (this.voice) {
      body.voice = this.voice;
    }

    let response: Response;
    try {
      response = await fetch(`${this.apiUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Chatterbox network error: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      const errorBody = await response
        .text()
        .catch(() => 'Unable to read response body');
      throw new InternalServerErrorException(
        `Chatterbox returned ${response.status}: ${errorBody}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const r2Key = `audio/${lessonId}/${segmentId}.wav`;
    const publicUrl = await this.r2.upload(r2Key, audioBuffer, 'audio/wav');

    this.logger.log(`Audio uploaded for segment ${segmentId}: ${r2Key}`);
    return publicUrl;
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
      const audioUrl = await this.generateSpeech(script, lessonId, segment.id);

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
