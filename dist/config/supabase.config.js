"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseAdmin = createSupabaseAdmin;
const supabase_js_1 = require("@supabase/supabase-js");
function createSupabaseAdmin() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
    return (0, supabase_js_1.createClient)(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
//# sourceMappingURL=supabase.config.js.map