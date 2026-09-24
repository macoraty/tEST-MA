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
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  listsCount: number;
  catalogCount: number;
  requisitionsCount: number;
  pendingRequisitionsCount?: number;
  onOpenNewListModal: () => void;
  onOpenNewRequisitionModal: () => void;
  onExportBackup?: () => void;
  settings?: AppSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  listsCount,
  catalogCount,
  requisitionsCount,
  pendingRequisitionsCount = 0,
  onOpenNewListModal,
  onOpenNewRequisitionModal,
  onExportBackup,
  settings,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuDrawerRef = useRef<HTMLDivElement>(null);

  const appName = settings?.appName?.trim() || 'ListaPro Industrial';
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Menu Toggle & Brand / Logo */}
          <div className="flex items-center gap-3">
            {/* Primary Menu Toggle Button */}
            <button
              id="main-menu-toggle-btn"
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs font-bold text-zinc-200 shadow-sm transition-all hover:border-cyan-500/50 hover:bg-zinc-800 hover:text-cyan-400 active:scale-95"
              title="Abrir Menu Principal"
              aria-label="Abrir Menu Principal"
            >
              <Menu className="h-4 w-4 text-cyan-400" />
              <span className="font-semibold tracking-wide">Menu</span>
            </button>

            {/* Brand Logo & Title */}
            <div
              onClick={() => handleSelectTab('lists')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              {appLogo ? (
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-cyan-500/40 bg-zinc-900/90 p-1 shadow-md shadow-cyan-950/50 transition-transform group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={appLogo}
                    alt={appName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950 via-zinc-900 to-zinc-950 text-cyan-400 shadow-md shadow-cyan-950/50 transition-transform group-hover:scale-105">
                  <span className="font-mono text-lg font-black tracking-tight text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                    M
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-zinc-100 text-sm sm:text-base">
                    {appName === 'ListaPro Industrial' ? (
                      <>
                        Lista<span className="text-cyan-400">Pro</span> Industrial
                      </>
                    ) : (
                      appName
                    )}
                  </span>
                  <span className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.2 text-[9px] font-mono text-zinc-400">
                    v1.2
                  </span>
                </div>
                <p className="hidden text-[11px] text-zinc-400 md:block">
                  Materiais, Insumos & Requisições
                </p>
              </div>
            </div>
          </div>

          {/* Center / Right: Quick Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Tab: Listas Geradas */}
            <button
              id="tab-btn-lists"
              onClick={() => handleSelectTab('lists')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:py-2 sm:text-sm ${
                activeTab === 'lists'
                  ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Listas</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] sm:text-[11px] font-bold ${
                  activeTab === 'lists'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {listsCount}
              </span>
            </button>

            {/* Tab: Solicitação de Insumos (NOVA PÁGINA) */}
            <button
              id="tab-btn-requisitions"
              onClick={() => handleSelectTab('requisitions')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:py-2 sm:text-sm ${
                activeTab === 'requisitions'
                  ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Solicitações</span>
              <span className="sm:hidden">Insumos</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] sm:text-[11px] font-bold ${
                  pendingRequisitionsCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : activeTab === 'requisitions'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {requisitionsCount}
              </span>
            </button>

            {/* Tab: Catálogo */}
            <button
              id="tab-btn-catalog"
              onClick={() => handleSelectTab('catalog')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:py-2 sm:text-sm ${
                activeTab === 'catalog'
                  ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Catálogo</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] sm:text-[11px] font-bold ${
                  activeTab === 'catalog'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {catalogCount}
              </span>
            </button>

            {/* Tab: Configurações */}
            <button
              id="tab-btn-settings"
              onClick={() => handleSelectTab('settings')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:py-2 sm:text-sm ${
                activeTab === 'settings'
                  ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
              title="Configurações e Parâmetros"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Configurações</span>
            </button>

            {/* Action: Nova Lista */}
            <button
              id="btn-create-new-list-top"
              onClick={onOpenNewListModal}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all sm:px-3 sm:py-2 sm:text-sm ${
                activeTab === 'new-list'
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm'
                  : 'border border-emerald-600/40 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
              }`}
            >
              <PlusCircle className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Nova Lista</span>
              <span className="sm:hidden">+ Lista</span>
            </button>
          </nav>
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

              {/* Section 2: Ações Rápidas */}
              <div>
                <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Ações Rápidas
                </div>
                <div className="space-y-2">
                  {/* Nova Solicitação de Insumos */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenNewRequisitionModal();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    <PlusCircle className="h-5 w-5 text-cyan-400" />
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
                <div className="mt-2 text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2">
                  Sistema {appName} • Armazenamento Local Seguro
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
