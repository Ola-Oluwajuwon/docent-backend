import { Queue } from 'bullmq';
import { SupabaseService } from '../../config/supabase.service';
import { R2Service } from '../../config/r2.service';
export declare class FilesService {
    private readonly supabase;
    private readonly r2;
    private readonly fileParsingQueue;
    private readonly logger;
    constructor(supabase: SupabaseService, r2: R2Service, fileParsingQueue: Queue);
    uploadFile(file: Express.Multer.File, clerkId: string, userId: string): Promise<{
        materialId: string;
        fileName: string;
    }>;
    getMaterialStatus(materialId: string, userId: string): Promise<{
        materialId: string;
        status: string;
        lessonId?: string;
    }>;
}
