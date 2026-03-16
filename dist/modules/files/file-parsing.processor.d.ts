import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { R2Service } from '../../config/r2.service';
import { SupabaseService } from '../../config/supabase.service';
interface FileParsingJobData {
    materialId: string;
    storagePath: string;
    fileType: string;
    clerkId: string;
}
export declare class FileParsingProcessor extends WorkerHost {
    private readonly r2;
    private readonly supabase;
    private readonly logger;
    constructor(r2: R2Service, supabase: SupabaseService);
    process(job: Job<FileParsingJobData>): Promise<void>;
}
export {};
