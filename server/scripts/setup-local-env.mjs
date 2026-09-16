import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const defaultLocalUrl = 'http://127.0.0.1:54321';
const defaultLocalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI4MDB9.CRXP_d_p_s_local_key';
const defaultLocalServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjgwMH0.EG-local_service_role_key';

function updateOrAdd(key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    const match = content.match(regex)[0];
    if (match.trim() === `${key}=` || match.includes('your-project') || match.includes('your-anon-key')) {
      content = content.replace(regex, `${key}=${value}`);
    }
  } else {
    content += `\n${key}=${value}`;
  }
}

updateOrAdd('NEXT_PUBLIC_SUPABASE_URL', defaultLocalUrl);
updateOrAdd('NEXT_PUBLIC_SUPABASE_ANON_KEY', defaultLocalAnonKey);
updateOrAdd('SUPABASE_SERVICE_ROLE_KEY', defaultLocalServiceKey);

fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
console.log('✅ [ToiNayLoGi] Đã đồng bộ cấu hình Supabase Local vào .env.local');
