import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type ContainerWidth = 'page' | 'wide' | 'reading';

/**
 * The only place horizontal page padding is set. Nothing else may add its own
 * gutter — that is how a site ends up with three different edge alignments.
 */
export function Container({
  children,
  width = 'page',
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  width?: ContainerWidth;
  className?: string;
  as?: 'div' | 'header' | 'footer' | 'section' | 'nav';
}) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-gutter',
        width === 'page' && 'max-w-page',
        width === 'wide' && 'max-w-wide',
        width === 'reading' && 'max-w-reading',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
