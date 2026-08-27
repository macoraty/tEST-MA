'use client';

import React from 'react';
import { ActiveTab } from '@/lib/types';
import {
  ClipboardList,
  PlusCircle,
  Package,
  Settings,
  Layers,
  Wrench,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  listsCount: number;
  catalogCount: number;
  onOpenNewListModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  listsCount,
  catalogCount,
  onOpenNewListModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700/60 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-cyan-400 shadow-md">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-zinc-100 sm:text-lg">
                Lista<span className="text-cyan-400">Pro</span> Industrial
              </span>
              <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-zinc-400">
                v1.0
              </span>
            </div>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Gestão de Materiais, Insumos & Exportações
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Tab: Listas Geradas */}
          <button
            id="tab-btn-lists"
            onClick={() => setActiveTab('lists')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
              activeTab === 'lists'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden md:inline">Listas Geradas</span>
            <span className="md:hidden">Listas</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
                activeTab === 'lists'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {listsCount}
            </span>
          </button>

          {/* Action: Nova Lista */}
          <button
            id="btn-create-new-list-top"
            onClick={onOpenNewListModal}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
              activeTab === 'new-list'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm'
                : 'border border-emerald-600/40 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
            }`}
          >
            <PlusCircle className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Criar Nova Lista</span>
            <span className="sm:hidden">Criar</span>
          </button>

          {/* Tab: Catálogo */}
          <button
            id="tab-btn-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
              activeTab === 'catalog'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Package className="h-4 w-4" />
            <span className="hidden md:inline">Catálogo de Insumos</span>
            <span className="md:hidden">Itens</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
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
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:text-sm ${
              activeTab === 'settings'
                ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
            title="Configurações e Parâmetros"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden lg:inline">Configurações</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
