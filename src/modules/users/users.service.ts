import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { User } from './user.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findOrCreate(
    clerkId: string,
    email: string,
    name: string,
  ): Promise<User> {
    const client = this.supabase.getClient();

    const { data: existing, error: findError } = await client
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (existing && !findError) {
      return existing as User;
    }

    const { data: created, error: createError } = await client
      .from('users')
      .upsert({ clerk_id: clerkId, email, name }, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (createError || !created) {
      this.logger.error(`Failed to upsert user: ${createError?.message}`);
      throw new Error(`Failed to upsert user: ${createError?.message}`);
    }

    this.logger.log(`User upserted: ${clerkId}`);
    return created as User;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  }
}
