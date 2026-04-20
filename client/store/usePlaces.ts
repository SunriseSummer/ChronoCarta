import { useContext } from 'react';
import { AppContext } from './places-context';

export function usePlaces() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('usePlaces 必须在 AppProvider 内使用');
  return ctx;
}
