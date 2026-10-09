'use client';

import React, { useState, useMemo } from 'react';
import { MaterialList, AppSettings } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/exportUtils';
import {
  X,
  Search,
  Package,
  ClipboardList,
  Building2,
  Cog,
  Calendar,
  User,
  ArrowRight,
  PlusCircle,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface ImportBOMListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: MaterialList[];
  settings: AppSettings;
  onSelectList: (listId: string) => void;
  onOpenNewListModal?: () => void;
}

export const ImportBOMListModal: React.FC<ImportBOMListModalProps> = ({
  isOpen,
  onClose,
  lists,
  settings,
  onSelectList,
  onOpenNewListModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Unique machines for filtering
  const uniqueMachines = useMemo(() => {
    const set = new Set<string>();
    lists.forEach((l) => {
      if (l.machine) set.add(l.machine.trim());
    });
    return Array.from(set).sort();
  }, [lists]);

  // Filtered lists
  const filteredLists = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return lists.filter((list) => {
      if (selectedMachine !== 'ALL' && list.machine !== selectedMachine) {
        return false;
      }
      if (selectedStatus !== 'ALL' && list.status !== selectedStatus) {
        return false;
      }

      if (q) {
        const matchName = (list.name || '').toLowerCase().includes(q);
        const matchMachine = (list.machine || '').toLowerCase().includes(q);
        const matchClient = (list.client || '').toLowerCase().includes(q);
        const matchResp = (list.responsible || '').toLowerCase().includes(q);
        const matchNotes = (list.notes || '').toLowerCase().includes(q);
        const matchItems = list.items?.some(
          (it) =>
            (it.code || '').toLowerCase().includes(q) ||
            (it.description || '').toLowerCase().includes(q) ||
            (it.group || '').toLowerCase().includes(q)
        );

        if (!matchName && !matchMachine && !matchClient && !matchResp && !matchNotes && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [lists, searchTerm, selectedMachine, selectedStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col max-h-[92vh] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-inner">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                  Importar de Lista Pronta de Materiais
                </h2>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                  {lists.length} {lists.length === 1 ? 'lista' : 'listas'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Selecione uma lista de materiais (BOM) para transformá-la automaticamente em solicitação de insumos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="border-b border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome da lista, máquina, cliente ou insumo..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              {uniqueMachines.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <select
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-200 outline-none cursor-pointer max-w-[160px]"
                  >
                    <option value="ALL">Todas as Máquinas</option>
                    {uniqueMachines.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-200 outline-none cursor-pointer"
              >
                <option value="ALL">Todos os Status</option>
                <option value="Concluída">Concluída</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Aprovada">Aprovada</option>
                <option value="Rascunho">Rascunho</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Body: Lists Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredLists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400 mb-3">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">
                {lists.length === 0
                  ? 'Nenhuma lista de materiais cadastrada no momento'
                  : 'Nenhuma lista encontrada para a busca'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                {lists.length === 0
                  ? 'Crie listas na aba "Listas de Materiais" para que possam ser importadas e transformadas em solicitações de insumos.'
                  : 'Tente alterar os termos da pesquisa ou os filtros selecionados.'}
              </p>
              {lists.length === 0 && onOpenNewListModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewListModal();
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 shadow-md"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Criar Nova Lista de Materiais</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredLists.map((list) => {
                const totalCost = (list.items || []).reduce(
                  (acc, i) => acc + (Number(i.totalCost) || 0),
                  0
                );
                const itemsCount = list.items?.length || 0;

                return (
                  <div
                    key={list.id}
                    onClick={() => {
                      onClose();
                      onSelectList(list.id);
                    }}
                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm hover:border-amber-500/50 hover:bg-zinc-900/90 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          <Package className="h-3 w-3" />
                          BOM DE MATERIAIS
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            list.status === 'Concluída' || list.status === 'Aprovada'
                              ? 'border border-emerald-500/30 bg-emerald-950/50 text-emerald-400'
                              : 'border border-cyan-500/30 bg-cyan-950/50 text-cyan-400'
                          }`}
                        >
                          {list.status === 'Concluída' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {list.status}
                        </span>
                      </div>

                      {/* List Name */}
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                        {list.name}
                      </h3>

                      {/* Details row: Machine, Client, Date */}
                      <div className="mt-2.5 space-y-1 text-xs text-zinc-400">
                        {list.machine && (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Cog className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">
                              Máquina: <strong className="text-zinc-200">{list.machine}</strong>
                            </span>
                          </div>
                        )}

                        {list.client && (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Building2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            <span className="truncate">
                              Cliente: <strong className="text-zinc-200">{list.client}</strong>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(list.date)}</span>
                          </div>
                          {list.responsible && (
                            <div className="flex items-center gap-1 truncate max-w-[140px]">
                              <User className="h-3 w-3" />
                              <span className="truncate">{list.responsible}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Preview Chips */}
                      {list.items && list.items.length > 0 && (
                        <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 text-[11px] text-zinc-400">
                          <div className="font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                            <span>Insumos da Lista ({itemsCount}):</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {formatCurrency(totalCost, settings.currencySymbol)}
                            </span>
                          </div>
                          <div className="space-y-0.5 line-clamp-3">
                            {list.items.slice(0, 3).map((it, idx) => (
                              <div key={it.id || idx} className="truncate text-zinc-400">
                                • <strong className="text-zinc-200">{it.description}</strong>{' '}
                                <span className="text-zinc-500">
                                  ({it.quantity} {it.unit})
                                </span>
                              </div>
                            ))}
                            {list.items.length > 3 && (
                              <div className="text-[10px] text-cyan-400 font-semibold pt-0.5">
                                + {list.items.length - 3} outro(s) insumo(s)...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Button */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-500">
                        Clique para carregar
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all shadow-sm"
                      >
                        <span>Transformar em Solicitação</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/80 px-5 py-3 text-xs text-zinc-500">
          <span>
            Mostrando <strong>{filteredLists.length}</strong> de {lists.length} listas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
