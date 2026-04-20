import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaceDetail } from '../hooks/usePlaceDetail';
import { usePlaces } from '../store/usePlaces';
import { deletePhoto, updatePlace } from '../store/db';
import type { Place, Photo } from '../types';
import { uploadWithExif } from '../lib/upload';
import PageLoading from '../components/PageLoading';
import PlaceEditor from '../components/PlaceEditor';

export default function DetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { point, refresh } = usePlaceDetail();
  const { user } = usePlaces();

  const isAdmin = user?.role === 'admin';
  const routePath = point?.routePath || point?.id || '';
  const denied = !!point && !isAdmin && (point.isPreset || !point.isOwner);

  // 同步最新数据（如从 /profile 返回时照片已在服务端但本地 store 未刷新）
  useEffect(() => { void refresh(); }, [refresh]);

  // 无编辑权限 → 跳转到只读页
  useEffect(() => {
    if (denied) navigate(`/view/${routePath}`, { replace: true });
  }, [denied, routePath, navigate]);

  if (!point || denied) return <PageLoading />;
  const pointId = point.id;

  function goBackToView() {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate(`/view/${routePath}`, { replace: true });
  }

  async function handleUpload(files: File[]): Promise<Photo[]> {
    return uploadWithExif(pointId, files);
  }

  async function handleSave(updated: Place, pendingDeletes: number[]) {
    if (pendingDeletes.length > 0) {
      await Promise.all(pendingDeletes.map(photoId => deletePhoto(photoId)));
    }
    await updatePlace(pointId, updated);
    await refresh();
    goBackToView();
  }

  async function handleCancel(uploadedPhotoIds: number[]) {
    if (uploadedPhotoIds.length > 0) {
      await Promise.all([...new Set(uploadedPhotoIds)].map(photoId => deletePhoto(photoId)));
      await refresh();
    }
  }

  return (
    <PlaceEditor
      key={pointId}
      mode="edit"
      point={point}
      onUploadPhotos={handleUpload}
      onSave={handleSave}
      onCancel={handleCancel}
      onBack={goBackToView}
    />
  );
}
