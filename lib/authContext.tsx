'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AppUser, UserRole } from './types';
import { loadDataFromSupabase, syncDataToSupabase } from './supabase';

const STORAGE_KEY_USERS = 'industrial_users_v2';
const STORAGE_KEY_CURRENT_USER = 'industrial_current_user_v2';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Administrador do Sistema',
    email: 'admin@listapro.com.br',
    role: 'admin',
    password: 'admin123',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-operador-1',
    username: 'operador',
    name: 'Operador Industrial',
    email: 'operador@listapro.com.br',
    role: 'operador',
    password: 'operador123',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

interface AuthContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  isLoading: boolean;
  isAdmin: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  addUser: (userData: Omit<AppUser, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateUser: (id: string, updates: Partial<AppUser>) => Promise<{ success: boolean; message: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message: string }>;
  // Compatibility fields
  user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null } | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutAccount: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: DEFAULT_USERS,
  isLoading: true,
  isAdmin: false,
  login: async () => ({ success: false, message: '' }),
  logout: () => {},
  addUser: async () => ({ success: false, message: '' }),
  updateUser: async () => ({ success: false, message: '' }),
  deleteUser: async () => ({ success: false, message: '' }),
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOutAccount: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading users from localStorage:', e);
      }
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (savedCurrent) {
          const parsed = JSON.parse(savedCurrent);
          if (parsed && typeof parsed.username === 'string') {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading current user session:', e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync users with Supabase in background
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const remoteUsers = (await loadDataFromSupabase('users')) as AppUser[] | null;
        if (!isMounted) return;

        if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
          // Merge to ensure admin is never lost
          const hasAdmin = remoteUsers.some((u) => u.role === 'admin');
          const merged = hasAdmin ? remoteUsers : [...DEFAULT_USERS.filter((u) => u.role === 'admin'), ...remoteUsers];
          setUsers(merged);
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
          } catch {}
        } else {
          // Seed Supabase with default users
          const currentLocalUsers = (() => {
            try {
              const saved = localStorage.getItem(STORAGE_KEY_USERS);
              if (saved) return JSON.parse(saved);
            } catch {}
            return DEFAULT_USERS;
          })();
          await syncDataToSupabase('users', currentLocalUsers);
        }
      } catch (err) {
        console.warn('Supabase users sync notice:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message: string }> => {
      setAuthError(null);
      const cleanUser = usernameOrEmail.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanUser || !cleanPass) {
        const msg = 'Por favor, preencha o usuário e a senha.';
        setAuthError(msg);
        return { success: false, message: msg };
      }

      // Find user
      const matched = users.find(
        (u) =>
          u.username.toLowerCase() === cleanUser ||
          (u.email && u.email.toLowerCase() === cleanUser)
      );

      if (!matched || matched.password !== cleanPass) {
        const msg = 'Usuário ou senha inválidos. Tente novamente.';
        setAuthError(msg);
        return { success: false, message: msg };
      }

      // Success
      setCurrentUser(matched);
      try {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(matched));
      } catch (e) {
        console.error('Error saving user session:', e);
      }
      return { success: true, message: `Bem-vindo, ${matched.name}!` };
    },
    [users]
  );

  // Logout handler
  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } catch (e) {
      console.error('Error clearing session:', e);
    }
  }, []);

  // Add new user (admin only)
  const addUser = useCallback(
    async (userData: Omit<AppUser, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
      const cleanUsername = userData.username.trim().toLowerCase();
      if (!cleanUsername) {
        return { success: false, message: 'Nome de usuário é obrigatório.' };
      }

      if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
        return { success: false, message: `O usuário "${userData.username}" já existe.` };
      }

      const newUser: AppUser = {
        ...userData,
        id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: cleanUsername,
        createdAt: new Date().toISOString(),
      };

      const updated = [...users, newUser];
      setUsers(updated);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      await syncDataToSupabase('users', updated);

      return { success: true, message: `Usuário "${newUser.name}" criado com sucesso!` };
    },
    [users]
  );

  // Update existing user (admin only)
  const updateUser = useCallback(
    async (id: string, updates: Partial<AppUser>): Promise<{ success: boolean; message: string }> => {
      const existing = users.find((u) => u.id === id);
      if (!existing) {
        return { success: false, message: 'Usuário não encontrado.' };
      }

      // Prevent removing admin role from the last admin
      if (existing.role === 'admin' && updates.role && updates.role !== 'admin') {
        const adminCount = users.filter((u) => u.role === 'admin').length;
        if (adminCount <= 1) {
          return { success: false, message: 'O sistema deve possuir pelo menos um Administrador ativo.' };
        }
      }

      const updatedList = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
      setUsers(updatedList);

      // If updating current user, refresh session
      if (currentUser && currentUser.id === id) {
        const refreshed = { ...currentUser, ...updates };
        setCurrentUser(refreshed);
        try {
          localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(refreshed));
        } catch {}
      }

      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedList));
      } catch {}
      await syncDataToSupabase('users', updatedList);

      return { success: true, message: 'Usuário atualizado com sucesso!' };
    },
    [users, currentUser]
  );

  // Delete user (admin only)
  const deleteUser = useCallback(
    async (id: string): Promise<{ success: boolean; message: string }> => {
      const target = users.find((u) => u.id === id);
      if (!target) {
        return { success: false, message: 'Usuário não encontrado.' };
      }

      if (target.role === 'admin') {
        const adminCount = users.filter((u) => u.role === 'admin').length;
        if (adminCount <= 1) {
          return { success: false, message: 'Não é possível excluir o único Administrador do sistema.' };
        }
      }

      const updatedList = users.filter((u) => u.id !== id);
      setUsers(updatedList);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedList));
      } catch {}
      await syncDataToSupabase('users', updatedList);

      // If user deleted themselves
      if (currentUser && currentUser.id === id) {
        logout();
      }

      return { success: true, message: `Usuário "${target.name}" excluído com sucesso.` };
    },
    [users, currentUser, logout]
  );

  const isAdmin = currentUser?.role === 'admin';

  // Compatibility object for user representation
  const compatUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      uid: currentUser.id,
      displayName: currentUser.name,
      email: currentUser.email || `${currentUser.username}@listapro.com.br`,
      photoURL: currentUser.avatar || null,
    };
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isLoading,
        isAdmin,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        user: compatUser,
        loading: isLoading,
        signInWithGoogle: async () => {},
        signOutAccount: async () => logout(),
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);
export const useFirebaseAuth = () => useContext(AuthContext);
