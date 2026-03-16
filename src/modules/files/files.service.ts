import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Optional,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '../../config/supabase.service';
import { R2Service } from '../../config/r2.service';
import { Material } from './interfaces/material.interface';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'text/plain': 'txt',
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly r2: R2Service,
    @Optional()
    @Inject('BullQueue_file-parsing')
    private readonly fileParsingQueue?: Queue,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    clerkId: string,
    userId: string,
  ): Promise<{ materialId: string; fileName: string }> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: pdf, docx, txt`,
      );
    }

    const ext = MIME_TO_EXT[file.mimetype];
    const fileId = uuidv4();
    const storagePath = `uploads/${clerkId}/${fileId}.${ext}`;

    await this.r2.upload(storagePath, file.buffer, file.mimetype);

    const client = this.supabase.getClient();
    const { data: material, error } = await client
      .from('materials')
      .insert({
        user_id: userId,
        file_name: file.originalname,
        file_type: ext,
        storage_path: storagePath,
        status: 'uploading',
      })
      .select()
      .single();

    if (error || !material) {
      this.logger.error(`Failed to insert material: ${error?.message}`);
      throw new Error(`Failed to insert material: ${error?.message}`);
    }

    const mat = material as Material;

    await client
      .from('materials')
      .update({ status: 'processing' })
      .eq('id', mat.id);

    if (this.fileParsingQueue) {
      await this.fileParsingQueue.add('parse', {
        materialId: mat.id,
        storagePath,
        fileType: ext,
        clerkId,
      });
      this.logger.log(`File queued for parsing: ${mat.id}`);
    } else {
      this.logger.warn(
        `Redis not available — file ${mat.id} uploaded but parsing is deferred`,
      );
    }

    return { materialId: mat.id, fileName: file.originalname };
  }

  async getMaterialStatus(
    materialId: string,
    userId: string,
  ): Promise<{ materialId: string; status: string; lessonId?: string }> {
    const client = this.supabase.getClient();

    const { data: material, error } = await client
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', userId)
      .single();

    if (error || !material) {
      throw new NotFoundException('Material not found');
    }

    const mat = material as Material;
    const result: { materialId: string; status: string; lessonId?: string } = {
      materialId: mat.id,
      status: mat.status,
    };

    if (mat.status === 'ready') {
      const { data: lesson } = await client
        .from('lessons')
        .select('id')
        .eq('material_id', materialId)
        .single();

      if (lesson) {
        result.lessonId = (lesson as { id: string }).id;
      }
    }

    return result;
  }
}
