import { cn } from '@/lib/utils';
import { CardDescription, CardTitle } from '@/components/ui/card';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  icon,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        {icon && <div className="icon-badge">{icon}</div>}
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-0.5">{description}</CardDescription>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
