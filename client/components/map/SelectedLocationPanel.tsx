import { Icon } from '@iconify/react';
import { fmtCoord } from '../../lib/utils';
import type { MapLocation } from '../../features/map/types';

interface SelectedLocationPanelProps {
  location: MapLocation;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SelectedLocationPanel({
  location,
  onClose,
  onConfirm,
}: SelectedLocationPanelProps) {
  return (
    <div className="absolute bottom-6 left-3 right-3 z-30 bg-card/95 backdrop-blur-2xl border border-border rounded-2xl shadow-[var(--nav-shadow)] p-5 sm:left-6 sm:right-6 sm:bottom-8 md:max-w-lg md:mx-auto">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        type="button"
      >
        <Icon icon="solar:close-circle-bold" className="size-6" />
      </button>

      <h3 className="font-heading font-extrabold text-lg pr-8 truncate">{location.title}</h3>

      <div className="mt-2 space-y-1 text-sm text-secondary-foreground">
        <p className="font-mono text-xs text-muted-foreground">
          {fmtCoord(location.lat)}N, {fmtCoord(location.lng)}E
        </p>
        {location.address && <p className="line-clamp-2">{location.address}</p>}
      </div>

      <button
        onClick={onConfirm}
        className="mt-4 w-full bg-primary text-primary-foreground font-heading font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        type="button"
      >
        <Icon icon="solar:camera-add-bold" className="size-5" />
        记录此地
      </button>
    </div>
  );
}