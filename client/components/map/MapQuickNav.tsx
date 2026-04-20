/**
 * MapQuickNav — 地图页右下角竖排浮动导航
 *   提供 "集锦" / "我的" 两个入口
 *   使用高对比度实底卡片 + 投影，在任意地图底色下都清晰可辨
 */
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface QuickNavEntry {
  path: string;
  icon: string;
  label: string;
}

const ENTRIES: QuickNavEntry[] = [
  { path: '/grid', icon: 'solar:gallery-wide-bold', label: '集锦' },
  { path: '/profile', icon: 'solar:user-bold', label: '我的' },
];

export default function MapQuickNav() {
  const navigate = useNavigate();

  return (
    <nav
      aria-label="快捷导航"
      className="fixed z-30 right-4 bottom-6 flex flex-col gap-0.5 sm:right-6 sm:bottom-8 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-xl shadow-black/15 overflow-hidden"
    >
      {ENTRIES.map((entry) => (
        <button
          key={entry.path}
          type="button"
          onClick={() => navigate(entry.path)}
          title={entry.label}
          className="group relative h-12 w-12 flex items-center justify-center transition-colors duration-150 cursor-pointer hover:bg-muted/60 active:bg-muted"
        >
          <Icon icon={entry.icon} className="size-5 text-foreground/70 group-hover:text-primary transition-colors" />
        </button>
      ))}
    </nav>
  );
}
