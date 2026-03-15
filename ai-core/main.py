from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest
from typing import List, Optional, Dict
import uvicorn

app = FastAPI(title="Inventra Forecasting & Analytics Microservice")

# ─────────────────────────────────────────────────────────────────────────────
# SHARED MODELS
# ─────────────────────────────────────────────────────────────────────────────

class SalesRecord(BaseModel):
    ds: str
    y: float

class ForecastRequest(BaseModel):
    product_id: str
    historical_data: List[SalesRecord]
    periods: int = 30
    events: Optional[List[Dict]] = None  # [{"ds": "2025-11-24", "holiday": "Black Friday"}]

class ForecastRecord(BaseModel):
    ds: str
    yhat: float
    yhat_lower: float
    yhat_upper: float

class ForecastResponse(BaseModel):
    product_id: str
    forecast: List[ForecastRecord]

# ─────────────────────────────────────────────────────────────────────────────
# BUSINESS ANALYSIS MODELS
# ─────────────────────────────────────────────────────────────────────────────

class BusinessSalesRecord(BaseModel):
    ds: str
    product_id: str
    product_name: str
    category: str
    quantity: float
    revenue: float

class BusinessAnalysisRequest(BaseModel):
    business_id: str
    sales_data: List[BusinessSalesRecord]
    periods: int = 30

class TopProduct(BaseModel):
    product_id: str
    product_name: str
    total_quantity: float
    total_revenue: float

class CategoryTrend(BaseModel):
    category: str
    total_revenue: float
    growth_trend: float

class BusinessAnalysisResponse(BaseModel):
    business_id: str
    overall_revenue_forecast: List[ForecastRecord]
    top_products_by_revenue: List[TopProduct]
    top_products_by_quantity: List[TopProduct]
    revenue_by_category: List[CategoryTrend]
    stocking_recommendation_category: Optional[str]

# ─────────────────────────────────────────────────────────────────────────────
# INVENTORY ANALYSIS MODELS
# ─────────────────────────────────────────────────────────────────────────────

class InventoryItem(BaseModel):
    product_id: str
    product_name: str
    category: str
    current_stock: float
    cost_price: float
    selling_price: float
    reorder_point: int
    daily_sales_velocity: float  # Average units sold per day
    lead_time_days: int = 7

class InventoryAnalysisRequest(BaseModel):
    business_id: str
    items: List[InventoryItem]

class ProductClassification(BaseModel):
    product_id: str
    product_name: str
    category: str
    abc_class: str  # A, B, or C
    stock_status: str  # Overstocked, Optimal, Understocked, Critical, Dead Stock
    days_of_inventory: Optional[float]
    revenue_contribution_pct: float
    current_stock: float
    daily_velocity: float
    recommendation: str

class InventoryAnalysisResponse(BaseModel):
    business_id: str
    products: List[ProductClassification]
    summary: Dict  # { total_products, a_count, b_count, c_count, overstocked_count, ... }

# ─────────────────────────────────────────────────────────────────────────────
# EXPENSE ANALYSIS MODELS
# ─────────────────────────────────────────────────────────────────────────────

class ExpenseRecord(BaseModel):
    ds: str  # Date YYYY-MM-DD
    category: str
    amount: float

class ExpenseAnalysisRequest(BaseModel):
    business_id: str
    expenses: List[ExpenseRecord]
    revenue_data: Optional[List[SalesRecord]] = None  # Daily aggregate revenue

class ExpenseAnomaly(BaseModel):
    category: str
    date: str
    amount: float
    expected_amount: float
    deviation_pct: float
    severity: str  # high, medium, low

class CategoryExpenseSummary(BaseModel):
    category: str
    total_amount: float
    avg_monthly: float
    trend: float  # slope, positive = increasing
    pct_of_total: float

class ProfitMarginPoint(BaseModel):
    ds: str
    revenue: float
    expenses: float
    margin: float
    margin_pct: float

class ExpenseAnalysisResponse(BaseModel):
    business_id: str
    anomalies: List[ExpenseAnomaly]
    category_summaries: List[CategoryExpenseSummary]
    profit_margins: List[ProfitMarginPoint]
    total_expenses: float
    total_revenue: float
    overall_margin_pct: float

# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ── 1. Demand Forecasting (with optional events) ───────────────────────────

@app.post("/predict/demand", response_model=ForecastResponse)
def predict_demand(request: ForecastRequest):
    if len(request.historical_data) < 14:
        raise HTTPException(status_code=400, detail="Not enough historical data. Minimum 14 data points required.")

    try:
        df = pd.DataFrame([vars(record) for record in request.historical_data])
        df['ds'] = pd.to_datetime(df['ds'])

        kwargs = {
            'daily_seasonality': False,
            'yearly_seasonality': 'auto',
            'weekly_seasonality': 'auto'
        }

        # Inject events/holidays if provided
        if request.events and len(request.events) > 0:
            holidays_df = pd.DataFrame(request.events)
            if 'ds' in holidays_df.columns and 'holiday' in holidays_df.columns:
                holidays_df['ds'] = pd.to_datetime(holidays_df['ds'])
                holidays_df['lower_window'] = -1
                holidays_df['upper_window'] = 1
                kwargs['holidays'] = holidays_df

        m = Prophet(**kwargs)
        m.fit(df)

        future = m.make_future_dataframe(periods=request.periods)
        forecast = m.predict(future)
        future_forecast = forecast.tail(request.periods)

        results = []
        for _, row in future_forecast.iterrows():
            results.append(ForecastRecord(
                ds=row['ds'].strftime('%Y-%m-%d'),
                yhat=max(0.0, float(row['yhat'])),
                yhat_lower=max(0.0, float(row['yhat_lower'])),
                yhat_upper=max(0.0, float(row['yhat_upper']))
            ))

        return ForecastResponse(
            product_id=request.product_id,
            forecast=results
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

# ── 2. Business Analysis (Top Products, Category Trends, Revenue Forecast) ─

@app.post("/analyze/business", response_model=BusinessAnalysisResponse)
def analyze_business(request: BusinessAnalysisRequest):
    if len(request.sales_data) == 0:
        raise HTTPException(status_code=400, detail="No sales data provided.")

    try:
        df = pd.DataFrame([vars(r) for r in request.sales_data])
        df['ds'] = pd.to_datetime(df['ds'])

        # 1. Overall Revenue Forecast (using Prophet)
        daily_revenue = df.groupby('ds')['revenue'].sum().reset_index()
        daily_revenue.rename(columns={'revenue': 'y'}, inplace=True)

        overall_forecast_records = []
        if len(daily_revenue) >= 14:
            m = Prophet(daily_seasonality=False, yearly_seasonality='auto', weekly_seasonality='auto')
            m.fit(daily_revenue)
            future = m.make_future_dataframe(periods=request.periods)
            forecast = m.predict(future)
            future_forecast = forecast.tail(request.periods)
            for _, row in future_forecast.iterrows():
                overall_forecast_records.append(ForecastRecord(
                    ds=row['ds'].strftime('%Y-%m-%d'),
                    yhat=max(0.0, float(row['yhat'])),
                    yhat_lower=max(0.0, float(row['yhat_lower'])),
                    yhat_upper=max(0.0, float(row['yhat_upper']))
                ))

        # 2. Top Products
        product_stats = df.groupby(['product_id', 'product_name']).agg(
            total_quantity=('quantity', 'sum'),
            total_revenue=('revenue', 'sum')
        ).reset_index()

        top_by_rev = product_stats.sort_values(by='total_revenue', ascending=False).head(10)
        top_by_qty = product_stats.sort_values(by='total_quantity', ascending=False).head(10)

        top_products_by_revenue = [
            TopProduct(
                product_id=row['product_id'],
                product_name=row['product_name'],
                total_quantity=float(row['total_quantity']),
                total_revenue=float(row['total_revenue'])
            ) for _, row in top_by_rev.iterrows()
        ]

        top_products_by_quantity = [
            TopProduct(
                product_id=row['product_id'],
                product_name=row['product_name'],
                total_quantity=float(row['total_quantity']),
                total_revenue=float(row['total_revenue'])
            ) for _, row in top_by_qty.iterrows()
        ]

        # 3. Category Trends
        category_trends_list = []
        categories = df['category'].unique()
        best_growth = -float('inf')
        stocking_recommendation = None

        for cat in categories:
            cat_df = df[df['category'] == cat]
            cat_total_rev = cat_df['revenue'].sum()

            cat_daily = cat_df.groupby('ds')['revenue'].sum().reset_index()
            cat_daily = cat_daily.sort_values('ds')

            growth_trend = 0.0
            if len(cat_daily) > 2:
                X = (cat_daily['ds'] - cat_daily['ds'].min()).dt.days.values.reshape(-1, 1)
                y = cat_daily['revenue'].values
                reg = LinearRegression().fit(X, y)
                growth_trend = float(reg.coef_[0])

            category_trends_list.append(CategoryTrend(
                category=cat,
                total_revenue=float(cat_total_rev),
                growth_trend=growth_trend
            ))

            if growth_trend > best_growth:
                best_growth = growth_trend
                stocking_recommendation = cat

        category_trends_list.sort(key=lambda x: x.total_revenue, reverse=True)

        return BusinessAnalysisResponse(
            business_id=request.business_id,
            overall_revenue_forecast=overall_forecast_records,
            top_products_by_revenue=top_products_by_revenue,
            top_products_by_quantity=top_products_by_quantity,
            revenue_by_category=category_trends_list,
            stocking_recommendation_category=stocking_recommendation
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

# ── 3. Inventory Analysis (ABC + Stock Health) ────────────────────────────

@app.post("/analyze/inventory", response_model=InventoryAnalysisResponse)
def analyze_inventory(request: InventoryAnalysisRequest):
    if len(request.items) == 0:
        raise HTTPException(status_code=400, detail="No inventory items provided.")

    try:
        items = request.items

        # Calculate annual revenue contribution for each product
        revenue_contributions = []
        for item in items:
            annual_rev = item.daily_sales_velocity * item.selling_price * 365
            revenue_contributions.append({
                'item': item,
                'annual_revenue': annual_rev
            })

        total_annual_revenue = sum(r['annual_revenue'] for r in revenue_contributions)
        if total_annual_revenue == 0:
            total_annual_revenue = 1  # Avoid division by zero

        # Sort by annual revenue descending for ABC classification
        revenue_contributions.sort(key=lambda x: x['annual_revenue'], reverse=True)

        # ABC Classification: A = top 70% of revenue, B = next 20%, C = final 10%
        cumulative_pct = 0.0
        products_result = []

        summary = {
            'total_products': len(items),
            'a_count': 0, 'b_count': 0, 'c_count': 0,
            'overstocked_count': 0, 'optimal_count': 0,
            'understocked_count': 0, 'critical_count': 0, 'dead_stock_count': 0,
            'total_inventory_value': 0.0,
            'overstocked_value': 0.0
        }

        for entry in revenue_contributions:
            item = entry['item']
            rev_pct = (entry['annual_revenue'] / total_annual_revenue) * 100
            cumulative_pct += rev_pct

            # ABC class
            if cumulative_pct <= 70:
                abc_class = 'A'
                summary['a_count'] += 1
            elif cumulative_pct <= 90:
                abc_class = 'B'
                summary['b_count'] += 1
            else:
                abc_class = 'C'
                summary['c_count'] += 1

            # Stock status
            days_of_inventory = None
            if item.daily_sales_velocity > 0:
                days_of_inventory = item.current_stock / item.daily_sales_velocity

                if days_of_inventory < item.lead_time_days:
                    stock_status = 'Critical'
                    recommendation = f"URGENT: Only {days_of_inventory:.0f} days of stock remaining, but lead time is {item.lead_time_days} days. Order immediately to prevent stockout."
                    summary['critical_count'] += 1
                elif days_of_inventory < item.lead_time_days * 2:
                    stock_status = 'Understocked'
                    order_qty = int(item.daily_sales_velocity * 30 - item.current_stock)
                    recommendation = f"Stock will run low before next restock. Consider ordering ~{max(order_qty, 0)} units now."
                    summary['understocked_count'] += 1
                elif days_of_inventory > 90:
                    stock_status = 'Overstocked'
                    excess = int(item.current_stock - item.daily_sales_velocity * 60)
                    excess_value = excess * item.cost_price
                    recommendation = f"~{excess} excess units (${excess_value:,.0f} capital tied up). Consider running a promotion or reducing reorder quantity."
                    summary['overstocked_count'] += 1
                    summary['overstocked_value'] += excess_value
                else:
                    stock_status = 'Optimal'
                    recommendation = "Stock levels are healthy relative to demand."
                    summary['optimal_count'] += 1
            else:
                if item.current_stock > 0:
                    stock_status = 'Dead Stock'
                    dead_value = item.current_stock * item.cost_price
                    recommendation = f"No recent sales detected. {item.current_stock:.0f} units (${dead_value:,.0f}) sitting idle. Consider discontinuing or a clearance sale."
                    summary['dead_stock_count'] += 1
                else:
                    stock_status = 'Optimal'
                    recommendation = "No stock and no demand — no action needed."
                    summary['optimal_count'] += 1

            inv_value = item.current_stock * item.cost_price
            summary['total_inventory_value'] += inv_value

            products_result.append(ProductClassification(
                product_id=item.product_id,
                product_name=item.product_name,
                category=item.category,
                abc_class=abc_class,
                stock_status=stock_status,
                days_of_inventory=round(days_of_inventory, 1) if days_of_inventory is not None else None,
                revenue_contribution_pct=round(rev_pct, 2),
                current_stock=item.current_stock,
                daily_velocity=item.daily_sales_velocity,
                recommendation=recommendation
            ))

        return InventoryAnalysisResponse(
            business_id=request.business_id,
            products=products_result,
            summary=summary
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory analysis error: {str(e)}")

# ── 4. Expense Analysis (Anomaly Detection + Margin Tracking) ─────────────

@app.post("/analyze/expenses", response_model=ExpenseAnalysisResponse)
def analyze_expenses(request: ExpenseAnalysisRequest):
    if len(request.expenses) == 0:
        raise HTTPException(status_code=400, detail="No expense data provided.")

    try:
        df = pd.DataFrame([vars(r) for r in request.expenses])
        df['ds'] = pd.to_datetime(df['ds'])
        df['amount'] = df['amount'].astype(float)

        total_expenses = df['amount'].sum()

        # ── Per-category anomaly detection using Isolation Forest ──
        anomalies = []
        category_summaries = []
        categories = df['category'].unique()

        for cat in categories:
            cat_df = df[df['category'] == cat].copy()
            cat_total = cat_df['amount'].sum()
            cat_mean = cat_df['amount'].mean()
            cat_std = cat_df['amount'].std() if len(cat_df) > 1 else 0

            # Monthly breakdown
            cat_df['month'] = cat_df['ds'].dt.to_period('M')
            monthly_avg = cat_df.groupby('month')['amount'].sum().mean()

            # Trend via linear regression
            cat_daily = cat_df.groupby('ds')['amount'].sum().reset_index().sort_values('ds')
            growth_trend = 0.0
            if len(cat_daily) > 2:
                X = (cat_daily['ds'] - cat_daily['ds'].min()).dt.days.values.reshape(-1, 1)
                y_vals = cat_daily['amount'].values
                reg = LinearRegression().fit(X, y_vals)
                growth_trend = float(reg.coef_[0])

            category_summaries.append(CategoryExpenseSummary(
                category=cat,
                total_amount=float(cat_total),
                avg_monthly=float(monthly_avg) if not pd.isna(monthly_avg) else 0.0,
                trend=growth_trend,
                pct_of_total=float((cat_total / total_expenses) * 100) if total_expenses > 0 else 0.0
            ))

            # Anomaly detection: flag entries > 2 std deviations from the mean
            if cat_std > 0 and len(cat_df) >= 5:
                for _, row in cat_df.iterrows():
                    deviation = abs(row['amount'] - cat_mean)
                    if deviation > 2 * cat_std:
                        deviation_pct = (deviation / cat_mean) * 100
                        severity = 'high' if deviation_pct > 100 else ('medium' if deviation_pct > 50 else 'low')
                        anomalies.append(ExpenseAnomaly(
                            category=cat,
                            date=row['ds'].strftime('%Y-%m-%d'),
                            amount=float(row['amount']),
                            expected_amount=float(cat_mean),
                            deviation_pct=round(float(deviation_pct), 1),
                            severity=severity
                        ))

        # Sort category summaries by total amount
        category_summaries.sort(key=lambda x: x.total_amount, reverse=True)

        # ── Profit margin tracking (if revenue data provided) ──
        profit_margins = []
        total_revenue = 0.0
        overall_margin_pct = 0.0

        if request.revenue_data and len(request.revenue_data) > 0:
            rev_df = pd.DataFrame([vars(r) for r in request.revenue_data])
            rev_df['ds'] = pd.to_datetime(rev_df['ds'])
            rev_df.rename(columns={'y': 'revenue'}, inplace=True)

            # Daily expenses aggregate
            daily_exp = df.groupby('ds')['amount'].sum().reset_index()
            daily_exp.rename(columns={'amount': 'expenses'}, inplace=True)

            merged = pd.merge(rev_df, daily_exp, on='ds', how='outer').fillna(0).sort_values('ds')

            total_revenue = float(merged['revenue'].sum())
            total_exp_merged = float(merged['expenses'].sum())

            for _, row in merged.iterrows():
                rev = float(row['revenue'])
                exp = float(row['expenses'])
                margin = rev - exp
                margin_pct = (margin / rev * 100) if rev > 0 else 0.0
                profit_margins.append(ProfitMarginPoint(
                    ds=row['ds'].strftime('%Y-%m-%d'),
                    revenue=rev,
                    expenses=exp,
                    margin=margin,
                    margin_pct=round(margin_pct, 1)
                ))

            overall_margin_pct = ((total_revenue - total_exp_merged) / total_revenue * 100) if total_revenue > 0 else 0.0

        return ExpenseAnalysisResponse(
            business_id=request.business_id,
            anomalies=anomalies,
            category_summaries=category_summaries,
            profit_margins=profit_margins,
            total_expenses=float(total_expenses),
            total_revenue=float(total_revenue),
            overall_margin_pct=round(float(overall_margin_pct), 1)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Expense analysis error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
