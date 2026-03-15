import { cn } from '@/lib/cn';

interface BadgeProps {
  readonly children: React.ReactNode;
  readonly variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  readonly className?: string;
}

export default function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'success' && 'bg-emerald-50 text-emerald-700',
        variant === 'warning' && 'bg-amber-50 text-amber-700',
        variant === 'danger'  && 'bg-red-50 text-red-600',
        variant === 'info'    && 'bg-indigo-50 text-indigo-600',
        variant === 'neutral' && 'bg-slate-100 text-slate-600',
        className
      )}
    >
      {children}
    </span>
  );
}
