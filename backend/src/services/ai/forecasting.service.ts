import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

const FORECAST_API_URL = process.env.FORECAST_API_URL || 'http://localhost:8000';

interface PythonForecastRecord {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

interface PythonForecastResponse {
  product_id: string;
  forecast: PythonForecastRecord[];
}

export const forecastingService = {
  /**
   * Generates demand forecasts for all active products in a business
   * by bridging to the Python FastAPI Prophet microservice.
   */
  async generateForecastsForBusiness(businessId: string): Promise<number> {
    console.log(`Starting forecast generation for business: ${businessId}`);
    
    // 1. Get all active products
    const products = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: { id: true, name: true }
    });

    let successCount = 0;

    for (const product of products) {
      try {
        // 2. Query Historical Sales Data for the last 365 days using Raw Query
        // We need daily sums of quantities sold
        const historicalData: any[] = await prisma.$queryRaw`
          SELECT 
            TO_CHAR(s.sale_date, 'YYYY-MM-DD') as ds, 
            SUM(si.quantity) as y
          FROM sale_items si
          JOIN sales s ON s.id = si.sale_id
          WHERE si.product_id = ${product.id}::uuid
            AND s.business_id = ${businessId}::uuid
            AND s.status = 'completed'
            AND s.sale_date >= CURRENT_DATE - INTERVAL '365 days'
          GROUP BY TO_CHAR(s.sale_date, 'YYYY-MM-DD')
          ORDER BY ds ASC;
        `;

        if (!historicalData || historicalData.length < 14) {
          console.log(`[Skip] Product ${product.name} lacks sufficient historical data (${historicalData.length}/14 days).`);
          continue;
        }

        // 3. Send to Python Microservice
        const response = await fetch(`${FORECAST_API_URL}/predict/demand`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            historical_data: historicalData.map(d => ({
              ds: d.ds,
              y: Number(d.y)
            })),
            periods: 30 // 30 days forecast
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Python API responded with ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as PythonForecastResponse;
        
        // 4. Transform and Save the Future Forecast
        // Prophet returns an array for the next 30 days
        const lastDateInForecast = data.forecast[data.forecast.length - 1].ds;
        const firstDateInForecast = data.forecast[0].ds;

        // Calculate total demand over the period
        const totalPredictedDemand = data.forecast.reduce((sum, day) => sum + day.yhat, 0);
        
        // Average confidence score (rough proxy: percentage difference between lower and upper bounds)
        // Or simply store null if hard to quantify as a single float.
        const avgConfidence = 0.85; // Placeholder

        await prisma.forecast.create({
          data: {
            businessId,
            productId: product.id,
            forecastPeriodStart: new Date(firstDateInForecast),
            forecastPeriodEnd: new Date(lastDateInForecast),
            predictedDemand: totalPredictedDemand, // Total demand over 30 days
            confidenceScore: avgConfidence,
            modelVersion: 'prophet-v1',
            forecastData: JSON.parse(JSON.stringify(data.forecast)), // Store granular daily data for charting
            generatedAt: new Date()
          }
        });

        console.log(`[Success] Forecast generated for ${product.name}: ${Math.round(totalPredictedDemand)} units needed.`);
        successCount++;

      } catch (error) {
        console.error(`[Error] Failed to generate forecast for product ${product.id} (${product.name}):`, error);
      }
    }

    console.log(`Finished forecasting. Generated ${successCount}/${products.length} forecasts successfully.`);
    return successCount;
  },

  /**
   * Generates advanced business analysis metrics (Top items, Category trends, Global forecast)
   */
  async analyzeBusiness(businessId: string): Promise<any> {
    console.log(`Fetching business analysis for: ${businessId}`);
    
    // Retrieve historical sales with categories
    const salesData: any[] = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(s.sale_date, 'YYYY-MM-DD') as ds,
        si.product_id as "product_id",
        p.name as "product_name",
        c.name as "category",
        si.quantity as "quantity",
        si.total_price as "revenue"
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN products p ON p.id = si.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE s.business_id = ${businessId}::uuid
        AND s.status = 'completed'
        AND s.sale_date >= CURRENT_DATE - INTERVAL '365 days'
    `;

    if (!salesData || salesData.length === 0) {
      throw new Error('Not enough sales data for business analysis');
    }

    // Call Python microservice
    const payload = {
      business_id: businessId,
      sales_data: salesData.map(d => ({
        ds: d.ds,
        product_id: d.product_id,
        product_name: d.product_name,
        category: d.category,
        quantity: Number(d.quantity),
        revenue: Number(d.revenue)
      })),
      periods: 30
    };

    const response = await fetch(`${FORECAST_API_URL}/analyze/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  }
};

