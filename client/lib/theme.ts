import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'travel-theme';

/** 读取已保存的主题，默认浅色 */
function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch { /* SSR / 无权限 */ }
  return 'light';
}

/** 将主题写入 DOM 和 localStorage */
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
}

// 页面加载时立即应用（避免闪烁）
applyTheme(getStoredTheme());

/** 主题 Hook —— 返回当前主题和切换函数 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggle } as const;
}
