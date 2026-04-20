/**
 * 数据统计卡片（海拔 · 经纬度 · 时间）
 * 在浏览页、编辑页和新建页中复用
 */
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { fmtCoord } from '../lib/utils';

interface StatsCardProps {
  lat: number;
  lng: number;
  altitude?: number;
  createdAt?: number;
  /** 海拔输入模式（新建地点时可编辑） */
  altitudeEditable?: boolean;
  onAltitudeChange?: (v: number | undefined) => void;
  /** 时间可编辑模式（编辑页使用） */
  timeEditable?: boolean;
  onTimeChange?: (timestamp: number) => void;
}

export default function StatsCard({
  lat,
  lng,
  altitude,
  createdAt,
  altitudeEditable,
  onAltitudeChange,
  timeEditable,
  onTimeChange,
}: StatsCardProps) {
  const [fallbackCreatedAt] = useState(() => Date.now());
  const resolvedCreatedAt = createdAt ?? fallbackCreatedAt;
  const time = new Date(resolvedCreatedAt);
  const dateStr = time.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const [showPicker, setShowPicker] = useState(false);

  // 将时间戳转为 datetime-local 输入框需要的格式
  function toDatetimeLocal(ts: number) {
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* 海拔 */}
      <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-xl p-3 min-w-0">
        <Icon icon="tabler:mountain-filled" className="text-primary size-5" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">海拔</span>
        {altitudeEditable ? (
          <input
            type="number"
            placeholder="—"
            value={altitude ?? ''}
            onChange={(e) => onAltitudeChange?.(e.target.value ? Number(e.target.value) : undefined)}
            className="font-heading font-bold text-xs text-center leading-snug bg-transparent outline-none w-full min-w-0"
          />
        ) : (
          <span className="font-heading font-bold text-xs text-center leading-snug">
            {altitude ? `${altitude.toLocaleString()}m` : '—'}
          </span>
        )}
      </div>

      {/* 经纬度 */}
      <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-xl p-3 min-w-0">
        <Icon icon="solar:compass-bold" className="text-primary size-5" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">位置</span>
        <span className="font-heading font-bold text-xs text-center leading-snug">
          {lat ? `${fmtCoord(lat)}N` : '—'}<br />{lng ? `${fmtCoord(lng)}E` : '—'}
        </span>
      </div>

      {/* 时间 */}
      <div
        className={`flex flex-col items-center gap-1 bg-muted/50 rounded-xl p-3 min-w-0${
          timeEditable ? ' cursor-pointer hover:bg-muted/70 transition-colors' : ''
        }`}
        onClick={() => timeEditable && setShowPicker(true)}
      >
        <Icon icon="solar:clock-circle-bold" className="text-primary size-5" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">时间</span>
        <span className="font-heading font-bold text-xs text-center leading-snug">
          {dateStr}<br />{timeStr}
        </span>
      </div>

      {/* 时间选择弹窗 */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm" onClick={() => setShowPicker(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl w-72" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-heading font-extrabold text-base mb-4">设置到访时间</h4>
            <input
              type="datetime-local"
              defaultValue={toDatetimeLocal(resolvedCreatedAt)}
              onChange={(e) => {
                const val = e.target.value;
                if (val) onTimeChange?.(new Date(val).getTime());
              }}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => setShowPicker(false)}
              className="mt-4 w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
