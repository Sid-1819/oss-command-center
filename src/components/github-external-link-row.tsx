'use client';

import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GitHubExternalLinkRowProps {
  href: string;
  className?: string;
  variant?: 'default' | 'outline';
  children: ReactNode;
}

export function GitHubExternalLinkRow({
  href,
  className,
  variant = 'default',
  children,
}: GitHubExternalLinkRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block',
        variant === 'outline' ? 'dashboard-list-item' : 'list-item-interactive',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {children}
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowRight className="size-4 text-muted-foreground" />
        </span>
      </div>
    </a>
  );
}
