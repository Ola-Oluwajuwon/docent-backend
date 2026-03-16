import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private initialized = false;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL', '');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY', '');

    if (!url || !key || url.includes('your-project')) {
      this.logger.warn(
        'Supabase credentials not configured — database calls will fail until valid values are provided in .env',
      );
      this.client = createClient('https://placeholder.supabase.co', 'placeholder', {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      return;
    }

    this.client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.initialized = true;
    this.logger.log('Supabase admin client initialized');
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
