import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePlaces } from '../store/usePlaces';

/** 从 URL 参数加载地点数据，优先按 routePath 匹配，兼容旧 id 路由 */
export function usePlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const routePath = id ?? '';
  const ctx = usePlaces();
  const point = useMemo(
    () => ctx.places.find((p) => p.routePath === routePath || p.id === routePath) ?? null,
    [ctx.places, routePath],
  );

  return { point, ...ctx };
}
