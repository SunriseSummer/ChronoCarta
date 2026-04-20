import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Place, User } from '../types';
import {
  listPlaces,
  deletePlace as dbDelete,
  login as apiLogin,
  logout as apiLogout,
  fetchCurrentUser,
} from './db';
import { AppContext } from './places-context';

export function AppProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listPlaces();
      setPlaces(items);
    } catch (err) {
      console.error('[AppProvider] refresh failed:', err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时恢复用户会话
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await fetchCurrentUser();
      if (cancelled) return;
      setUser(u);
      await refresh();
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await dbDelete(id);
    await refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const result = await apiLogin(username, password);
    if (!result) return false;
    setUser(result.user);
    await refresh();
    return true;
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    await refresh();
  }, [refresh]);

  // 使用 useMemo 稳定 context value，避免任意 state 变化都触发全部消费者重渲染
  const value = useMemo(
    () => ({ places, loading, user, refresh, remove, login, logout }),
    [places, loading, user, refresh, remove, login, logout],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
