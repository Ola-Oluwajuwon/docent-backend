import { IsUUID } from 'class-validator';

export class GenerateLessonDto {
  @IsUUID()
  materialId!: string;
}
