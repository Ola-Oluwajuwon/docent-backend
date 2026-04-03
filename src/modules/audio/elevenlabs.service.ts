import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { R2Service } from '../../config/r2.service';
import { LessonAIService } from '../lessons/lesson-ai.service';
import { LessonOutline } from '../lessons/interfaces/lesson-outline.interface';
import { AudioManifest } from './interfaces/audio-manifest.interface';

@Injectable()
export class ElevenLabsService {
  private readonly client: ElevenLabsClient;
  private readonly voiceId: string;
  private readonly logger = new Logger(ElevenLabsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly r2: R2Service,
    private readonly lessonAI: LessonAIService,
  ) {
    this.client = new ElevenLabsClient({
      apiKey: this.configService.getOrThrow<string>('ELEVENLABS_API_KEY'),
    });
    this.voiceId = this.configService.getOrThrow<string>('ELEVENLABS_VOICE_ID');
  }

  async generateSpeech(
    script: string,
    lessonId: string,
    segmentId: string,
  ): Promise<string> {
    this.logger.log(`Generating speech for segment: ${segmentId}`);

    const audioStream = await this.client.textToSpeech.convert(this.voiceId, {
      text: script,
      modelId: 'eleven_turbo_v2',
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.3,
        useSpeakerBoost: true,
      },
    });

    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const audioBuffer = Buffer.concat(chunks);

    const r2Key = `audio/${lessonId}/${segmentId}.mp3`;
    const publicUrl = await this.r2.upload(r2Key, audioBuffer, 'audio/mpeg');

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
