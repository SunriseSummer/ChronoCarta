import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { usePlaces } from '../store/usePlaces';
import { deletePlace, deletePhoto, getPlace, savePlace } from '../store/db';
import type { Place, Photo } from '../types';
import { genId } from '../lib/utils';
import { uploadWithExif } from '../lib/upload';
import PlaceEditor from '../components/PlaceEditor';
import PageLoading from '../components/PageLoading';

export default function PlacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh, user } = usePlaces();

  const locState = location.state as { lng: number; lat: number; title: string; address: string; draftId?: string } | null;
  const hasDraftRef = useRef(!!locState?.draftId);
  const draftPromiseRef = useRef<Promise<void> | null>(null);
  const [restoring, setRestoring] = useState(!!locState?.draftId);

  const [draft, setDraft] = useState<Place>(() => {
    const createdAt = Date.now();
    return {
      id: locState?.draftId || genId(locState?.title ?? 'place'),
      routePath: '',
      title: locState?.title ?? '',
      lng: locState?.lng ?? 0,
      lat: locState?.lat ?? 0,
      address: locState?.address ?? '',
      tags: [],
      photos: [],
      coverIndex: 0,
      description: '',
      tone: 'literary',
      visitedAt: createdAt,
      createdAt,
      visibility: 'private',
      isDraft: true,
    };
  });
  const draftRef = useRef<Place>(draft);

  useEffect(() => {
    if (!locState?.draftId) {
      navigate(location.pathname, {
        replace: true,
        state: { ...locState, draftId: draft.id },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!locState?.draftId) return;
    let cancelled = false;
    getPlace(locState.draftId)
      .then((existing) => {
        if (cancelled) return;
        setDraft(existing);
        draftRef.current = existing;
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center gap-6 px-6">
        <Icon icon="solar:lock-keyhole-bold" className="size-16 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground text-center">登录后操作</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary text-primary-foreground font-heading font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          前往登录
        </button>
      </div>
    );
  }

  if (restoring) return <PageLoading />;

  /** 确保草稿已持久化（promise-based 防并发） */
  async function ensureDraft() {
    if (hasDraftRef.current) return;
    if (draftPromiseRef.current) return draftPromiseRef.current;
    draftPromiseRef.current = savePlace({ ...draftRef.current, isDraft: true }).then(() => {
      hasDraftRef.current = true;
    });
    return draftPromiseRef.current;
  }

  async function handleUpload(files: File[]): Promise<Photo[]> {
    await ensureDraft();
    return uploadWithExif(draftRef.current.id, files);
  }

  async function handleSave(point: Place, pendingDeletes: number[]) {
    if (pendingDeletes.length > 0) {
      await Promise.all(pendingDeletes.map(photoId => deletePhoto(photoId)));
    }
    await savePlace({ ...point, id: draftRef.current.id, createdAt: draftRef.current.createdAt, isDraft: false });
    void refresh();
    navigate('/');
  }

  async function handleCancel() {
    if (hasDraftRef.current) {
      await deletePlace(draftRef.current.id).catch(() => {});
    }
  }

  function handleBack() {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate('/');
  }

  return (
    <PlaceEditor
      mode="create"
      point={draft}
      onUploadPhotos={handleUpload}
      onSave={handleSave}
      onCancel={handleCancel}
      onBack={handleBack}
    />
  );
}
