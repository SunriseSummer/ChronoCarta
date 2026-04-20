/**
 * 页面头部 Banner（封面图 + 渐变遮罩 + 悬浮操作栏 + 标题）
 * ViewPage 只读展示专用；编辑场景直接用 BannerFrame
 */
import { getCoverPhoto } from '../lib/utils';
import type { Photo } from '../types';
import BannerFrame from './BannerFrame';
import HeaderActionButton from './HeaderActionButton';

interface HeroBannerProps {
  title: string;
  photos: Photo[];
  coverIndex: number;
  onBack: () => void;
  actions?: React.ReactNode;
}

export default function HeroBanner({ title, photos, coverIndex, onBack, actions }: HeroBannerProps) {
  const cover = getCoverPhoto(photos, coverIndex);

  return (
    <BannerFrame
      title={title}
      cover={cover}
      leading={<HeaderActionButton icon="hugeicons:arrow-left-01" onClick={onBack} title="返回" />}
      trailing={actions}
      footer={
        <h2
          className="font-heading text-3xl font-extrabold tracking-tight text-white"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)' }}
        >
          {title}
        </h2>
      }
    />
  );
}
