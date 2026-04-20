import { Icon } from '@iconify/react';
import type { MapSearchCandidate } from '../../features/map/types';

interface MapSearchPanelProps {
  candidates: MapSearchCandidate[];
  hasMore: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onExpand: () => void;
  onLocate: () => void;
  onSelect: (candidate: MapSearchCandidate) => void;
  onShowDropdown: () => void;
  searchText: string;
  searching: boolean;
  showDropdown: boolean;
  visibleCandidates: MapSearchCandidate[];
}

export default function MapSearchPanel({
  candidates,
  hasMore,
  onChange,
  onClear,
  onExpand,
  onLocate,
  onSelect,
  onShowDropdown,
  searchText,
  searching,
  showDropdown,
  visibleCandidates,
}: MapSearchPanelProps) {
  return (
    <div className="absolute top-14 left-4 right-4 z-10 pointer-events-none sm:left-6 sm:right-6">
      <div className="flex gap-3">
        <div className="pointer-events-auto bg-card/80 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-3 border border-border shadow-lg flex-1">
          <Icon icon="solar:magnifer-linear" className="text-secondary-foreground size-5 shrink-0" />
          <input
            type="text"
            placeholder="搜索地点..."
            value={searchText}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onShowDropdown}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground font-medium tracking-wide outline-none w-full"
          />
          {searching && (
            <Icon icon="solar:refresh-bold" className="text-primary size-4 shrink-0 animate-spin" />
          )}
          {searchText && !searching && (
            <button onClick={onClear} className="cursor-pointer shrink-0" type="button">
              <Icon icon="solar:close-circle-bold" className="text-muted-foreground hover:text-foreground size-5 transition-colors" />
            </button>
          )}
        </div>

        <button
          onClick={onLocate}
          className="pointer-events-auto bg-card/80 backdrop-blur-xl rounded-2xl p-3 border border-border flex items-center justify-center shadow-lg cursor-pointer hover:bg-card transition-colors"
          type="button"
        >
          <Icon icon="solar:gps-bold" className="text-primary size-6" />
        </button>
      </div>

      {showDropdown && candidates.length > 0 && (
        <div className="pointer-events-auto mt-2 bg-card/95 backdrop-blur-2xl border border-border rounded-2xl shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
          {visibleCandidates.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => onSelect(item)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer text-left border-b border-border/50 last:border-b-0"
              type="button"
            >
              <div
                className={`shrink-0 mt-0.5 size-8 rounded-full flex items-center justify-center ${
                  item.type === 'place'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon
                  icon={item.type === 'place' ? 'solar:star-bold' : 'solar:map-point-bold'}
                  className="size-4"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{item.title}</span>
                  {item.type === 'place' && (
                    <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      已到访
                    </span>
                  )}
                </div>
                {item.address && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.address}</p>
                )}
              </div>
            </button>
          ))}

          {hasMore && (
            <button
              onClick={onExpand}
              className="w-full py-3 text-center text-xs font-bold text-primary hover:bg-muted/30 transition-colors cursor-pointer"
              type="button"
            >
              查看更多（共 {candidates.length} 个结果）
            </button>
          )}
        </div>
      )}

      {showDropdown && searchText.trim() && candidates.length === 0 && !searching && (
        <div className="pointer-events-auto mt-2 bg-card/95 backdrop-blur-2xl border border-border rounded-2xl shadow-xl px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">未找到匹配的地点</p>
        </div>
      )}
    </div>
  );
}