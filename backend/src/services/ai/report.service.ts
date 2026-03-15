import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { aggregatorService } from './aggregator.service';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

interface ReportSection {
  title: string;
  content: string;
}

export const reportService = {
  /**
   * Generate a comprehensive business report with Gemini-written insights
   * Returns structured JSON that the frontend will use to build the PDF client-side
   */
  async generateReportData(businessId: string) {
    // 1. Gather all data
    const comprehensiveData = await aggregatorService.getComprehensiveAnalysisData(businessId);

    // 2. Fetch the latest inventory analysis from Python microservice
    const FORECAST_API_URL = process.env.FORECAST_API_URL || 'http://localhost:8000';
    
    let inventoryAnalysis: any = null;
    let expenseAnalysis: any = null;
    
    try {
      const invPayload = await aggregatorService.getInventoryAnalysisPayload(businessId);
      const invResponse = await fetch(`${FORECAST_API_URL}/analyze/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invPayload)
      });
      if (invResponse.ok) {
        inventoryAnalysis = await invResponse.json();
      }
    } catch (e) {
      console.error('Could not fetch inventory analysis for report:', e);
    }

    try {
      const expPayload = await aggregatorService.getExpenseAnalysisPayload(businessId);
      const expResponse = await fetch(`${FORECAST_API_URL}/analyze/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expPayload)
      });
      if (expResponse.ok) {
        expenseAnalysis = await expResponse.json();
      }
    } catch (e) {
      console.error('Could not fetch expense analysis for report:', e);
    }

    // 3. Build context for Gemini
    const context = JSON.stringify({
      metrics: comprehensiveData.metrics,
      topRecommendations: comprehensiveData.recommendations.slice(0, 10),
      topForecasts: comprehensiveData.forecasts.slice(0, 10),
      inventorySummary: inventoryAnalysis?.summary ?? null,
      inventoryIssues: inventoryAnalysis?.products?.filter((p: any) => p.stock_status !== 'Optimal').slice(0, 15) ?? [],
      expenseSummary: expenseAnalysis?.category_summaries ?? [],
      expenseAnomalies: expenseAnalysis?.anomalies ?? [],
      overallMarginPct: expenseAnalysis?.overall_margin_pct ?? null
    }, null, 2);

    // 4. Ask Gemini to write a professional report
    const { text: reportText } = await generateText({
      model: google('gemini-1.5-pro-latest'),
      prompt: `You are a Senior Business Analyst writing a monthly executive report for "${comprehensiveData.businessName}".

Using ONLY the data provided below, write a comprehensive business report with these sections. Be specific with numbers and percentages. Do NOT invent data — use only what is provided.

Data Context:
${context}

Write the report as JSON with this structure (escape any special characters):
{
  "executiveSummary": "2-3 paragraph overview of business health, key wins, and concerns",
  "revenueAnalysis": "Analysis of revenue trends, month-over-month changes, and projections",
  "inventoryHealth": "Analysis of inventory status including ABC classification insights, overstocked/understocked items, and capital efficiency",
  "expenseAnalysis": "Analysis of expense patterns, anomalies detected, and margin tracking",
  "recommendations": "Top 5-8 actionable recommendations prioritized by impact, with specific numbers",
  "outlook": "Forward-looking assessment for the next 30 days based on forecasts and trends"
}

Return ONLY valid JSON, no markdown fences.`
    });

    // 5. Parse the Gemini response
    let sections: Record<string, string>;
    try {
      // Clean the response — remove potential markdown code fences
      const cleaned = reportText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sections = JSON.parse(cleaned);
    } catch {
      sections = {
        executiveSummary: reportText,
        revenueAnalysis: 'Unable to generate structured analysis.',
        inventoryHealth: 'Unable to generate structured analysis.',
        expenseAnalysis: 'Unable to generate structured analysis.',
        recommendations: 'Unable to generate structured analysis.',
        outlook: 'Unable to generate structured analysis.'
      };
    }

    return {
      businessName: comprehensiveData.businessName,
      currency: comprehensiveData.currency,
      reportDate: comprehensiveData.reportDate,
      metrics: comprehensiveData.metrics,
      sections,
      inventoryAnalysis: inventoryAnalysis ? {
        summary: inventoryAnalysis.summary,
        criticalItems: inventoryAnalysis.products?.filter((p: any) => p.stock_status === 'Critical' || p.stock_status === 'Dead Stock') ?? []
      } : null,
      expenseAnalysis: expenseAnalysis ? {
        categorySummaries: expenseAnalysis.category_summaries,
        anomalies: expenseAnalysis.anomalies,
        overallMarginPct: expenseAnalysis.overall_margin_pct
      } : null,
      forecasts: comprehensiveData.forecasts
    };
  }
};
