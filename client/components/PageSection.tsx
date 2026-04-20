import type { ReactNode } from 'react';

interface PageSectionProps {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}

export default function PageSection({
  action,
  children,
  className = '',
  description,
  title,
}: PageSectionProps) {
  return (
    <section className={className}>
      {(title || description || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            {title && <h3 className="font-heading font-extrabold text-xl">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}