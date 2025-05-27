import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        loading: true,
        setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
        setLoading: (loading) => set({ loading }),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      {
        name: 'app-storage',
      }
    )
  )
); 