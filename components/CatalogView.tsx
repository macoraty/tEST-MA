'use client';

import React, { useState, useMemo } from 'react';
import { CatalogItem, AppSettings, SortOrder } from '@/lib/types';
import { exportCatalogToExcel, formatCurrency } from '@/lib/exportUtils';
import {
  Search,
  PlusCircle,
  FileSpreadsheet,
  RotateCcw,
  Edit2,
  Trash2,
  Package,
  Layers,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  DollarSign,
  Scale,
  Check,
} from 'lucide-react';

interface CatalogViewProps {
  catalog: CatalogItem[];
  settings: AppSettings;
  onOpenAddItemModal: () => void;
  onEditItem: (item: CatalogItem) => void;
  onDeleteItem: (id: string) => void;
  onResetToDefault: () => void;
}

type CatalogSortField = 'code' | 'description' | 'group' | 'unit' | 'cost' | 'weightBar';

export const CatalogView: React.FC<CatalogViewProps> = ({
  catalog,
  settings,
  onOpenAddItemModal,
  onEditItem,
  onDeleteItem,
  onResetToDefault,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [sortField, setSortField] = useState<CatalogSortField>('description');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sorting helper
  const handleSort = (field: CatalogSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted catalog items
  const filteredAndSortedCatalog = useMemo(() => {
    return catalog
      .filter((item) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !q ||
          item.description.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q));

        const matchesGroup = selectedGroup === 'ALL' || item.group === selectedGroup;
        const matchesUnit = selectedUnit === 'ALL' || item.unit === selectedUnit;

        return matchesSearch && matchesGroup && matchesUnit;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'code') {
          valA = a.code.toLowerCase();
          valB = b.code.toLowerCase();
        } else if (sortField === 'description') {
          valA = a.description.toLowerCase();
          valB = b.description.toLowerCase();
        } else if (sortField === 'group') {
          valA = a.group.toLowerCase();
          valB = b.group.toLowerCase();
        } else if (sortField === 'unit') {
          valA = a.unit.toLowerCase();
          valB = b.unit.toLowerCase();
        } else if (sortField === 'cost') {
          valA = Number(a.cost) || 0;
          valB = Number(b.cost) || 0;
        } else if (sortField === 'weightBar') {
          valA = Number(a.weightBar) || 0;
          valB = Number(b.weightBar) || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [catalog, searchTerm, selectedGroup, selectedUnit, sortField, sortOrder]);

  const renderSortIndicator = (field: CatalogSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-zinc-600 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-cyan-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-cyan-400" />
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Title & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
            Catálogo Geral de Materiais & Insumos
          </h1>
          <p className="text-xs text-zinc-400">
            Base de dados com itens pré-carregados da indústria. Adicione, edite ou exporte para controle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Excel */}
          <button
            onClick={() => exportCatalogToExcel(catalog, settings)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-900/50"
            title="Exportar todo o catálogo para Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar Excel</span>
          </button>

          {/* Reset button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            title="Restaurar banco original com 300+ itens da PDF"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restaurar Banco</span>
          </button>

          {/* Add Item Button */}
          <button
            id="btn-add-new-catalog-item"
            onClick={onOpenAddItemModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-950/40 transition hover:from-cyan-400 hover:to-blue-500"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Novo Item</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      {showResetConfirm && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-amber-300">
                Deseja restaurar o banco de dados original do catálogo?
              </h4>
              <p className="mt-1 text-zinc-300">
                Isso recarregará todos os itens originais das 15 páginas da PDF (Correntes, Parafusos, Mancais, Rolamentos, Tubos, Vigas, Motores, Pneumática).
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onResetToDefault();
                  setShowResetConfirm(false);
                }}
                className="rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-zinc-950 hover:bg-amber-500"
              >
                Sim, Restaurar
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
        {/* Search text */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            id="input-search-catalog"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por código, descrição, grupo... (ex: 6204, ASA, TUBO, M10)"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2 text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter by Group */}
        <div>
          <select
            id="filter-catalog-group"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 outline-none transition focus:border-cyan-500"
          >
            <option value="ALL">Todos os Grupos / Categorias</option>
            {settings.groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Unit */}
        <div>
          <select
            id="filter-catalog-unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 outline-none transition focus:border-cyan-500"
          >
            <option value="ALL">Todas as Unidades</option>
            {settings.units.map((u) => (
              <option key={u} value={u}>
                Unidade: {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <span>
          Mostrando <strong className="text-zinc-200">{filteredAndSortedCatalog.length}</strong> de{' '}
          {catalog.length} materiais cadastrados
        </span>
        <div className="flex items-center gap-1">
          <span>Ordenado por:</span>
          <span className="font-semibold text-cyan-400">
            {sortField === 'code' && 'Código'}
            {sortField === 'description' && 'Descrição'}
            {sortField === 'group' && 'Grupo'}
            {sortField === 'unit' && 'Unidade'}
            {sortField === 'cost' && 'Custo Base'}
            {sortField === 'weightBar' && 'Peso Referência'}
          </span>
          <span className="text-zinc-500">({sortOrder === 'asc' ? 'Crescente ↑' : 'Decrescente ↓'})</span>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400">
              <tr>
                <th
                  onClick={() => handleSort('code')}
                  className="w-32 cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Código</span>
                    {renderSortIndicator('code')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('description')}
                  className="cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Descrição do Material / Insumo</span>
                    {renderSortIndicator('description')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('group')}
                  className="cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Grupo / Categoria</span>
                    {renderSortIndicator('group')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unit')}
                  className="w-20 cursor-pointer px-3 py-3 text-center font-semibold transition hover:text-zinc-100"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Unid.</span>
                    {renderSortIndicator('unit')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('weightBar')}
                  className="w-28 cursor-pointer px-3 py-3 text-right font-semibold transition hover:text-zinc-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Peso Ref. (kg)</span>
                    {renderSortIndicator('weightBar')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cost')}
                  className="w-32 cursor-pointer px-4 py-3 text-right font-semibold transition hover:text-zinc-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Custo Base ({settings.currencySymbol})</span>
                    {renderSortIndicator('cost')}
                  </div>
                </th>
                <th className="w-24 px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredAndSortedCatalog.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Nenhum material encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCatalog.map((item) => {
                  const isDeleting = deleteConfirmId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-zinc-900/50"
                    >
                      {/* Code */}
                      <td className="px-4 py-3 font-mono font-medium text-zinc-400 group-hover:text-cyan-300">
                        {item.code}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-zinc-100">
                          {item.description}
                        </span>
                        {item.notes && (
                          <div className="text-[11px] text-zinc-400">{item.notes}</div>
                        )}
                      </td>

                      {/* Group */}
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-zinc-800/90 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                          {item.group}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="px-3 py-3 text-center font-bold text-zinc-300">
                        <span className="rounded bg-cyan-950/50 px-2 py-0.5 text-cyan-400">
                          {item.unit}
                        </span>
                      </td>

                      {/* Weight */}
                      <td className="px-3 py-3 text-right font-mono text-zinc-300">
                        {item.weightBar > 0 ? `${item.weightBar} kg` : '-'}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 text-right font-mono">
                        {item.cost > 0 ? (
                          <span className="font-semibold text-emerald-400">
                            {formatCurrency(item.cost, settings.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditItem(item)}
                              title="Editar este material"
                              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-cyan-950/60 hover:text-cyan-300"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              title="Excluir este material"
                              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
