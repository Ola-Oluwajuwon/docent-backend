import { OnModuleInit } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService implements OnModuleInit {
    private client;
    private readonly logger;
    onModuleInit(): void;
    getClient(): SupabaseClient;
}
