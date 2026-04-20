import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { usePlaces } from '../store/usePlaces';
import { useTheme } from '../lib/theme';
import PageContainer from '../components/PageContainer';
import HeaderActionButton from '../components/HeaderActionButton';
import AIConfigSection from '../components/AIConfigSection';
import AppToast from '../components/AppToast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, places } = usePlaces();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showApiKeyToast, setShowApiKeyToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiConfigRef = useRef<HTMLDivElement>(null);

  // 仅在挂载时检查是否需要提示配置 API Key
  useEffect(() => {
    const state = location.state as { needApiKey?: boolean } | null;
    if (state?.needApiKey) {
      navigate(location.pathname, { replace: true, state: {} });
      setShowApiKeyToast(true);
      toastTimerRef.current = setTimeout(() => setShowApiKeyToast(false), 3000);
      setTimeout(() => aiConfigRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // ── 统计数据 ──
  const myPlaces = places.filter(c => c.isOwner);
  const totalPhotos = myPlaces.reduce((sum, c) => sum + c.photos.length, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      {/* ── 用户头部区域 ── */}
      <div className="relative w-full bg-gradient-to-br from-primary/30 via-primary/10 to-background overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <path d="M0 250 Q200 150 400 200 T800 160 V300 H0Z" fill="currentColor" className="text-primary" />
            <circle cx="680" cy="60" r="35" fill="currentColor" className="text-primary/40" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* 返回按钮 */}
        <div className="absolute top-14 left-4 z-20 sm:left-6">
          <HeaderActionButton icon="hugeicons:arrow-left-01" onClick={() => navigate(-1)} title="返回" tone="ghost" />
        </div>

        {/* 顶部主题切换按钮 */}
        <div className="absolute top-14 right-4 z-20 sm:right-6">
          <HeaderActionButton
            icon={theme === 'dark' ? 'solar:moon-bold' : 'solar:sun-bold'}
            onClick={toggleTheme}
            title="切换主题"
            tone="ghost"
          />
        </div>

        {/* 用户信息卡片 */}
        <div className="relative z-10 flex flex-col items-center pt-16 pb-10 px-4">
          {user ? (
            <>
              {/* 已登录 — 显示头像和信息 */}
              <div className="w-24 h-24 rounded-full border-4 border-card shadow-xl overflow-hidden bg-muted">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon icon="solar:user-bold" className="size-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">{user.displayName || user.username}</h2>
              <p className="text-sm text-muted-foreground mt-1">@{user.username}</p>

              {/* 统计条 */}
              <div className="flex gap-8 mt-5">
                <div className="text-center">
                  <p className="font-heading text-xl font-extrabold text-primary">{myPlaces.length}</p>
                  <p className="text-xs text-muted-foreground font-bold">地点</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-xl font-extrabold text-primary">{totalPhotos}</p>
                  <p className="text-xs text-muted-foreground font-bold">照片</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 未登录 — 点击跳转登录页 */}
              <button
                onClick={() => navigate('/login')}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="w-24 h-24 rounded-full border-4 border-card shadow-xl overflow-hidden bg-muted flex items-center justify-center group-hover:border-primary/40 transition-colors">
                  <Icon icon="solar:user-bold" className="size-12 text-muted-foreground" />
                </div>
                <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight group-hover:text-primary transition-colors">点击登录</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">登录后解锁完整功能</p>
              </button>
            </>
          )}
        </div>
      </div>

      <PageContainer className="space-y-6">
        {user && (
          <>
            <div ref={aiConfigRef} className="space-y-5">
              <AIConfigSection userId={user.id} />
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Icon icon="solar:logout-2-bold" className="size-5" />
              退出登录
            </button>
          </>
        )}
      </PageContainer>

      <AppToast visible={showApiKeyToast} icon="solar:key-bold" message="请先配置 AI 大模型服务" position="top" />
    </div>
  );
}
