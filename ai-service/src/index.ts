import 'dotenv/config';
import express from 'express';
import { forecastRouter } from './routes/forecast';
import { ragRouter } from './routes/rag';
import { apiKeyAuth } from './middleware/apiKeyAuth';

const app = express();
app.use(express.json());
app.use(apiKeyAuth);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'inventra-ai', timestamp: new Date().toISOString() });
});

app.use('/forecast', forecastRouter);
app.use('/rag', ragRouter);

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`🤖 Inventra AI service running on http://localhost:${PORT}`);
});
