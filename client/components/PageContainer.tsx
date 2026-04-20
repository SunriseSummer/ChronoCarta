import type { ReactNode } from 'react';

export default function PageContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 sm:px-6 md:max-w-2xl md:mx-auto md:w-full ${className}`.trim()}>
      {children}
    </div>
  );
}