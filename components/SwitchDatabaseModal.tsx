'use client';

import React, { useState } from 'react';
import { DatabaseProvider, SupabaseConfig } from '@/lib/types';
import {
  X,
  Database,
  Lock,
  Unlock,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Server,
  Flame,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface SwitchDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: DatabaseProvider;
  onExportBackup: () => void;
  onSwitchProvider: (
    newProvider: DatabaseProvider,
    options: { migrateData: boolean; backupConfirmed: boolean }
  ) => Promise<{ success: boolean; message: string }>;
  supabaseConfig: SupabaseConfig;
  onSaveSupabaseConfig: (config: SupabaseConfig) => void;
  testSupabase: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  supabaseSQL: string;
}

const SwitchDatabaseModalContent: React.FC<Omit<SwitchDatabaseModalProps, 'isOpen'>> = ({
  onClose,
  currentProvider,
  onExportBackup,
  onSwitchProvider,
  supabaseConfig,
  onSaveSupabaseConfig,
  testSupabase,
  supabaseSQL,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<DatabaseProvider>(
    currentProvider === 'firebase' ? 'supabase' : 'firebase'
  );
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [migrateData, setMigrateData] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Supabase form config
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig.anonKey || '');
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [showSQLScript, setShowSQLScript] = useState(false);

  const handleDownloadBackup = () => {
    onExportBackup();
    setBackupDownloaded(true);
  };

  const handleTestSupabaseConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, preencha a URL e a Chave Anon do Supabase para testar.',
      });
      return;
    }

    setTestingSupabase(true);
    setTestResult(null);
    try {
      const res = await testSupabase(supabaseUrl, supabaseAnonKey);
      setTestResult(res);
      if (res.success) {
        onSaveSupabaseConfig({
          url: supabaseUrl.trim(),
          anonKey: supabaseAnonKey.trim(),
          isConnected: true,
        });
      }
    } catch {
      setTestResult({ success: false, message: 'Erro ao verificar conexão com o Supabase.' });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleConfirmSwitch = async () => {
    if (!backupDownloaded) {
      alert('É obrigatório realizar o download do backup de segurança antes de prosseguir.');
      return;
    }

    if (selectedTarget === 'supabase' && (!supabaseUrl.trim() || !supabaseAnonKey.trim())) {
      setTestResult({
        success: false,
        message: 'Para usar o Supabase, preencha a URL e a Chave Anon antes de confirmar.',
      });
      return;
    }

    // Save supabase config if switching to supabase
    if (selectedTarget === 'supabase') {
      onSaveSupabaseConfig({
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim(),
        isConnected: true,
      });
    }

    setIsSwitching(true);
    try {
      const res = await onSwitchProvider(selectedTarget, {
        migrateData,
        backupConfirmed: true,
      });
      setSwitchFeedback(res);
      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSwitchFeedback({ success: false, message: msg });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(supabaseSQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 shadow-2xl shadow-cyan-950/40 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
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
        <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950 to-zinc-900 text-cyan-400 shadow-lg shadow-cyan-950/40">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 sm:text-xl flex items-center gap-2">
              <span>Provedor de Banco de Dados</span>
              <span className="rounded-md border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                Cloud DB
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Escolha entre Firebase Firestore e Supabase. Bloqueio automático até confirmação de backup.
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {switchFeedback && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
              switchFeedback.success
                ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : 'border border-red-500/40 bg-red-950/40 text-red-300'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{switchFeedback.message}</span>
          </div>
        )}

        {/* Body content */}
        <div className="mt-5 space-y-6">
          {/* COMPARISON OF DATABASE PROVIDERS */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
              1. Selecione o Provedor de Nuvem
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card Firebase */}
              <div
                onClick={() => {
                  if (currentProvider !== 'firebase') {
                    setSelectedTarget('firebase');
                  }
                }}
                className={`relative rounded-2xl border p-4 transition cursor-pointer ${
                  currentProvider === 'firebase'
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : selectedTarget === 'firebase'
                    ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                        <span>Google Firebase</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">Cloud Firestore NoSQL</div>
                    </div>
                  </div>

                  {currentProvider === 'firebase' ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      EM USO (ATIVO)
                    </span>
                  ) : (
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      Disponível
                    </span>
                  )}
                </div>

                <div className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
                  Banco em nuvem gerenciado pela Google Cloud, com regras ABAC, listeners em tempo real e autenticação Google.
                </div>
              </div>

              {/* Card Supabase */}
              <div
                onClick={() => {
                  if (currentProvider !== 'supabase') {
                    setSelectedTarget('supabase');
                  }
                }}
                className={`relative rounded-2xl border p-4 transition cursor-pointer ${
                  currentProvider === 'supabase'
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : selectedTarget === 'supabase'
                    ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                        <span>Supabase</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">PostgreSQL Cloud DB</div>
                    </div>
                  </div>

                  {currentProvider === 'supabase' ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      EM USO (ATIVO)
                    </span>
                  ) : (
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      Disponível
                    </span>
                  )}
                </div>

                <div className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
                  Banco relacional PostgreSQL em nuvem de código aberto com API REST instantânea, queries rápidas e suporte a JSONB.
                </div>
              </div>
            </div>
          </div>

          {/* SUPABASE CONFIGURATION FIELDS (If switching to or using Supabase) */}
          {(selectedTarget === 'supabase' || currentProvider === 'supabase') && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    Credenciais do Projeto Supabase
                  </span>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                >
                  <span>Painel Supabase</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Project URL (Supabase URL):
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    API Anon Key (Chave Pública):
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestSupabaseConnection}
                    disabled={testingSupabase}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition disabled:opacity-50"
                  >
                    {testingSupabase ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    <span>Testar Conexão Supabase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSQLScript(!showSQLScript)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                  >
                    {showSQLScript ? 'Ocultar Script SQL' : 'Ver Script SQL para Supabase'}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`rounded-xl p-3 text-xs ${
                      testResult.success
                        ? 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                        : 'border border-red-500/40 bg-red-950/30 text-red-300'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}

                {showSQLScript && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="font-semibold text-zinc-300">Script SQL para Criar Tabela:</span>
                      <button
                        type="button"
                        onClick={handleCopySQL}
                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                      >
                        {copiedSQL ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedSQL ? 'Copiado!' : 'Copiar SQL'}</span>
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[10px] font-mono text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      {supabaseSQL}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OBLIGATORY BACKUP GATE (ANTI-DATA-LOSS PROTECTION) */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-zinc-900/40 to-zinc-900/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-100">
                    Trava de Segurança: Backup Obrigatório
                  </h3>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 uppercase tracking-wider">
                    Regra Ativa
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                  Para alternar entre <strong>{currentProvider.toUpperCase()}</strong> e{' '}
                  <strong>{selectedTarget.toUpperCase()}</strong> com segurança absoluta e sem risco de
                  perda de materiais ou listas, o sistema exige que você gere e baixe uma cópia de
                  segurança antes de liberar a mudança.
                </p>

                {/* Step 1: Download Backup */}
                <div className="mt-4">
                  <button
                    type="button"
                    id="btn-download-safety-backup"
                    onClick={handleDownloadBackup}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-lg ${
                      backupDownloaded
                        ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                        : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                    }`}
                  >
                    {backupDownloaded ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {backupDownloaded
                        ? '✓ Backup de Segurança Baixado com Sucesso'
                        : '1. Baixar Backup de Segurança (.JSON)'}
                    </span>
                  </button>

                  {backupDownloaded && (
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Arquivo salvo no seu computador. A troca de banco foi desbloqueada!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Confirmation & Migration checkbox */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={migrateData}
                onChange={(e) => setMigrateData(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="font-medium">
                Migrar automaticamente os dados atuais (catálogo, listas e requisições) para o novo banco selecionado.
              </span>
            </label>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                {backupDownloaded ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Unlock className="h-4 w-4" />
                    Desbloqueado para mudança
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Lock className="h-4 w-4" />
                    Bloqueado (Complete o Passo 1)
                  </span>
                )}
              </div>

              <button
                type="button"
                id="btn-confirm-switch-database"
                disabled={!backupDownloaded || isSwitching}
                onClick={handleConfirmSwitch}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition shadow-xl ${
                  backupDownloaded
                    ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:scale-98 cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                }`}
              >
                {isSwitching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Migrando e Alternando...</span>
                  </>
                ) : (
                  <>
                    <span>2. Mudar para {selectedTarget === 'supabase' ? 'Supabase' : 'Firebase'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>Banco Atual: {currentProvider.toUpperCase()}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export const SwitchDatabaseModal: React.FC<SwitchDatabaseModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <SwitchDatabaseModalContent {...props} />;
};
