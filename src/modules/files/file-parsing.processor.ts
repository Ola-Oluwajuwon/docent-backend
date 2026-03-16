import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { R2Service } from '../../config/r2.service';
import { SupabaseService } from '../../config/supabase.service';

interface FileParsingJobData {
  materialId: string;
  storagePath: string;
  fileType: string;
  clerkId: string;
}

@Processor('file-parsing')
export class FileParsingProcessor extends WorkerHost {
  private readonly logger = new Logger(FileParsingProcessor.name);

  constructor(
    private readonly r2: R2Service,
    private readonly supabase: SupabaseService,
  ) {
    super();
  }

  async process(job: Job<FileParsingJobData>): Promise<void> {
    const { materialId, storagePath, fileType } = job.data;
    this.logger.log(`Processing file: ${materialId} (${fileType})`);

    try {
      const buffer = await this.r2.download(storagePath);
      let text: string;

      switch (fileType) {
        case 'txt':
          text = buffer.toString('utf-8');
          break;
        case 'pdf': {
          const parser = new PDFParse({ data: new Uint8Array(buffer) });
          const result = await parser.getText();
          text = result.text;
          break;
        }
        case 'docx': {
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
          break;
        }
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      await this.r2.upload(
        `parsed/${materialId}.txt`,
        text,
        'text/plain',
      );

      await this.supabase
        .getClient()
        .from('materials')
        .update({ status: 'ready' })
        .eq('id', materialId);

      this.logger.log(`File parsed successfully: ${materialId}`);
    } catch (error) {
      this.logger.error(
        `File parsing failed for ${materialId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      await this.supabase
        .getClient()
        .from('materials')
        .update({ status: 'failed' })
        .eq('id', materialId);
    }
  }
}
