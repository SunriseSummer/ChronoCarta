import { Icon } from '@iconify/react';

interface HeaderActionButtonProps {
  icon: string;
  onClick: () => void;
  label?: string;
  title?: string;
  tone?: 'overlay' | 'ghost' | 'primary' | 'danger';
  disabled?: boolean;
}

const toneClasses: Record<NonNullable<HeaderActionButtonProps['tone']>, string> = {
  overlay: 'bg-overlay text-overlay-fg border-overlay-border backdrop-blur-md hover:bg-overlay/90',
  ghost: 'bg-transparent text-foreground/70 border-transparent hover:text-foreground',
  primary: 'bg-primary/92 text-primary-foreground border-primary/35 shadow-lg shadow-primary/20 backdrop-blur-md hover:bg-primary',
  danger: 'bg-overlay text-destructive border-overlay-border backdrop-blur-md hover:bg-overlay/90',
};

export default function HeaderActionButton({
  icon,
  onClick,
  label,
  title,
  tone = 'overlay',
  disabled = false,
}: HeaderActionButtonProps) {
  const iconOnly = !label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={[
        'border flex items-center justify-center transition-all duration-200',
        disabled
          ? 'cursor-not-allowed opacity-55'
          : 'cursor-pointer active:scale-95 hover:-translate-y-0.5',
        iconOnly ? 'h-10 w-10 rounded-xl' : 'h-10 rounded-xl px-3.5 gap-2',
        toneClasses[tone],
      ].join(' ')}
    >
      <Icon icon={icon} className={iconOnly ? 'size-5' : 'size-[18px]'} />
      {label && <span className="text-sm font-heading font-bold tracking-[0.08em]">{label}</span>}
    </button>
  );
}