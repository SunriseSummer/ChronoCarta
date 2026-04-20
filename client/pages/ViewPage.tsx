import { useNavigate } from 'react-router-dom';
import { usePlaceDetail } from '../hooks/usePlaceDetail';
import { usePlaces } from '../store/usePlaces';
import PageContainer from '../components/PageContainer';
import PageSection from '../components/PageSection';
import HeroBanner from '../components/HeroBanner';
import StatsCard from '../components/StatsCard';
import PhotoStrip from '../components/PhotoStrip';
import PageLoading from '../components/PageLoading';
import HeaderActionButton from '../components/HeaderActionButton';

export default function ViewPage() {
  const navigate = useNavigate();
  const { point, remove } = usePlaceDetail();
  const { user } = usePlaces();

  if (!point) return <PageLoading />;
  const routePath = point.routePath || point.id;

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || (point.isOwner && !point.isPreset);

  async function handleDelete() {
    if (!point) return;
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await remove(point.id);
        navigate('/');
      } catch (err) {
        console.error('[ViewPage] 删除失败:', err);
        alert('删除失败，请重试');
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-8">
      <HeroBanner
        title={point.title}
        photos={point.photos}
        coverIndex={point.coverIndex}
        onBack={() => navigate(-1)}
        actions={
          canEdit ? (
            <>
              <HeaderActionButton
                onClick={() => navigate(`/edit/${routePath}`)}
                icon="solar:pen-bold"
                title="编辑"
              />
              <HeaderActionButton
                onClick={handleDelete}
                icon="solar:trash-bin-trash-bold"
                tone="danger"
                title="删除"
              />
            </>
          ) : undefined
        }
      />

      <PageContainer className="-mt-4 relative z-10">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xl">
          <StatsCard lat={point.lat} lng={point.lng} altitude={point.altitude} createdAt={point.visitedAt || point.createdAt} />
        </div>
      </PageContainer>

      <PageContainer className="mt-8 space-y-8">
        <PhotoStrip photos={point.photos.map(p => p.thumb_md)} coverIndex={point.coverIndex} originalUrls={point.photos.map(p => p.original)} />

        {point.description && (
          <PageSection title="地理笔记" className="space-y-3">
            <div className="bg-card/50 border border-border rounded-xl p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{point.description}</p>
            </div>
          </PageSection>
        )}

        {point.tags.length > 0 && (
          <PageSection title="地理标签" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {point.tags.map((t) => (
                <span key={t} className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/30">
                  {t}
                </span>
              ))}
            </div>
          </PageSection>
        )}

        {point.address && (
          <PageSection title="详细地址" className="space-y-3">
            <p className="text-sm text-muted-foreground">{point.address}</p>
          </PageSection>
        )}

        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
          记录于 {new Date(point.createdAt).toLocaleString('zh-CN')}
        </div>
      </PageContainer>
    </div>
  );
}
