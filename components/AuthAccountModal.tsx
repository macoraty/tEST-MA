'use client';

import React from 'react';
import { useFirebaseAuth } from '@/lib/authContext';
import {
  X,
  LogIn,
  LogOut,
  UserCheck,
  ShieldCheck,
  Database,
  Mail,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AuthAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthAccountModal: React.FC<AuthAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, loading, signInWithGoogle, signOutAccount, authError, clearAuthError } =
    useFirebaseAuth();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-cyan-950/40 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-zinc-850 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/80 to-zinc-900 text-cyan-400 shadow-md shadow-cyan-950/40">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
              Gerenciar Conta Firebase
            </h2>
            <p className="text-xs text-zinc-400">
              Vincule ou desvincule sua conta para sincronização na nuvem
            </p>
          </div>
        </div>

        {/* Error notification if any */}
        {authError && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={clearAuthError}
              className="text-red-400 hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
              <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
              <span className="mt-2 text-xs">Verificando status da conta...</span>
            </div>
          ) : user ? (
            /* USER IS LINKED / SIGNED IN */
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-zinc-900/60 to-zinc-900/80 p-5">
                <div className="flex items-start gap-4">
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuário'}
                      className="h-14 w-14 rounded-2xl border-2 border-emerald-500/50 object-cover shadow-md shadow-emerald-950/40"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-500/50 bg-emerald-950 text-xl font-bold text-emerald-300">
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-zinc-100">
                        {user.displayName || 'Usuário Conectado'}
                      </h3>
                      <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Vinculada
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-300">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-zinc-500 truncate">
                      UID: {user.uid}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                    <span>Conta Google autenticada no Firebase</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">Provedor: Google</span>
                </div>
              </div>

              {/* Cloud Database Link Details */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-300">
                <div className="flex items-center gap-2 font-semibold text-zinc-200 mb-2">
                  <Database className="h-4 w-4 text-cyan-400" />
                  <span>Sincronização em Tempo Real</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  As suas listas de materiais, catalogo de insumos e requisições estão vinculadas e salvas na nuvem com seu identificador de segurança.
                </p>
              </div>

              {/* Actions: Desvincular Conta / Trocar Conta */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  id="btn-unlink-firebase-account"
                  onClick={async () => {
                    await signOutAccount();
                    onClose();
                  }}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-900/50 active:scale-98"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  <span>Desvincular Conta</span>
                </button>

                <button
                  type="button"
                  id="btn-switch-firebase-account"
                  onClick={async () => {
                    await signInWithGoogle();
                  }}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-850"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Trocar de Conta</span>
                </button>
              </div>
            </div>
          ) : (
            /* USER IS NOT LINKED */
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-zinc-900/40 to-zinc-900/60 p-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-950/50 text-cyan-400 shadow-lg shadow-cyan-950/50">
                  <LogIn className="h-7 w-7" />
                </div>

                <h3 className="mt-3 text-base font-bold text-zinc-100">
                  Vincular sua Conta Google ao Firebase
                </h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Conecte sua conta para garantir persistência na nuvem, segurança nas operações e sincronização das suas listas industriais.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    id="btn-link-google-account"
                    onClick={async () => {
                      await signInWithGoogle();
                    }}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-cyan-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-zinc-950 shadow-xl shadow-cyan-950/50 transition hover:bg-cyan-400 active:scale-98"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Vincular com Conta Google</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5 text-xs text-zinc-400 space-y-2">
                <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>Benefícios ao vincular a conta:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 pl-1">
                  <li>Sincronização em tempo real entre diferentes dispositivos</li>
                  <li>Backup contínuo no Google Cloud Firestore</li>
                  <li>Acesso seguro e proteção de dados</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>Firebase Authentication • Google Provider</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
