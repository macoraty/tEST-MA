'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, AppSettings } from '@/lib/types';
import {
  ClipboardList,
  PlusCircle,
  Package,
  Settings,
  Menu,
  X,
  FileText,
  Download,
  Building2,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  UserCheck,
  Server,
  Lock,
  Sun,
  Moon,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAppAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  listsCount: number;
  catalogCount: number;
  requisitionsCount: number;
  completedRequisitionsCount?: number;
  currentRequisitionsSubTab?: 'active' | 'completed' | 'import-bom';
  onSelectRequisitionsSubTab?: (subTab: 'active' | 'completed' | 'import-bom') => void;
  partnersCount?: number;
  pendingRequisitionsCount?: number;
  onOpenNewListModal: () => void;
  onOpenNewRequisitionModal: () => void;
  onOpenNewPartnerModal?: () => void;
  onExportBackup?: () => void;
  settings?: AppSettings;
  syncStatus?: 'synced' | 'syncing' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  listsCount,
  catalogCount,
  requisitionsCount,
  completedRequisitionsCount = 0,
  currentRequisitionsSubTab = 'active',
  onSelectRequisitionsSubTab,
  partnersCount = 0,
  pendingRequisitionsCount = 0,
  onOpenNewListModal,
  onOpenNewRequisitionModal,
  onOpenNewPartnerModal,
  onExportBackup,
  settings,
  syncStatus = 'synced',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, isAdmin, logout } = useAppAuth();
  const { isDark, toggleTheme } = useTheme();
  const menuDrawerRef = useRef<HTMLDivElement>(null);

  const appName = settings?.appName?.trim() || 'Maikmaq System';
  const appLogo = settings?.appLogo;

  // Close menu on click outside or escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsMenuOpen(false);
    }
    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-1.5 sm:gap-3 px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5">
          {/* Left: Menu Toggle & Clean Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Primary Menu Toggle Button */}
            <button
              id="main-menu-toggle-btn"
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-200 shadow-sm transition-all hover:border-cyan-500/50 hover:bg-zinc-800 hover:text-cyan-400 active:scale-95 cursor-pointer shrink-0"
              title="Abrir Menu Principal"
              aria-label="Abrir Menu Principal"
            >
              <Menu className="h-4 w-4 text-cyan-400" />
              <span className="font-semibold tracking-wide hidden sm:inline">Menu</span>
            </button>

            {/* Brand Logo & Title */}
            <div
              onClick={() => handleSelectTab('lists')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
            >
              {appLogo ? (
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center overflow-hidden rounded-xl border border-cyan-500/40 bg-zinc-900/90 p-1 shadow-md shadow-cyan-950/50 transition-transform group-hover:scale-105 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={appLogo}
                    alt={appName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950 via-zinc-900 to-zinc-950 text-cyan-400 shadow-md shadow-cyan-950/50 transition-transform group-hover:scale-105 shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                    MS
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-zinc-100 text-xs sm:text-sm md:text-base whitespace-nowrap">
                  {appName === 'Maikmaq System' || appName === 'ListaPro Industrial' || !appName ? (
                    <>
                      Maikmaq <span className="text-cyan-400">System</span>
                    </>
                  ) : (
                    appName
                  )}
                </span>
                <span className="hidden 2xl:inline text-[10px] text-zinc-500 font-medium">
                  Materiais, Insumos & Requisições
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs & Right Action Bar */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2.5 min-w-0 flex-1 justify-end">
            <nav className="flex items-center gap-1 lg:gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink">
              {/* Tab: Listas */}
              <button
                id="tab-btn-lists"
                onClick={() => handleSelectTab('lists')}
                className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'lists'
                    ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span>Listas</span>
                <span className="ml-0.5 text-[11px] font-mono opacity-80 font-bold">
                  {listsCount}
                </span>
              </button>

              {/* Tab: Solicitações em Aberto */}
              <button
                id="tab-btn-requisitions"
                onClick={() => {
                  handleSelectTab('requisitions');
                  onSelectRequisitionsSubTab?.('active');
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'requisitions' && currentRequisitionsSubTab !== 'completed'
                    ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                title="Solicitações de Insumos em Aberto"
              >
                <FileText className="h-4 w-4 text-cyan-400" />
                <span>Solicitações</span>
                <span className="ml-0.5 text-[11px] font-mono opacity-80 font-bold">
                  {requisitionsCount}
                </span>
                {pendingRequisitionsCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse ml-0.5" title={`${pendingRequisitionsCount} pendente(s)`} />
                )}
              </button>

              {/* Tab: Pedidos Concluídos */}
              <button
                id="tab-btn-completed-orders"
                onClick={() => {
                  handleSelectTab('requisitions');
                  onSelectRequisitionsSubTab?.('completed');
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'requisitions' && currentRequisitionsSubTab === 'completed'
                    ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                title="Histórico de Pedidos Concluídos"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="hidden 2xl:inline">Pedidos Concluídos</span>
                <span className="inline 2xl:hidden">Concluídos</span>
                <span className="ml-0.5 text-[11px] font-mono opacity-80 font-bold">
                  {completedRequisitionsCount}
                </span>
              </button>

              {/* Tab: Catálogo */}
              <button
                id="tab-btn-catalog"
                onClick={() => handleSelectTab('catalog')}
                className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'catalog'
                    ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Catálogo</span>
                <span className="ml-0.5 text-[11px] font-mono opacity-80 font-bold">
                  {catalogCount}
                </span>
              </button>

              {/* Tab: Fornecedores & Clientes */}
              <button
                id="tab-btn-partners"
                onClick={() => handleSelectTab('partners')}
                className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'partners'
                    ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Users className="h-4 w-4 text-cyan-400" />
                <span>Parceiros</span>
                <span className="ml-0.5 text-[11px] font-mono opacity-80 font-bold">
                  {partnersCount}
                </span>
              </button>

              {/* Tab: Configurações */}
              <button
                id="tab-btn-settings"
                onClick={() => handleSelectTab('settings')}
                className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                title={isAdmin ? 'Configurações e Parâmetros (Acesso Total)' : 'Configurações (Apenas Administrador)'}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden xl:inline">Configurações</span>
                <span className="inline xl:hidden">Config</span>
                {!isAdmin && <Lock className="h-3 w-3 text-amber-400/80" />}
              </button>
            </nav>

            <div className="h-5 w-px bg-zinc-800 shrink-0" />

            {/* Right Controls: User Avatar & New List Action */}
            <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
              {/* Primary Action Button: Nova Lista */}
              <button
                id="btn-create-new-list-top"
                onClick={onOpenNewListModal}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/90 hover:bg-emerald-600 px-2 lg:px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="Criar nova lista de materiais"
              >
                <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xl:inline">Nova Lista</span>
                <span className="inline xl:hidden">Nova Lista</span>
              </button>

              {/* Compact User Menu Button */}
              {currentUser && (
                <button
                  type="button"
                  id="btn-user-avatar-header"
                  onClick={() => setIsMenuOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 py-1 px-2 text-xs text-zinc-300 hover:border-cyan-500/40 transition cursor-pointer shrink-0"
                  title={`Usuário: ${currentUser.name} (${isAdmin ? 'Administrador' : 'Operador'}) - Clique para abrir o menu`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold text-[11px] border shrink-0 ${
                      isAdmin
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {currentUser.name[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden xl:inline font-medium text-zinc-200 truncate max-w-[80px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Right Controls: Fast Clean Action & Menu Avatar */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <button
              id="btn-mobile-new-list-header"
              onClick={onOpenNewListModal}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 shrink-0"
              title="Nova Lista"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Nova</span>
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold border shrink-0 ${
                  isAdmin
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                }`}
                title={`${currentUser.name} (${isAdmin ? 'Admin' : 'Operador'})`}
              >
                {currentUser.name[0]?.toUpperCase() || 'U'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Sub-Navbar Tabs: Always accessible, horizontally scrollable */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto no-scrollbar px-3 py-1.5 border-t border-zinc-850/80 bg-zinc-950/95">
          <button
            onClick={() => handleSelectTab('lists')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'lists'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Listas</span>
            <span className="text-[10px] font-mono opacity-80 font-bold ml-0.5">({listsCount})</span>
          </button>

          <button
            onClick={() => handleSelectTab('requisitions')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'requisitions'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span>Solicitações</span>
            <span className="text-[10px] font-mono opacity-80 font-bold ml-0.5">({requisitionsCount})</span>
          </button>

          <button
            onClick={() => handleSelectTab('catalog')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Catálogo</span>
            <span className="text-[10px] font-mono opacity-80 font-bold ml-0.5">({catalogCount})</span>
          </button>

          <button
            onClick={() => handleSelectTab('partners')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'partners'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>Parceiros</span>
            <span className="text-[10px] font-mono opacity-80 font-bold ml-0.5">({partnersCount})</span>
          </button>

          <button
            onClick={() => handleSelectTab('settings')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Configurações</span>
          </button>
        </div>
      </header>

      {/* Slide-over Side Drawer Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div
            ref={menuDrawerRef}
            className="relative z-10 flex w-full max-w-sm flex-col bg-zinc-900 border-r border-zinc-800 shadow-2xl transition-transform animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    Menu do Sistema
                  </h2>
                  <p className="text-xs text-zinc-400">Navegação e Atalhos Rápidos</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Modo Claro / Escuro (Theme Toggle dentro do Menu) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                        isDark
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                      }`}
                    >
                      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-100">
                        Tema da Interface
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {isDark ? 'Modo Escuro ativado' : 'Modo Claro ativado'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segmented Switch: Claro e Escuro */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                  <button
                    type="button"
                    id="btn-drawer-theme-light"
                    onClick={() => {
                      if (isDark) toggleTheme();
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isDark
                        ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Sun className={`h-4 w-4 ${!isDark ? 'text-amber-500' : 'text-zinc-400'}`} />
                    <span>Modo Claro</span>
                  </button>

                  <button
                    type="button"
                    id="btn-drawer-theme-dark"
                    onClick={() => {
                      if (!isDark) toggleTheme();
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 text-cyan-300 shadow-sm border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Moon className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    <span>Modo Escuro</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Páginas Principais */}
              <div>
                <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Páginas do Sistema
                </div>
                <div className="space-y-1">
                  {/* Listas de Materiais */}
                  <button
                    onClick={() => handleSelectTab('lists')}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'lists'
                        ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-cyan-400" />
                      <div className="text-left">
                        <div>Listas de Materiais (BOM)</div>
                        <div className="text-[11px] font-normal text-zinc-400">
                          Engenharia, máquinas e orçamentos
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                      {listsCount}
                    </span>
                  </button>

                  {/* Solicitação de Insumos */}
                  <button
                    onClick={() => handleSelectTab('requisitions')}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'requisitions'
                        ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-amber-400" />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span>Solicitação de Insumos</span>
                          {pendingRequisitionsCount > 0 && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300 border border-amber-500/30">
                              {pendingRequisitionsCount} pendente(s)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-normal text-zinc-400">
                          Requisições p/ compras e almoxarifado
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                      {requisitionsCount}
                    </span>
                  </button>

                  {/* Pedidos Concluídos */}
                  <button
                    id="menu-btn-completed-orders"
                    onClick={() => {
                      handleSelectTab('requisitions');
                      onSelectRequisitionsSubTab?.('completed');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'requisitions' && currentRequisitionsSubTab === 'completed'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span>Pedidos Concluídos</span>
                        </div>
                        <div className="text-[11px] font-normal text-zinc-400">
                          Histórico de pedidos de insumos finalizados
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold">
                      {completedRequisitionsCount}
                    </span>
                  </button>

                  {/* Catálogo de Insumos */}
                  <button
                    onClick={() => handleSelectTab('catalog')}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'catalog'
                        ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-purple-400" />
                      <div className="text-left">
                        <div>Catálogo Geral de Itens</div>
                        <div className="text-[11px] font-normal text-zinc-400">
                          Preços, pesos, códigos e unidades
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                      {catalogCount}
                    </span>
                  </button>

                  {/* Fornecedores & Clientes */}
                  <button
                    id="menu-btn-partners"
                    onClick={() => handleSelectTab('partners')}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'partners'
                        ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-cyan-400" />
                      <div className="text-left">
                        <div>Fornecedores & Clientes</div>
                        <div className="text-[11px] font-normal text-zinc-400">
                          Cadastros comerciais, contatos e WhatsApp
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                      {partnersCount}
                    </span>
                  </button>

                  {/* Configurações */}
                  <button
                    onClick={() => handleSelectTab('settings')}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'settings'
                        ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-zinc-400" />
                      <div className="text-left">
                        <div>Configurações & Parâmetros</div>
                        <div className="text-[11px] font-normal text-zinc-400">
                          Logo, dados da empresa, PDF e backups
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Section: Usuário Autenticado */}
              {currentUser && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Sessão Ativa
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAdmin
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isAdmin ? 'ADMINISTRADOR' : 'OPERADOR'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm border ${
                          isAdmin
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {currentUser.name[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="truncate text-xs font-bold text-zinc-200">
                          {currentUser.name}
                        </div>
                        <div className="truncate text-[10px] text-zinc-400">
                          Login: @{currentUser.username}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-400" />
                      <span>Sair da Conta (Logout)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Section 2: Ações Rápidas */}
              <div>
                <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Ações Rápidas
                </div>
                <div className="space-y-2">
                  {/* Cadastrar Fornecedor ou Cliente */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onOpenNewPartnerModal) {
                        onOpenNewPartnerModal();
                      } else {
                        handleSelectTab('partners');
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    <PlusCircle className="h-5 w-5 text-cyan-400" />
                    <span>cadastrar fornecedor ou cliente</span>
                  </button>

                  {/* Nova Solicitação de Insumos */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenNewRequisitionModal();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    <PlusCircle className="h-5 w-5 text-amber-400" />
                    <span>Nova Solicitação de Insumos</span>
                  </button>

                  {/* Criar Nova Lista */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenNewListModal();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  >
                    <PlusCircle className="h-5 w-5 text-emerald-400" />
                    <span>Criar Nova Lista de Materiais</span>
                  </button>

                  {/* Exportar Backup */}
                  {onExportBackup && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onExportBackup();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <Download className="h-5 w-5 text-zinc-400" />
                      <span>Baixar Backup Completo (.JSON)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 3: Empresa / Metadados */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2 font-bold text-zinc-200 mb-1">
                  <Building2 className="h-4 w-4 text-cyan-400" />
                  <span>{settings?.companyName || 'Empresa Cadastrada'}</span>
                </div>
                {settings?.companyCnpj && (
                  <div>CNPJ: {settings.companyCnpj}</div>
                )}
                {settings?.defaultResponsible && (
                  <div>Responsável Padrão: {settings.defaultResponsible}</div>
                )}
                <div className="mt-2 text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2 flex items-center justify-between">
                  <span>Sistema {appName}</span>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Supabase Cloud DB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed bottom for phone usability) */}
      <nav
        aria-label="Navegação Inferior Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-zinc-800 bg-zinc-950/95 px-2 py-1.5 backdrop-blur-xl md:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.6)]"
      >
        {/* Tab 1: Listas */}
        <button
          type="button"
          onClick={() => handleSelectTab('lists')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            activeTab === 'lists' || activeTab === 'new-list'
              ? 'text-cyan-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <ClipboardList className="h-5 w-5" />
            {listsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-800 px-1 text-[9px] font-mono font-bold text-zinc-200 border border-zinc-700">
                {listsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Listas</span>
        </button>

        {/* Tab 2: Insumos (Solicitações) */}
        <button
          type="button"
          onClick={() => handleSelectTab('requisitions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            activeTab === 'requisitions'
              ? 'text-cyan-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <FileText className="h-5 w-5" />
            {pendingRequisitionsCount > 0 ? (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 text-zinc-950 px-1 text-[9px] font-mono font-bold animate-pulse">
                {pendingRequisitionsCount}
              </span>
            ) : requisitionsCount > 0 ? (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-800 px-1 text-[9px] font-mono font-bold text-zinc-200 border border-zinc-700">
                {requisitionsCount}
              </span>
            ) : null}
          </div>
          <span className="text-[10px] mt-1 font-medium">Insumos</span>
        </button>

        {/* Tab 3: Center Action (+ Nova Lista) */}
        <button
          type="button"
          onClick={onOpenNewListModal}
          className="flex flex-col items-center justify-center -translate-y-2 group"
          title="Criar Nova Lista"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-zinc-950 shadow-lg shadow-cyan-950/80 transition transform group-active:scale-95 ring-4 ring-zinc-950">
            <PlusCircle className="h-6 w-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-cyan-300">Nova</span>
        </button>

        {/* Tab 4: Catálogo */}
        <button
          type="button"
          onClick={() => handleSelectTab('catalog')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            activeTab === 'catalog'
              ? 'text-cyan-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Package className="h-5 w-5" />
            {catalogCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-800 px-1 text-[9px] font-mono font-bold text-zinc-200 border border-zinc-700">
                {catalogCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Catálogo</span>
        </button>

        {/* Tab 5: Configurações */}
        <button
          type="button"
          onClick={() => handleSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            activeTab === 'settings'
              ? 'text-cyan-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Settings className="h-5 w-5" />
            {!isAdmin && (
              <span className="absolute -top-1 -right-1 text-amber-400">
                <Lock className="h-3 w-3" />
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Ajustes</span>
        </button>
      </nav>
    </>
  );
};
