import { cn } from '@/lib/utils';

interface DashboardSectionStateProps {
  isLoading?: boolean;
  isEmpty?: boolean;
}

export function DashboardEmptyState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-secondary/20 px-6 py-10 text-center',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Enter a repository above and click Analyze to get started.
      </p>
    </div>
  );
}

export type { DashboardSectionStateProps };
