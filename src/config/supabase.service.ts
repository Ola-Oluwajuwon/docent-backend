import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from './supabase.config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  onModuleInit() {
    this.client = createSupabaseAdmin();
    this.logger.log('Supabase admin client initialized');
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
