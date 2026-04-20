import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { usePlaces } from '../store/usePlaces';
import HeaderActionButton from '../components/HeaderActionButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = usePlaces();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setLoginError('请输入用户名和密码');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    const ok = await login(username.trim(), password.trim());
    if (!ok) {
      setLoginError('用户名或密码错误');
      setLoggingIn(false);
    } else {
      navigate(-1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* 背景装饰层 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 大圆形光晕 */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/8 blur-2xl" />
        {/* 山形 SVG 装饰 */}
        <svg
          viewBox="0 0 800 300"
          className="absolute bottom-0 left-0 right-0 w-full opacity-[0.06]"
          preserveAspectRatio="xMidYMax slice"
        >
          <path d="M0 300 L120 80 L280 200 L420 20 L580 160 L720 60 L800 120 L800 300 Z" fill="currentColor" className="text-primary" />
          <path d="M0 300 L80 150 L200 240 L360 100 L500 200 L640 110 L800 180 L800 300 Z" fill="currentColor" className="text-primary/60" />
        </svg>
      </div>

      {/* 顶部返回按钮 */}
      <div className="absolute top-14 left-4 z-10">
        <HeaderActionButton icon="hugeicons:arrow-left-01" onClick={() => navigate(-1)} title="返回" tone="ghost" />
      </div>

      {/* 主要内容区 */}
      <div className="relative flex flex-col flex-1 px-6 pt-28 pb-12 overflow-y-auto">
        {/* 品牌标志区 */}
        <div className="flex flex-col items-center mb-10">
          {/* Logo 图标 */}
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
            <Icon icon="solar:map-point-wave-bold" className="size-10 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-center">
            山海绘卷
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            水是眼波横，山是眉峰聚
          </p>
        </div>

        {/* 登录表单卡片 */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-heading font-extrabold text-xl text-center mb-2">账号登录</h2>

          {/* 用户名输入 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
              用户名
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon icon="solar:user-linear" className="size-4.5" />
              </div>
              <input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setLoginError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                autoComplete="username"
                className="w-full bg-input/80 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
          </div>

          {/* 密码输入 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
              密码
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon icon="solar:lock-keyhole-linear" className="size-4.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                autoComplete="current-password"
                className="w-full bg-input/80 border border-border rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} className="size-4.5" />
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {loginError && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2.5">
              <Icon icon="solar:danger-circle-bold" className="size-4 text-destructive shrink-0" />
              <p className="text-destructive text-xs font-bold">{loginError}</p>
            </div>
          )}

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full bg-primary text-primary-foreground font-heading font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2 mt-2"
          >
            {loggingIn ? (
              <>
                <Icon icon="solar:refresh-bold" className="size-5 animate-spin" />
                <span>登录中...</span>
              </>
            ) : (
              <>
                <Icon icon="solar:login-2-bold" className="size-5" />
                <span>登录</span>
              </>
            )}
          </button>
        </div>

        {/* 底部装饰文字 */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground/60">
            登录后可记录你的旅行足迹
          </p>
          <p className="text-xs text-muted-foreground/40">
            未注册用户请联系管理员
          </p>
        </div>
      </div>
    </div>
  );
}
