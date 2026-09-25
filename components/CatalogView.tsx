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
  Upload,
  CheckSquare,
  Square,
  AlertTriangle,
  AlertOctagon,
  X,
} from 'lucide-react';
import { ExcelCatalogImportModal } from './ExcelCatalogImportModal';

interface CatalogViewProps {
  catalog: CatalogItem[];
  settings: AppSettings;
  onOpenAddItemModal: () => void;
  onEditItem: (item: CatalogItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultipleItems?: (ids: string[]) => void;
  onClearAllItems?: () => void;
  onResetToDefault: () => void;
  onSaveCatalog?: (newCatalog: CatalogItem[]) => void;
  onSaveSettings?: (newSettings: AppSettings) => void;
}

type CatalogSortField = 'code' | 'description' | 'group' | 'unit' | 'cost' | 'weightBar';

export const CatalogView: React.FC<CatalogViewProps> = ({
  catalog,
  settings,
  onOpenAddItemModal,
  onEditItem,
  onDeleteItem,
  onDeleteMultipleItems,
  onClearAllItems,
  onResetToDefault,
  onSaveCatalog,
  onSaveSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [sortField, setSortField] = useState<CatalogSortField>('description');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Multi-selection & Bulk Deletion States
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);

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
    if (!Array.isArray(catalog)) return [];
    const q = (searchTerm || '').trim().toLowerCase();

    return catalog
      .filter((item) => {
        if (!item) return false;
        const desc = (item.description || '').toLowerCase();
        const cd = (item.code || '').toLowerCase();
        const grp = (item.group || '').toLowerCase();
        const nts = (item.notes || '').toLowerCase();

        const matchesSearch =
          !q ||
          desc.includes(q) ||
          cd.includes(q) ||
          grp.includes(q) ||
          nts.includes(q);

        const matchesGroup = selectedGroup === 'ALL' || item.group === selectedGroup;
        const matchesUnit = selectedUnit === 'ALL' || item.unit === selectedUnit;

        return matchesSearch && matchesGroup && matchesUnit;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'code') {
          valA = (a.code || '').toLowerCase();
          valB = (b.code || '').toLowerCase();
        } else if (sortField === 'description') {
          valA = (a.description || '').toLowerCase();
          valB = (b.description || '').toLowerCase();
        } else if (sortField === 'group') {
          valA = (a.group || '').toLowerCase();
          valB = (b.group || '').toLowerCase();
        } else if (sortField === 'unit') {
          valA = (a.unit || '').toLowerCase();
          valB = (b.unit || '').toLowerCase();
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

  // Multi-selection helpers
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllFilteredSelected = useMemo(() => {
    if (filteredAndSortedCatalog.length === 0) return false;
    return filteredAndSortedCatalog.every((item) => selectedItemIds.has(item.id));
  }, [filteredAndSortedCatalog, selectedItemIds]);

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        filteredAndSortedCatalog.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        filteredAndSortedCatalog.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };

  const handleConfirmDeleteSelected = () => {
    const idsToDelete = Array.from(selectedItemIds);
    if (idsToDelete.length === 0) return;

    if (onDeleteMultipleItems) {
      onDeleteMultipleItems(idsToDelete);
    } else if (onSaveCatalog) {
      const idsSet = new Set(idsToDelete);
      onSaveCatalog(catalog.filter((i) => !idsSet.has(i.id)));
    } else {
      idsToDelete.forEach((id) => onDeleteItem(id));
    }

    setSelectedItemIds(new Set());
    setShowDeleteSelectedModal(false);
  };

  const handleConfirmDeleteAll = () => {
    if (onClearAllItems) {
      onClearAllItems();
    } else if (onSaveCatalog) {
      onSaveCatalog([]);
    } else {
      catalog.forEach((item) => onDeleteItem(item.id));
    }

    setSelectedItemIds(new Set());
    setShowDeleteAllModal(false);
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

          {/* Import from Excel */}
          {onSaveCatalog && onSaveSettings && (
            <button
              id="btn-catalog-import-excel"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              title="Importar materiais de planilha Excel (.xlsx, .xls, .csv)"
            >
              <Upload className="h-4 w-4 text-emerald-400" />
              <span>Importar Excel</span>
            </button>
          )}

          {/* Delete All button */}
          <button
            id="btn-delete-all-catalog"
            onClick={() => setShowDeleteAllModal(true)}
            disabled={catalog.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/50 hover:text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Excluir todos os materiais cadastrados do catálogo"
          >
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span>Excluir Todos ({catalog.length})</span>
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

      {/* Bulk Selection Bar */}
      {selectedItemIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/70 via-zinc-950 to-zinc-950 p-3.5 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-100">
                {selectedItemIds.size} {selectedItemIds.size === 1 ? 'material selecionado' : 'materiais selecionados'}
              </span>
              <span className="text-[11px] text-zinc-400 ml-2">
                (de {catalog.length} cadastrados)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="rounded-xl border border-zinc-750 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              {isAllFilteredSelected
                ? 'Desmarcar Visíveis'
                : `Marcar Todos Visíveis (${filteredAndSortedCatalog.length})`}
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Limpar Seleção
            </button>

            <button
              type="button"
              id="btn-delete-selected-items"
              onClick={() => setShowDeleteSelectedModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-950/60 hover:bg-rose-500 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir Selecionados ({selectedItemIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Counter */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <span>
          Mostrando <strong className="text-zinc-200">{filteredAndSortedCatalog.length}</strong> de{' '}
          <strong className="text-zinc-200">{catalog.length}</strong> materiais cadastrados
          {selectedItemIds.size > 0 && (
            <span className="text-rose-400 font-semibold ml-2">
              • {selectedItemIds.size} selecionados
            </span>
          )}
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
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected && filteredAndSortedCatalog.length > 0}
                    onChange={toggleSelectAllFiltered}
                    title={isAllFilteredSelected ? 'Desmarcar todos os visíveis' : 'Selecionar todos os visíveis'}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-700 bg-zinc-800 accent-rose-500 transition"
                  />
                </th>
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
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    Nenhum material encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCatalog.map((item) => {
                  const isDeleting = deleteConfirmId === item.id;
                  const isSelected = selectedItemIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isSelected ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          aria-label={`Selecionar ${item.description}`}
                          className="h-4 w-4 cursor-pointer rounded border-zinc-700 bg-zinc-800 accent-rose-500 transition"
                        />
                      </td>

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

      {/* Modal: Confirm Delete Selected Items */}
      {showDeleteSelectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-100">
                  Excluir {selectedItemIds.size} {selectedItemIds.size === 1 ? 'material selecionado' : 'materiais selecionados'}?
                </h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Os seguintes materiais serão removidos do Catálogo Geral permanentemente:
                </p>

                {/* Selected Items Preview */}
                <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5">
                  {catalog
                    .filter((i) => selectedItemIds.has(i.id))
                    .slice(0, 8)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/60 last:border-0"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-300 shrink-0">
                            {item.code}
                          </span>
                          <span className="text-zinc-200 truncate">{item.description}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 shrink-0">{item.group}</span>
                      </div>
                    ))}
                  {selectedItemIds.size > 8 && (
                    <div className="text-center text-[11px] text-zinc-400 pt-1 italic">
                      + {selectedItemIds.size - 8} outros materiais selecionados...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedModal(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-selected"
                onClick={handleConfirmDeleteSelected}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/60 transition hover:bg-rose-500"
              >
                <Trash2 className="h-4 w-4" />
                <span>Sim, Excluir {selectedItemIds.size} {selectedItemIds.size === 1 ? 'Item' : 'Itens'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete ALL Catalog Items */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/50 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-100">
                  Excluir TODOS os {catalog.length} materiais do catálogo?
                </h3>
                <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                  Esta ação irá apagar <strong>todos os {catalog.length} itens</strong> atualmente cadastrados no Catálogo Geral de Materiais e Insumos.
                </p>
                <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300/90 leading-relaxed">
                  O catálogo ficará completamente vazio, pronto para receber sua própria planilha Excel limpa ou novos cadastros. Se precisar dos materiais de fábrica no futuro, você poderá restaurá-los a qualquer momento pelo botão &quot;Restaurar Banco&quot;.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-all-catalog"
                onClick={handleConfirmDeleteAll}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/60 transition hover:bg-rose-500"
              >
                <Trash2 className="h-4 w-4" />
                <span>Sim, Excluir Todos os {catalog.length} Materiais</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Catalog Import Modal */}
      {onSaveCatalog && onSaveSettings && (
        <ExcelCatalogImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          catalog={catalog}
          settings={settings}
          onSaveCatalog={onSaveCatalog}
          onSaveSettings={onSaveSettings}
        />
      )}
    </div>
  );
};
