import 'dotenv/config';
import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`\n🚀 Inventra API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Database    : ${env.DATABASE_URL.split('@')[1] ?? 'connected'}\n`);
});
