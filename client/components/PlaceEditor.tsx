/**
 * 统一的地点编辑器，创建页面（PlacePage）与编辑页面（DetailPage）共用
 * - 有封面照片时显示照片背景 Banner，否则显示渐变占位
 * - 选图后立即上传，取消时由外层负责清理本次会话新增图片
 */
import { useEffect, useState } from 'react';
import type { Place, Photo } from '../types';
import { mergeUniqueStrings, getCoverPhoto } from '../lib/utils';
import BannerFrame from './BannerFrame';
import PageContainer from './PageContainer';
import PageSection from './PageSection';
import StatsCard from './StatsCard';
import PhotoStrip from './PhotoStrip';
import AIWriter from './AIWriter';
import TagEditor from './TagEditor';
import HeaderActionButton from './HeaderActionButton';

interface PlaceEditorProps {
  mode: 'create' | 'edit';
  /** 地点数据（创建模式传入骨架数据，编辑模式传入已有数据） */
  point: Place;
  /** 保存回调：由外层页面负责实际 API 调用 */
  onSave: (point: Place, pendingDeletes: number[]) => Promise<void>;
  /** 选图后立即上传 */
  onUploadPhotos: (files: File[]) => Promise<Photo[]>;
  /** 取消时清理本次编辑中新上传的照片 */
  onCancel: (uploadedPhotoIds: number[]) => Promise<void> | void;
  onBack: () => void;
}

export default function PlaceEditor({
  mode,
  point,
  onSave,
  onUploadPhotos,
  onCancel,
  onBack,
}: PlaceEditorProps) {
  /* -------- 表单状态 -------- */
  const [title, setTitle] = useState(point.title);
  const lng = point.lng;
  const lat = point.lat;
  const [altitude, setAltitude] = useState(point.altitude);
  const address = point.address ?? '';
  const [description, setDescription] = useState(point.description);
  const [tone, setTone] = useState(point.tone);
  const [tags, setTags] = useState<string[]>(point.tags);
  const [visitedAt, setVisitedAt] = useState<number>(point.visitedAt || point.createdAt);
  const [coverIndex, setCoverIndex] = useState(point.coverIndex);
  const [visibility, setVisibility] = useState<'private' | 'shared'>(point.visibility ?? 'private');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /* -------- 照片管理 -------- */
  const [photos, setPhotos] = useState<Photo[]>(point.photos);
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState<number[]>([]);

  useEffect(() => {
    setPhotos(point.photos);
    setPendingDeletes([]);
    setUploadedPhotoIds([]);
    setCoverIndex(point.coverIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point.id, point.photos]);

  const visibleExisting = photos.filter(p => !pendingDeletes.includes(p.id));
  const allThumbUrls = visibleExisting.map(p => p.thumb_md);
  const allOriginalUrls = visibleExisting.map(p => p.original);

  /* -------- 封面 Banner -------- */
  const coverExisting = getCoverPhoto(visibleExisting, coverIndex);
  const hasBannerFromExisting = coverIndex < visibleExisting.length && !!coverExisting;

  /* -------- 照片操作 -------- */
  async function handleAddFiles(files: File[]) {
    if (isUploading || files.length === 0) return;
    setIsUploading(true);
    try {
      const added = await onUploadPhotos(files);
      if (added.length > 0) {
        setPhotos(prev => [...prev, ...added]);
        setUploadedPhotoIds(prev => [...prev, ...added.map(photo => photo.id)]);
        if (visibleExisting.length === 0) {
          const coverTaken = added[0].takenAt;
          if (coverTaken) setVisitedAt(coverTaken);
        }
      }
    } catch {
      alert('照片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemovePhoto(i: number) {
    const photo = visibleExisting[i];
    if (!photo || pendingDeletes.includes(photo.id)) return;
    setPendingDeletes(prev => [...prev, photo.id]);
    if (i === coverIndex) setCoverIndex(0);
    else if (i < coverIndex) setCoverIndex(coverIndex - 1);
  }

  async function handleCancel() {
    if (isSaving || isUploading) return;
    try {
      await onCancel(uploadedPhotoIds);
    } finally {
      onBack();
    }
  }

  /* -------- 保存 -------- */
  async function handleSave() {
    if (isSaving || isUploading) return;
    if (!title.trim()) {
      alert('请输入地点名称');
      return;
    }
    const safeCoverIndex = visibleExisting.length === 0 ? 0 : Math.min(coverIndex, visibleExisting.length - 1);
    const updated: Place = {
      ...point,
      title: title.trim(),
      lng, lat, altitude, address,
      description, tone, tags, visitedAt, coverIndex: safeCoverIndex,
      photos: visibleExisting,
      visibility,
    };
    setIsSaving(true);
    try {
      await onSave(updated, pendingDeletes);
    } finally {
      setIsSaving(false);
    }
  }

  /* -------- 渲染 -------- */
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-8">
      <BannerFrame
        title={title}
        cover={hasBannerFromExisting ? coverExisting : undefined}
        leading={
          <HeaderActionButton
            icon="hugeicons:arrow-left-01"
            onClick={handleCancel}
            title="返回"
            disabled={isSaving || isUploading}
          />
        }
        trailing={
          <>
            <HeaderActionButton
              icon={visibility === 'shared' ? 'solar:global-bold' : 'solar:lock-keyhole-bold'}
              onClick={() => setVisibility(v => v === 'private' ? 'shared' : 'private')}
              title={visibility === 'shared' ? '共享' : '私密'}
              disabled={isSaving || isUploading}
            />
            <HeaderActionButton
              icon="solar:check-circle-bold"
              onClick={handleSave}
              title={isUploading ? '上传中' : isSaving ? '保存中' : '确认'}
              disabled={isSaving || isUploading}
            />
          </>
        }
      />

      {/* ===== 内容区 ===== */}
      <PageContainer className={`${hasBannerFromExisting ? '-mt-4 relative z-10' : ''} space-y-6`}>
        {/* 基本信息 */}
        <PageSection title="基本信息">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="地点名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <StatsCard
              lat={lat}
              lng={lng}
              altitude={altitude}
              altitudeEditable={mode === 'create'}
              onAltitudeChange={mode === 'create' ? setAltitude : undefined}
              createdAt={visitedAt}
              timeEditable
              onTimeChange={setVisitedAt}
            />
          </div>
        </PageSection>

        {/* 照片 */}
        <PageSection title="照片">
          <PhotoStrip
            photos={allThumbUrls}
            coverIndex={coverIndex}
            editable
            onSetCover={(i) => {
              setCoverIndex(i);
              const photo = visibleExisting[i];
              if (photo?.takenAt) setVisitedAt(photo.takenAt);
            }}
            onAddFiles={handleAddFiles}
            onRemove={handleRemovePhoto}
            uploading={isUploading}
          />
        </PageSection>

        {/* AI 写作 */}
        <AIWriter
          description={description}
          onDescriptionChange={setDescription}
          tone={tone}
          onToneChange={setTone}
          photos={allOriginalUrls}
          location={{ title, lng, lat, altitude, address }}
          onTagsGenerated={(newTags) => setTags((prev) => mergeUniqueStrings(prev, newTags))}
        />

        {/* 标签 */}
        <TagEditor tags={tags} onChange={setTags} />
      </PageContainer>
    </div>
  );
}
