import { SupabaseService } from '../../config/supabase.service';
import { User } from './user.interface';
export declare class UsersService {
    private readonly supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    findOrCreate(clerkId: string, email: string, name: string): Promise<User>;
    findByClerkId(clerkId: string): Promise<User | null>;
}
