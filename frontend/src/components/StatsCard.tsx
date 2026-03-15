import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly trendDirection?: 'up' | 'down' | 'neutral';
  readonly icon?: React.ReactNode;
  readonly description?: string;
}

export default function StatsCard({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  icon,
  description,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
          {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
          {trendDirection === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
          <span
            className={cn(
              'text-xs font-medium',
              trendDirection === 'up' && 'text-emerald-600',
              trendDirection === 'down' && 'text-red-500',
              trendDirection === 'neutral' && 'text-slate-400'
            )}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
