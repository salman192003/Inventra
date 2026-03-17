import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import productsRoutes from './routes/products.routes';
import categoriesRoutes from './routes/categories.routes';
import suppliersRoutes from './routes/suppliers.routes';
import inventoryRoutes from './routes/inventory.routes';
import saleRoutes from './routes/sale.routes';
import customersRoutes from './routes/customers.routes';
import expensesRoutes from './routes/expenses.routes';
import cashflowRoutes from './routes/cashflow.routes';
import forecastsRoutes from './routes/forecasts.routes';
import settingsRoutes from './routes/settings.routes';
import branchesRoutes from './routes/branches.routes';
import aiRoutes from './routes/ai.routes';

const app = express();
const API = '/api/v1';

// ─── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/products`, productsRoutes);
app.use(`${API}/categories`, categoriesRoutes);
app.use(`${API}/suppliers`, suppliersRoutes);
app.use(`${API}/inventory`, inventoryRoutes);
app.use(`${API}/sales`, saleRoutes);
app.use(`${API}/customers`, customersRoutes);
app.use(`${API}/expenses`, expensesRoutes);
app.use(`${API}/cashflow`, cashflowRoutes);
app.use(`${API}/forecasts`, forecastsRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use(`${API}/branches`, branchesRoutes);
app.use(`${API}/ai`, aiRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// app.listen(env.PORT, () => { console.log(`Backend running on ${env.PORT}`); }); 
// ^-- REMOVE or CONDITIONALize this in index.ts, not app.ts
// Ensure index.ts exports the app or serverless handler.
export default app;
