import { IsUUID } from 'class-validator';

export class GenerateAudioDto {
  @IsUUID()
  lessonId!: string;
}
