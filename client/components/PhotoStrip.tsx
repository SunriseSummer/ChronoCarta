import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';

interface PhotoStripProps {
  photos: string[];       // 显示用的 URL（缩略图）
  coverIndex: number;
  /** 原图 URL（只读模式下点击查看大图） */
  originalUrls?: string[];
  /** 可编辑模式：显示添加/删除按钮 */
  editable?: boolean;
  /** 传 File 对象给服务端上传 */
  onAddFiles?: (files: File[]) => void | Promise<void>;
  onRemove?: (index: number) => void;
  /** 设置封面索引 */
  onSetCover?: (index: number) => void;
  uploading?: boolean;
}

export default function PhotoStrip({
  photos,
  coverIndex,
  originalUrls,
  editable,
  onAddFiles,
  onRemove,
  onSetCover,
  uploading = false,
}: PhotoStripProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  // 大图预览时：监听 ESC 键关闭、锁定 body 滚动
  useEffect(() => {
    if (!viewUrl) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setViewUrl(null); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [viewUrl]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    e.target.value = '';
    void onAddFiles?.(fileArr);
  }

  if (!editable && photos.length === 0) return null;

  return (
    <>
      {editable && (
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      )}
      <div className="flex gap-3 overflow-x-auto py-2 -mx-4 px-4 no-scrollbar sm:-mx-6 sm:px-6">
        {photos.map((p, i) => (
          <div
            key={`${i}-${p}`}
            className={`flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden shadow-md relative group cursor-pointer ${
              i === coverIndex ? 'ring-2 ring-primary ring-offset-1' : 'border border-border'
            }`}
            onClick={() => {
              if (editable && onSetCover && i !== coverIndex) {
                onSetCover(i);
              } else if (!editable && originalUrls?.[i]) {
                setViewUrl(originalUrls[i]);
              }
            }}
          >
            <img src={p} className="w-full h-full object-cover" alt="" />
            {/* 封面标记 */}
            {i === coverIndex ? (
              <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                <span className="bg-primary/90 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
                  封面
                </span>
              </div>
            ) : editable && onSetCover ? (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[9px] font-bold bg-black/50 px-1.5 py-0.5 rounded-sm">
                  设为封面
                </span>
              </div>
            ) : null}
            {/* 删除按钮（编辑模式始终显示） */}
            {editable && onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="absolute top-1 right-1 text-primary drop-shadow-md cursor-pointer hover:text-primary/80 transition-colors"
              >
                <Icon icon="solar:close-circle-bold" className="size-6" />
              </button>
            )}
          </div>
        ))}
        {/* 添加照片按钮 */}
        {editable && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 w-32 h-32 rounded-xl border border-dashed border-border flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon icon={uploading ? 'solar:refresh-circle-bold' : 'solar:add-circle-linear'} className="text-muted-foreground size-8" />
            <span className="text-[10px] text-muted-foreground mt-1">{uploading ? '上传中' : '添加照片'}</span>
          </button>
        )}
      </div>

      {/* 原图查看弹层 */}
      {viewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setViewUrl(null)}
        >
          <button className="absolute top-6 right-6 text-white/80 hover:text-white" onClick={() => setViewUrl(null)}>
            <Icon icon="solar:close-circle-bold" className="size-8" />
          </button>
          <img src={viewUrl} className="max-w-full max-h-full object-contain" alt="" />
        </div>
      )}
    </>
  );
}
