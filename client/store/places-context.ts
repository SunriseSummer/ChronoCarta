import { createContext } from 'react';
import type { Place, User } from '../types';

export interface AppState {
  places: Place[];
  loading: boolean;
  user: User | null;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AppContext = createContext<AppState | null>(null);
