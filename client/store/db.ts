/**
 * 前端 API 客户端
 *   - 统一的 fetch 封装（Bearer token、错误抛出、401 自动登出）
 *   - 认证、地点 CRUD、照片上传、AI 配置读写
 */
import type { Place, AIConfig, Photo, User } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'auth-token';

const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers: headerInit, ...rest } = init;
  const headers = new Headers(headerInit);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let body = rest.body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, body, headers });
  if (res.status === 401) clearToken();
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch { /* ignore */ }
    throw new ApiError(res.status, msg);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function login(username: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const data = await api<{ user: User; token: string }>('/auth/login', { method: 'POST', json: { username, password } });
    setToken(data.token);
    return data;
  } catch { return null; }
}

export async function logout(): Promise<void> {
  try { await api<void>('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  clearToken();
}

export async function fetchCurrentUser(): Promise<User | null> {
  if (!getToken()) return null;
  try { return await api<User>('/auth/me'); } catch { return null; }
}

export const listPlaces = () => api<Place[]>('/places');
export const getPlace = (id: string) => api<Place>(`/places/${encodeURIComponent(id)}`);

export interface PlaceSearchResult {
  items: Place[];
  total: number;
  hasMore: boolean;
}

export function searchPlaces(q: string, limit: number, offset: number) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (q) params.set('q', q);
  return api<PlaceSearchResult>(`/places/search?${params}`);
}

export const savePlace = (item: Place) => api<Place>('/places', { method: 'POST', json: item });
export const updatePlace = (id: string, item: Place) => api<Place>(`/places/${encodeURIComponent(id)}`, { method: 'PUT', json: item });
export const deletePlace = (id: string) => api<void>(`/places/${encodeURIComponent(id)}`, { method: 'DELETE' });

export function uploadPhotos(placeId: string, files: File[], takenAtList?: (number | null)[], signal?: AbortSignal) {
  const form = new FormData();
  files.forEach((f, i) => {
    form.append('photos', f);
    form.append('takenAt', String(takenAtList?.[i] ?? ''));
  });
  return api<Photo[]>(`/places/${encodeURIComponent(placeId)}/photos`, { method: 'POST', body: form, signal });
}

export const deletePhoto = (photoId: number) => api<void>(`/photos/${photoId}`, { method: 'DELETE' });

function aiConfigPath(): string {
  return getToken() ? '/user/settings/ai-config' : '/settings/ai-config';
}

export async function getAIConfig(): Promise<AIConfig | null> {
  try {
    const data = await api<{ value: string | null }>(aiConfigPath());
    if (!data.value) return null;
    return JSON.parse(data.value) as AIConfig;
  } catch { return null; }
}

export const saveAIConfig = (config: AIConfig) => api<void>(aiConfigPath(), { method: 'PUT', json: { value: JSON.stringify(config) } });
