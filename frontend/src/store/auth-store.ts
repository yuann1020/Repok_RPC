import { create } from 'zustand';

// Define the shape of our transient User payload logically mapping the Prisma token claims
export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserPayload | null;
  setAuth: (token: string, user: UserPayload) => void;
  logout: () => void;
  hydrate: () => void;
}

// Decode the JWT payload without a library — just base64 parse the middle segment
function decodeJwtPayload(token: string): UserPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return { userId: parsed.userId, email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: (token: string, user: UserPayload) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    set({ token, user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ token: null, user: null });
  },

  // Called once on app mount to restore session from persisted token
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const user = decodeJwtPayload(token);
    if (user) {
      set({ token, user });
    } else {
      // Token is corrupted or expired — clean up
      localStorage.removeItem('auth_token');
      set({ token: null, user: null });
    }
  },
}));
