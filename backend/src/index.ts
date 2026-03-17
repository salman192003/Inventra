import 'dotenv/config';
import app from './app';
import { env } from './config/env';

// For Vercel Serverless
export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`\n🚀 Inventra API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${env.NODE_ENV}`);
    console.log(`   Database    : ${env.DATABASE_URL.split('@')[1] ?? 'connected'}\n`);
  });
}
