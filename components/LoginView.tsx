'use client';

import React, { useState } from 'react';
import { useAppAuth } from '@/lib/authContext';
import { AppSettings, UserRole } from '@/lib/types';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Server,
  LogIn,
  AlertCircle,
  Layers,
  CheckCircle2,
  KeyRound,
  UserCheck,
  UserPlus,
  ArrowLeft,
  Mail,
} from 'lucide-react';

interface LoginViewProps {
  settings?: AppSettings;
}

export const LoginView: React.FC<LoginViewProps> = ({ settings }) => {
  const { login, addUser } = useAppAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('operador');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const appName = settings?.appName || 'ListaPro Industrial';
  const appLogo = settings?.appLogo;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe seu usuário e senha de acesso.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage('Ocorreu um erro ao tentar realizar o login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    const cleanUser = regUsername.trim().toLowerCase();
    const cleanEmail = regEmail.trim();
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();

    if (!cleanName || !cleanUser || !cleanPass) {
      setErrorMessage('Preencha seu nome completo, nome de usuário e a senha.');
      return;
    }

    if (cleanUser.length < 3) {
      setErrorMessage('O nome de usuário deve conter pelo menos 3 caracteres.');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMessage('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('A confirmação da senha não confere com a senha digitada.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const addResult = await addUser({
        name: cleanName,
        username: cleanUser,
        email: cleanEmail || undefined,
        role: regRole,
        password: cleanPass,
      });

      if (!addResult.success) {
        setErrorMessage(addResult.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Usuário cadastrado com sucesso! Entrando no sistema...');

      // Auto-login newly registered user
      setTimeout(async () => {
        try {
          await login(cleanUser, cleanPass);
        } catch {
          setMode('login');
          setUsername(cleanUser);
          setPassword(cleanPass);
          setSuccessMessage('Conta criada! Clique em Entrar no Sistema.');
          setIsSubmitting(false);
        }
      }, 700);
    } catch {
      setErrorMessage('Falha ao registrar o usuário. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-cyan-500 selection:text-zinc-950">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl -translate-y-24" />
        <div className="w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl translate-y-36" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/80 via-zinc-900 to-zinc-950 p-2 shadow-2xl shadow-cyan-950/60 mb-3.5 ring-1 ring-cyan-500/20">
            {appLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={appLogo}
                alt={appName}
                className="h-full w-full object-contain rounded-2xl"
              />
            ) : (
              <Layers className="h-8 w-8 text-cyan-400" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100">
            {appName}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Gestão Industrial de Listas de Materiais (BOM) & Insumos
          </p>

          {/* Database active indicator */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-mono text-emerald-300 shadow-sm">
            <Server className="h-3.5 w-3.5 text-emerald-400" />
            <span>Supabase Cloud DB Ativo</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/85 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                {mode === 'login' ? (
                  <span>Acesso ao Sistema</span>
                ) : (
                  <span>Cadastrar Novo Usuário</span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {mode === 'login'
                  ? 'Digite seu usuário e senha para entrar'
                  : 'Preencha os dados abaixo para criar sua conta'}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {mode === 'login' ? <KeyRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-300 animate-in fade-in duration-150">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="input-username"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Usuário ou E-mail:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="input-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: admin ou seu usuário"
                    autoComplete="username"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-password"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Senha de Acesso:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-11 py-3 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                    tabIndex={-1}
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-cyan-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-zinc-950 shadow-xl shadow-cyan-950/50 transition hover:bg-cyan-400 active:scale-98 disabled:opacity-50 mt-5 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>{isSubmitting ? 'Acessando...' : 'Entrar no Sistema'}</span>
              </button>

              {/* Botão para Cadastrar Novo Usuário */}
              <div className="pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  id="btn-open-register"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-zinc-700 bg-zinc-800/70 hover:bg-zinc-800 hover:border-cyan-500/40 px-4 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:text-cyan-300 transition shadow-md cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-cyan-400" />
                  <span>Cadastrar Novo Usuário</span>
                </button>
              </div>
            </form>
          ) : (
            /* MODE: REGISTER */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Nome Completo:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Nome de Usuário (Login):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-mono text-xs">
                    @
                  </div>
                  <input
                    id="reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Ex: carlos"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-4 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  E-mail (opcional):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Ex: carlos@empresa.com.br"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Seletor de Perfil / Nível de Acesso */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nível de Acesso / Perfil:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('operador')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      regRole === 'operador'
                        ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Operador</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Acesso a Listas & Insumos
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      regRole === 'admin'
                        ? 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Administrador</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Acesso Total + Configurações
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Senha de Acesso:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-11 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Confirmar Senha:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-4 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-register-submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-xs sm:text-sm font-bold text-zinc-950 shadow-xl shadow-cyan-950/50 transition hover:brightness-110 active:scale-98 disabled:opacity-50 mt-4 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? 'Cadastrando...' : 'Concluir Cadastro & Entrar'}</span>
              </button>

              <button
                type="button"
                id="btn-back-to-login"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition py-2 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Já possui uma conta? Voltar ao Login</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-zinc-500 space-y-1">
          <div>Sistema {appName} • Protegido por Controle de Acesso</div>
          <div className="text-[11px] font-mono text-zinc-600">
            Supabase: https://fmryrhumrecrmbvnidmk.supabase.co
          </div>
        </div>
      </div>
    </div>
  );
};
