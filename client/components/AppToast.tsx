import { Icon } from '@iconify/react';

interface AppToastProps {
  visible: boolean;
  icon: string;
  message: string;
  /** 'top' = fixed top-20, slides down; 'bottom' = absolute bottom-24, slides up */
  position?: 'top' | 'bottom';
}

export default function AppToast({ visible, icon, message, position = 'bottom' }: AppToastProps) {
  const isTop = position === 'top';

  return (
    <div
      className={`${isTop ? 'fixed top-20' : 'absolute bottom-24'} left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
        visible
          ? 'opacity-100 translate-y-0'
          : `opacity-0 ${isTop ? '-translate-y-2' : 'translate-y-2'}`
      }`}
    >
      <div className="bg-foreground/90 backdrop-blur-md text-background text-sm font-bold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap">
        <Icon icon={icon} className="size-4 shrink-0" />
        {message}
      </div>
    </div>
  );
}
