import {
  IsUUID,
  IsInt,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class SyncProgressDto {
  @IsUUID()
  lessonId!: string;

  @IsInt()
  @Min(0)
  currentSegment!: number;

  @IsBoolean()
  completed!: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  comprehensionScore?: number;
}
