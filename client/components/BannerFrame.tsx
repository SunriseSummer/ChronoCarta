/**
 * 头部 Banner 外框组件
 *   - 根据封面照片的原始尺寸计算 aspect-ratio（竖图统一 1:1，横图保留比例）
 *   - 无照片时显示渐变占位背景 + 山水 SVG
 *   - 统一的底部渐变遮罩与操作栏插槽
 */
import { Icon } from '@iconify/react';
import type { Photo } from '../types';

interface BannerFrameProps {
  title?: string;
  cover?: Photo;
  /** 左上角返回按钮等 */
  leading?: React.ReactNode;
  /** 右上角操作按钮组 */
  trailing?: React.ReactNode;
  /** 底部浮层（如大标题），仅在有封面时容易看清 */
  footer?: React.ReactNode;
}

export default function BannerFrame({ title, cover, leading, trailing, footer }: BannerFrameProps) {
  const hasCover = !!cover?.thumb_banner;
  const isPortrait = !!cover && cover.height > cover.width;
  const aspectRatio = cover && cover.height > 0
    ? (isPortrait ? '1/1' : `${cover.width}/${cover.height}`)
    : '16/9';

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: hasCover ? aspectRatio : undefined,
        maxHeight: hasCover ? '60vh' : undefined,
        minHeight: hasCover ? '12rem' : undefined,
        height: hasCover ? undefined : '13rem',
      }}
    >
      {hasCover ? (
        <img
          src={cover.thumb_banner}
          alt={title}
          className={`w-full h-full object-cover ${isPortrait ? 'object-bottom' : 'object-center'}`}
        />
      ) : (
        <FallbackDecoration />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background pointer-events-none" />

      {leading && <div className="absolute top-14 left-4 z-10 sm:left-6">{leading}</div>}
      {trailing && <div className="absolute top-14 right-4 z-10 flex gap-2 sm:right-6">{trailing}</div>}
      {footer && <div className="absolute bottom-6 left-4 right-4 z-10 sm:left-6 sm:right-6">{footer}</div>}
    </div>
  );
}

function FallbackDecoration() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <path d="M0 350 Q200 200 400 280 T800 220 V400 H0Z" fill="currentColor" className="text-primary" />
          <path d="M0 380 Q300 300 500 340 T800 300 V400 H0Z" fill="currentColor" className="text-primary/60" />
          <circle cx="650" cy="80" r="40" fill="currentColor" className="text-primary/40" />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon icon="solar:map-point-wave-bold" className="size-20 text-primary/40" />
      </div>
    </div>
  );
}
