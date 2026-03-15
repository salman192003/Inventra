'use client';

import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import ChartCard from '@/components/ChartCard';
import { useForecasts } from '@/hooks/useForecasts';
import { useTriggerInsights, useTriggerForecasts, useRecommendations, useInventoryAnalysis, useExpenseAnalysis } from '@/hooks/useAiInsights';
import { cn } from '@/lib/cn';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { 
  Sparkles, Wand2, Download, 
  BrainCircuit, Brain, Zap, Info,
  ChevronRight, TrendingUp, AlertCircle
} from 'lucide-react';

export default function InsightsPage() {
  const printRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: forecasts = [], isLoading: forecastsLoading } = useForecasts();
  const { data: recommendations = [], isLoading: recommendationsLoading } = useRecommendations();
  const { data: inventoryAnalysis } = useInventoryAnalysis();
  const { data: expenseAnalysis, isLoading: expenseAnalysisLoading } = useExpenseAnalysis();

  // Mutations
  const { mutate: generateInsights, isPending: isGeneratingInsights } = useTriggerInsights();
  const { mutate: generateForecasts, isPending: isGeneratingForecasts } = useTriggerForecasts();

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    
    const element = printRef.current;
    const originalStyle = element.getAttribute('style') || '';
    
    // Preparation for PDF
    element.style.padding = '40px';
    element.style.background = '#ffffff';
    element.style.color = '#000000';
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Inventra-AI-Intelligence-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      element.setAttribute('style', originalStyle);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <Navbar 
        title="AI Intelligence Hub" 
        subtitle="Live neural predictions and strategic business maneuvers" 
      />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Header Action Area */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Brain className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Strategic Neural Intelligence</h2>
          </div>
          
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export Diagnostics
          </button>
        </div>

        <motion.div 
          ref={printRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* AI Control Center */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-html2canvas-ignore="false">
            <div className="lg:col-span-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 transition-transform group-hover:scale-[1.7] duration-700">
                  <BrainCircuit className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 shadow-inner ring-1 ring-white/30">
                    <Sparkles className="w-10 h-10 text-amber-300 animate-pulse" />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight text-white">AI Strategy Diagnostic</h2>
                    <p className="text-indigo-200 mt-4 max-w-xl text-lg font-medium leading-relaxed">
                      Analyze demand landscapes and classification modeling.
                      Our engine continuously recalibrates your business strategy.
                    </p>
                  </div>
                </div>
                <div className="mt-10 flex flex-wrap gap-4 relative z-10" data-html2canvas-ignore="true">
                  <button 
                    onClick={() => generateForecasts()}
                    disabled={isGeneratingForecasts}
                    className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-50 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingForecasts ? <Wand2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Recalibrate Models
                  </button>
                  <button 
                    onClick={() => generateInsights()}
                    disabled={isGeneratingInsights}
                    className="bg-indigo-500/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Brain className="w-4 h-4" />
                    {isGeneratingInsights ? "Processing..." : "Synthesize Insights"}
                  </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-center gap-6 border-l-8 border-l-indigo-600">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  Neural Infrastructure
                </div>
                <div className="space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase">Prophet Engine</span>
                      <span className="text-[10px] text-slate-400 font-bold">Predictive Flux</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.5)]" />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase">Gemini Synthesis</span>
                      <span className="text-[10px] text-slate-400 font-bold">Logic Layer v4.1</span>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* AI Visualizations Area */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCard 
                title="Portfolio Classification Model" 
                subtitle="Value-at-risk analysis"
                icon={<Brain className="w-5 h-5 text-indigo-600" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                  <div className="h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={[
                             { name: 'Class A', value: inventoryAnalysis?.summary?.a_count || 1, color: '#4f46e5' },
                             { name: 'Class B', value: inventoryAnalysis?.summary?.b_count || 1, color: '#8b5cf6' },
                             { name: 'Class C', value: inventoryAnalysis?.summary?.c_count || 1, color: '#e2e8f0' },
                           ]}
                           innerRadius={65} outerRadius={95} paddingAngle={8} dataKey="value"
                         >
                           <Cell fill="#4f46e5" stroke="none" />
                           <Cell fill="#8b5cf6" stroke="none" />
                           <Cell fill="#f1f5f9" stroke="none" />
                         </Pie>
                         <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                         />
                         <Legend verticalAlign="bottom" height={36}/>
                       </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                     <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 shadow-sm">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" /> Class A Insight
                        </p>
                        <p className="text-xs text-indigo-900 mt-2 font-bold leading-relaxed">
                          Top 20% of catalog detected. Neural engine suggests prioritizing 10-day safety stock levels.
                        </p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          "Model calibration indicates potential liquidity recovery in Class C liquidations."
                        </p>
                     </div>
                  </div>
                </div>
              </ChartCard>

              <ChartCard 
                title="Forecasted Margin Stability" 
                subtitle="Neural probability interval"
                icon={<Zap className="w-5 h-5 text-amber-500" />}
              >
                {expenseAnalysisLoading ? (
                  <div className="animate-pulse flex flex-col gap-4 h-[280px]">
                    <div className="h-full bg-slate-50 rounded-[2rem]" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={expenseAnalysis?.profit_margins?.map((m: any) => ({ ...m, date: new Date(m.ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }))}>
                      <defs>
                        <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                        axisLine={false} 
                        tickLine={false} 
                        unit="%"
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value}%`, 'Neural Flux Margin']}
                      />
                      <Area 
                        type="step" 
                        dataKey="margin_pct" 
                        stroke="#f59e0b" 
                        strokeWidth={4} 
                        fill="url(#marginGrad)"
                        dot={{ r: 6, fill: '#f59e0b', strokeWidth: 3, stroke: '#fff' }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
          </div>

          {/* Smart Recommendations Grid */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center text-white ring-8 ring-indigo-50">
                      <BrainCircuit className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Neural Strategic Maneuvers</h3>
                      <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-[0.4em]">High-Impact Logic Gates</p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-slate-100">
                  {recommendationsLoading && Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-10 animate-pulse space-y-6">
                       <div className="h-8 w-3/4 bg-slate-100 rounded-xl" />
                       <div className="h-24 w-full bg-slate-50 rounded-2xl" />
                    </div>
                  ))}
                  {!recommendationsLoading && recommendations.length === 0 && (
                    <div className="p-32 text-center col-span-full opacity-40 grayscale flex flex-col items-center">
                      <Brain className="w-16 h-16 mb-6 text-indigo-300" />
                      <p className="text-slate-900 font-black text-lg">WAITING FOR DATA TELEMETRY</p>
                      <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest">Run analysis to generate neural recommendations</p>
                    </div>
                  )}
                  {recommendations.slice(0, 6).map((rec: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ backgroundColor: 'rgba(244, 244, 245, 0.4)' }}
                      className="p-10 flex flex-col gap-5 relative overflow-hidden group"
                    >
                       <div className="flex items-start justify-between gap-4">
                          <h4 className="text-lg font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{rec.title}</h4>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0",
                            rec.priority === 'high' ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
                          )}>
                            {rec.priority}
                          </div>
                       </div>
                       <p className="text-sm text-slate-600 font-bold leading-relaxed opacity-80">
                         {rec.body}
                       </p>
                       <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detected At</span>
                            <span className="text-xs font-black text-slate-700">{new Date(rec.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 group-hover:gap-4 transition-all uppercase tracking-widest cursor-pointer group-hover:bg-indigo-50 px-3 py-1 rounded-lg">
                            EXECUTE <ChevronRight className="w-4 h-4" />
                          </div>
                       </div>
                    </motion.div>
                  ))}
              </div>
          </div>

          {/* Demand Forecast Landscape */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-emerald-600 shadow-inner">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase italic">
                        Demand Flux Engine
                      </h3>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-1">Neural Volume Projection v2.0</p>
                    </div>
                  </div>
               </div>

               {forecastsLoading ? (
                 <div className="space-y-6">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
                 </div>
               ) : forecasts.length === 0 ? (
                 <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                    <AlertCircle className="w-14 h-14 text-slate-200 mx-auto mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Temporal Data Insufficiency</p>
                    <p className="text-[10px] text-slate-300 mt-2 font-black uppercase tracking-widest tracking-widest">Prophet engine requires 30+ completed nodes</p>
                 </div>
               ) : (
                <div className="overflow-x-auto relative z-10">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] border-b-2 border-slate-50">
                       <th className="pb-8 pr-10">Product ID</th>
                       <th className="pb-8 px-10 text-center">Neural Vol Projection</th>
                       <th className="pb-8 px-10">Diagnostic Reliability</th>
                       <th className="pb-8 pl-10 text-right">Target Window</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {forecasts.map((row: any, i) => (
                       <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                         <td className="py-10 pr-10">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 font-black group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-2xl transition-all duration-300 text-lg">
                                {String(row.product?.name?.[0] || 'P').toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-base leading-none">{row.product?.name || 'Unknown SKU'}</span>
                                <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">ID: {row.id.slice(0, 8)}</span>
                              </div>
                            </div>
                         </td>
                         <td className="py-10 px-10 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-3xl font-black text-slate-900 leading-none italic">{Number(row.predictedDemand).toFixed(1)}</span>
                              <span className="text-[10px] text-indigo-600 font-black mt-2 uppercase tracking-[0.2em]">Expected Flux</span>
                            </div>
                         </td>
                         <td className="py-10 px-10">
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 ring-4 ring-slate-50">
                                <div 
                                  className={cn(
                                      "h-full rounded-full transition-all duration-1000 shadow-sm",
                                      row.confidenceScore > 0.8 ? "bg-emerald-500" : row.confidenceScore > 0.5 ? "bg-amber-500" : "bg-rose-500"
                                  )}
                                  style={{ width: `${Math.round(row.confidenceScore * 100)}%` }} 
                                />
                              </div>
                              <span className="text-xs font-black text-slate-900 w-10">{Math.round(row.confidenceScore * 100)}%</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 mt-3 block tracking-[0.2em] uppercase">Diagnostic Confidence Cluster</span>
                         </td>
                         <td className="py-10 pl-10 text-right">
                           <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-mono text-xs font-black shadow-xl uppercase tracking-tighter">
                             T: {new Date(row.forecastPeriodEnd).toLocaleDateString()}
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                </div>
               )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
