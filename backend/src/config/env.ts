import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres.bapjpnvndyfvsbhfrpyy:LZ%23%3FFka%2BC_Yr8%2Aj@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'),
  DIRECT_URL: z.string().default('postgresql://postgres.bapjpnvndyfvsbhfrpyy:LZ%23%3FFka%2BC_Yr8%2Aj@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  JWT_SECRET: z.string().min(1).default('temp-secret-key-12345'), // Provide default if missing
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  AI_SERVICE_URL: z.string().default(''),
  AI_SERVICE_API_KEY: z.string().default(''),
  STORAGE_BUCKET: z.string().default('inventra-documents'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
