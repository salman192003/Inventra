import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string;
  isOwner: boolean;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  country: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  business: Business | null;
  setAuth: (token: string, user: User, business: Business) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      business: null,

      setAuth: (token, user, business) => {
        localStorage.setItem('inventra_token', token);
        set({ token, user, business });
      },

      logout: () => {
        localStorage.removeItem('inventra_token');
        set({ token: null, user: null, business: null });
      },

      isAuthenticated: () => get().token !== null,
    }),
    {
      name: 'inventra-auth',
      partialize: (state) => ({ token: state.token, user: state.user, business: state.business }),
    },
  ),
);
