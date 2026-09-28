'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGooglePopup, signOutFirebaseUser } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutAccount: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOutAccount: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase Auth state error:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Erro ao vincular conta Google no Firebase:', err);
      // Don't show error if user simply closed the popup
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError('Não foi possível vincular a conta: ' + msg);
      }
    }
  };

  const signOutAccount = async () => {
    setAuthError(null);
    try {
      await signOutFirebaseUser();
    } catch (err: unknown) {
      console.error('Erro ao desvincular conta do Firebase:', err);
      setAuthError('Erro ao desvincular conta.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutAccount,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useFirebaseAuth = () => useContext(AuthContext);
