'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleResetData = () => {
    try {
      localStorage.removeItem('industrial_catalog_items_v1');
      localStorage.removeItem('industrial_material_lists_v1');
      window.location.reload();
    } catch (e) {
      console.error('Error clearing data:', e);
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-zinc-900/90 p-6 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/50 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="text-lg font-bold text-zinc-100">
              Recuperação do Sistema de Materiais
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Ocorreu uma inconsistência ao processar os dados cadastrados. Você pode tentar recarregar ou restaurar a integridade do banco sem perder as configurações.
            </p>

            {this.state.error?.message && (
              <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-2.5 text-left font-mono text-[11px] text-rose-300 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md transition hover:bg-cyan-400"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recarregar Sistema</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetData}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restaurar Banco Padrão</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
