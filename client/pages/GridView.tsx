import { Icon } from '@iconify/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPlaces } from '../store/db';
import type { Place } from '../types';
import PageLoading from '../components/PageLoading';
import { getCoverPhoto } from '../lib/utils';

/** 根据标题长度给卡片一个稳定伪随机高度，形成瀑布效果 */
const CARD_HEIGHTS = ['h-40', 'h-48', 'h-56', 'h-60', 'h-64'] as const;
const PAGE_SIZE = 10;

export default function GridView() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  /* ── 首次 / 搜索关键词变化时重新请求 ── */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(async (q: string, offset: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await searchPlaces(q.trim(), PAGE_SIZE, offset);
      setItems(prev => append ? [...prev, ...res.items] : res.items);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('[GridView] fetch failed:', err);
      if (!append) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPage(searchText, 0, false);
    }, searchText ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchText, fetchPage]);

  /* ── 下滑增量加载 ── */
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelCallback = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchPage(searchText, items.length, true);
      }
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [hasMore, loadingMore, searchText, items.length, fetchPage]);

  return (
    <div className="relative flex flex-col min-h-screen bg-background pb-10">
      {/* 标题 */}
      <div className="px-4 pt-12 pb-5 sm:px-6">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">山海绘卷</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1 tracking-widest">
          水是眼波横，山是眉峰聚
        </p>
      </div>

      {/* 搜索框 */}
      <div className="px-4 pb-4 sm:px-6">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-3 border border-border shadow-lg">
          <Icon icon="solar:magnifer-linear" className="text-secondary-foreground size-5 shrink-0" />
          <input
            type="text"
            placeholder="搜索标题、地址、到访时间..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground font-medium tracking-wide outline-none w-full"
          />
          {searchText && (
            <button onClick={() => setSearchText('')} className="cursor-pointer shrink-0" type="button">
              <Icon icon="solar:close-circle-bold" className="text-muted-foreground hover:text-foreground size-5 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <PageLoading />
      ) : items.length === 0 ? (
        searchText.trim() ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground px-6">
            <Icon icon="solar:magnifer-linear" className="size-16 opacity-30" />
            <p className="text-center">未找到匹配的地点</p>
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 px-4 sm:px-6 mt-4 space-y-3 sm:space-y-4">
            {items.map(pt => (
              <GridCard
                key={pt.id}
                point={pt}
                onClick={() => navigate(`/view/${pt.routePath || pt.id}`)}
              />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelCallback} className="flex justify-center py-8">
              <Icon icon="solar:refresh-bold" className="text-primary size-5 animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground px-6">
      <Icon icon="solar:map-point-wave-bold" className="size-16 opacity-30" />
      <p className="text-center">还没有旅行记录<br />回到地图，点击任意位置开始你的旅程</p>
    </div>
  );
}

function GridCard({ point, onClick }: { point: Place; onClick: () => void }) {
  const photo = getCoverPhoto(point.photos, point.coverIndex);
  const src = photo?.thumb_md || '';
  const h = CARD_HEIGHTS[point.title.length % CARD_HEIGHTS.length];

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border group cursor-pointer shadow-lg break-inside-avoid"
      onClick={onClick}
    >
      {src ? (
        <img src={src} alt={point.title} className={`w-full ${h} object-cover`} loading="lazy" />
      ) : (
        <div className={`w-full ${h} bg-muted flex items-center justify-center`}>
          <Icon icon="solar:map-point-wave-bold" className="size-10 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-3 left-3 flex flex-col">
        <span className="text-xs font-bold text-white tracking-wider">{point.title}</span>
        <span className="text-[10px] text-white/70">
          {new Date(point.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  );
}
