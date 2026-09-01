'use client';

import React, { useState, useMemo, useRef } from 'react';
import { MaterialList, MaterialListItem, CatalogItem, AppSettings, SortOrder } from '@/lib/types';
import { formatCurrency, formatDate, exportListToExcel, exportListToPDF } from '@/lib/exportUtils';
import {
  Search,
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Eye,
  ArrowLeft,
  Edit2,
  Check,
  ChevronDown,
  Building2,
  Cog,
  Layers,
  Scale,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { ListPreviewModal } from '@/components/ListPreviewModal';

interface ListEditorProps {
  list: MaterialList;
  catalog: CatalogItem[];
  settings: AppSettings;
  onSaveList: (updatedList: MaterialList) => void;
  onBackToLists: () => void;
  onEditHeader: () => void;
  onOpenWhatsApp: (list: MaterialList) => void;
}

type ItemSortField = 'order' | 'code' | 'description' | 'group' | 'unit' | 'quantity' | 'unitCost' | 'totalCost' | 'totalWeight';

export const ListEditor: React.FC<ListEditorProps> = ({
  list,
  catalog,
  settings,
  onSaveList,
  onBackToLists,
  onEditHeader,
  onOpenWhatsApp,
}) => {
  const [items, setItems] = useState<MaterialListItem[]>(list.items || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<CatalogItem | null>(null);
  const [addQuantity, setAddQuantity] = useState('1');
  const [addUnitCost, setAddUnitCost] = useState('0');
  const [addNotes, setAddNotes] = useState('');
  const [sortField, setSortField] = useState<ItemSortField>('order');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterTableQuery, setFilterTableQuery] = useState('');
  const [filterTableGroup, setFilterTableGroup] = useState('ALL');
  const [hasSaved, setHasSaved] = useState(false);
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Custom Item state
  const [customDesc, setCustomDesc] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customGroup, setCustomGroup] = useState(settings.groups[0] || 'INSUMOS GERAIS');
  const [customUnit, setCustomUnit] = useState(settings.units[0] || 'PÇ');
  const [customQty, setCustomQty] = useState('1');
  const [customCost, setCustomCost] = useState('0');
  const [customWeight, setCustomWeight] = useState('0');
  const [customNotes, setCustomNotes] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fast searchable catalog results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q && selectedGroupFilter === 'ALL') {
      return catalog.slice(0, 12); // Show first 12 items as default suggestions
    }

    return catalog
      .filter((item) => {
        const matchesQuery =
          !q ||
          item.description.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q);

        const matchesGroup = selectedGroupFilter === 'ALL' || item.group === selectedGroupFilter;

        return matchesQuery && matchesGroup;
      })
      .slice(0, 40); // Cap at 40 fast selectable results
  }, [catalog, searchQuery, selectedGroupFilter]);

  // Add selected item to list
  const handleSelectItem = (item: CatalogItem) => {
    setSelectedItemToAdd(item);
    setAddQuantity('1');
    setAddUnitCost(String(item.cost || 0));
    setAddNotes(item.notes || '');
  };

  const handleConfirmAddItem = () => {
    if (!selectedItemToAdd) return;

    const qty = Math.max(0.01, parseFloat(addQuantity.replace(',', '.')) || 1);
    const unitCost = Math.max(0, parseFloat(addUnitCost.replace(',', '.')) || 0);
    const totalCost = qty * unitCost;
    const weightBar = selectedItemToAdd.weightBar || 0;
    const totalWeight = qty * weightBar;

    const newItem: MaterialListItem = {
      id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: selectedItemToAdd.id,
      code: selectedItemToAdd.code,
      description: selectedItemToAdd.description,
      group: selectedItemToAdd.group,
      unit: selectedItemToAdd.unit,
      quantity: qty,
      unitCost,
      totalCost,
      weightBar,
      totalWeight,
      notes: addNotes.trim(),
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedItemToAdd(null);
    setSearchQuery('');
    setHasSaved(false);

    // Focus back on search
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Add Custom / Ad-Hoc Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDesc.trim()) return;

    const qty = Math.max(0.01, parseFloat(customQty.replace(',', '.')) || 1);
    const unitCost = Math.max(0, parseFloat(customCost.replace(',', '.')) || 0);
    const weightBar = Math.max(0, parseFloat(customWeight.replace(',', '.')) || 0);

    const newItem: MaterialListItem = {
      id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: customCode.trim() || `ESP-${Date.now().toString().slice(-4)}`,
      description: customDesc.trim().toUpperCase(),
      group: customGroup,
      unit: customUnit,
      quantity: qty,
      unitCost,
      totalCost: qty * unitCost,
      weightBar,
      totalWeight: qty * weightBar,
      notes: customNotes.trim(),
    };

    setItems((prev) => [...prev, newItem]);
    setCustomDesc('');
    setCustomCode('');
    setCustomQty('1');
    setCustomCost('0');
    setCustomWeight('0');
    setCustomNotes('');
    setIsCustomItemOpen(false);
    setHasSaved(false);
  };

  // Inline update item quantity
  const handleUpdateQuantity = (id: string, newQty: number) => {
    const qty = Math.max(0.01, newQty);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const totalCost = qty * (item.unitCost || 0);
          const totalWeight = qty * (item.weightBar || 0);
          return { ...item, quantity: qty, totalCost, totalWeight };
        }
        return item;
      })
    );
    setHasSaved(false);
  };

  // Inline update item unit cost
  const handleUpdateUnitCost = (id: string, newCost: number) => {
    const cost = Math.max(0, newCost);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, unitCost: cost, totalCost: item.quantity * cost };
        }
        return item;
      })
    );
    setHasSaved(false);
  };

  // Remove item from list
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setHasSaved(false);
  };

  // Save current list
  const handleSave = async () => {
    const updated: MaterialList = {
      ...list,
      items,
      updatedAt: new Date().toISOString(),
    };
    onSaveList(updated);
    setHasSaved(true);
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch {
      // safe fallback if canvas is not available
    }
    setTimeout(() => setHasSaved(false), 3000);
  };

  // Sorting helper for current list table
  const handleSort = (field: ItemSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted table items
  const displayedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const q = filterTableQuery.toLowerCase();
      const matchesText =
        !q ||
        item.description.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchesGroup = filterTableGroup === 'ALL' || item.group === filterTableGroup;
      return matchesText && matchesGroup;
    });

    if (sortField === 'order') {
      return sortOrder === 'asc' ? filtered : [...filtered].reverse();
    }

    return [...filtered].sort((a, b) => {
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
      } else if (sortField === 'quantity') {
        valA = a.quantity;
        valB = b.quantity;
      } else if (sortField === 'unitCost') {
        valA = a.unitCost;
        valB = b.unitCost;
      } else if (sortField === 'totalCost') {
        valA = a.totalCost;
        valB = b.totalCost;
      } else if (sortField === 'totalWeight') {
        valA = a.totalWeight;
        valB = b.totalWeight;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, filterTableQuery, filterTableGroup, sortField, sortOrder]);

  // Overall totals
  const totalCost = items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
  const totalWeight = items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
  const totalQty = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  const renderSortIndicator = (field: ItemSortField) => {
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
    <div className="space-y-6">
      {/* Top Header Card with List Details & Action Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Back button & List Identity */}
          <div className="flex items-start gap-3">
            <button
              onClick={onBackToLists}
              className="mt-0.5 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              title="Voltar para todas as listas"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-zinc-100 sm:text-2xl">
                  {list.name}
                </h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                  {list.status}
                </span>
              </div>

              {/* Badges: Machine, Client, Date */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Cog className="h-3.5 w-3.5 text-cyan-400" />
                  <strong className="text-zinc-100">Máquina:</strong> {list.machine}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                  <strong className="text-zinc-100">Cliente:</strong> {list.client}
                </div>
                <div>
                  <strong className="text-zinc-100">Data:</strong> {formatDate(list.date)}
                </div>
                {list.responsible && (
                  <div>
                    <strong className="text-zinc-100">Responsável:</strong> {list.responsible}
                  </div>
                )}
                <button
                  onClick={onEditHeader}
                  className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Editar Dados do Cabeçalho</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Actions (Save, Export PDF, Excel, WhatsApp, Preview) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Visualizar Lista */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-2 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-900/50 hover:text-cyan-300"
              title="Visualizar Lista Formatada"
            >
              <Eye className="h-4 w-4" />
              <span>Visualizar</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => onOpenWhatsApp({ ...list, items })}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-900/50"
              title="Compartilhar via WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>

            {/* PDF */}
            <button
              onClick={() => exportListToPDF({ ...list, items }, settings)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-600/40 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-900/50"
              title="Baixar PDF formatado"
            >
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </button>

            {/* Excel */}
            <button
              onClick={() => exportListToExcel({ ...list, items }, settings)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-900/50"
              title="Baixar Planilha Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel</span>
            </button>

            {/* SAVE BUTTON */}
            <button
              id="btn-save-list-editor"
              onClick={handleSave}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow-lg transition ${
                hasSaved
                  ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-950/50 hover:from-cyan-400 hover:to-blue-500'
              }`}
            >
              {hasSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Lista Salva!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Lista</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Fast Search & Select Items to Add */}
      <div className="rounded-2xl border border-cyan-500/20 bg-zinc-950 p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-zinc-100 sm:text-base">
                Pesquisar e Adicionar Materiais do Catálogo
              </h2>
              <p className="text-xs text-zinc-400">
                Digite o nome ou código para ver a lista de resultados e adicionar rapidamente
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCustomItemOpen(!isCustomItemOpen)}
            className="flex items-center gap-1.5 self-start rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 sm:self-auto"
          >
            <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isCustomItemOpen ? 'Fechar Item Avulso' : '+ Item Avulso / Especial'}</span>
          </button>
        </div>

        {/* Custom Item Quick Form Drawer */}
        {isCustomItemOpen && (
          <form
            onSubmit={handleAddCustomItem}
            className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 animate-in fade-in slide-in-from-top-2"
          >
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-cyan-400">
              Adicionar Item Personalizado / Não Catalogado
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                  Descrição do Material *
                </label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Ex: CHAPA INOX 304 CORTE LASER 3MM"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">Código / Ref</label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="Ex: ESP-001"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">Grupo</label>
                <select
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                >
                  {settings.groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">Unidade</label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                >
                  {settings.units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">Quantidade</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                  Custo Unit. ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-cyan-500 py-2 text-xs font-semibold text-zinc-950 shadow transition hover:bg-cyan-400"
                >
                  Adicionar à Lista
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Live Search Input Bar */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              ref={searchInputRef}
              id="input-search-catalog-items"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome ou código... (ex: 6204, ASA 40, TUBO 50X50, PARAFUSO M10, PCF, PLF, REDUTOR)"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Category filter selector */}
          <div className="sm:w-64">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-200 outline-none transition focus:border-cyan-500"
            >
              <option value="ALL">Todas as Categorias ({catalog.length})</option>
              {settings.groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Item Quick Add Drawer */}
        {selectedItemToAdd && (
          <div className="mt-4 rounded-xl border border-cyan-500/40 bg-zinc-900/90 p-4 shadow-xl animate-in fade-in">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-xs font-bold text-cyan-400">
                    {selectedItemToAdd.code}
                  </span>
                  <h3 className="font-semibold text-zinc-100">
                    {selectedItemToAdd.description}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                  <span>Grupo: <strong className="text-zinc-200">{selectedItemToAdd.group}</strong></span>
                  <span>Unidade: <strong className="text-zinc-200">{selectedItemToAdd.unit}</strong></span>
                  {selectedItemToAdd.weightBar > 0 && (
                    <span>Peso Ref: <strong className="text-zinc-200">{selectedItemToAdd.weightBar} kg</strong></span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedItemToAdd(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              {/* Quantity */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Quantidade ({selectedItemToAdd.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  className="w-full rounded-lg border border-cyan-500/50 bg-zinc-950 px-3 py-2 text-sm font-bold text-cyan-400 outline-none focus:ring-1 focus:ring-cyan-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmAddItem();
                  }}
                />
              </div>

              {/* Unit Cost */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Valor Unitário ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={addUnitCost}
                  onChange={(e) => setAddUnitCost(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmAddItem();
                  }}
                />
              </div>

              {/* Observations / Notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Observação / Corte
                </label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Ex: Cortar em 2 pedaços de 3m"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmAddItem();
                  }}
                />
              </div>

              {/* Button */}
              <div className="flex items-end">
                <button
                  id="btn-confirm-add-item-to-list"
                  type="button"
                  onClick={handleConfirmAddItem}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-cyan-400 hover:to-blue-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar à Lista</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Search Results List (Selectable Cards/Rows) */}
        {!selectedItemToAdd && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
              <span>
                Resultados disponíveis ({searchResults.length}):{' '}
                <span className="text-zinc-500">Clique em qualquer item para adicionar rapidamente</span>
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-1.5">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  Nenhum item encontrado no catálogo com o termo &quot;{searchQuery}&quot;. Você pode cadastrar como item avulso no botão acima.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className="group flex items-start justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-2.5 text-left transition hover:border-cyan-500/50 hover:bg-zinc-900"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-zinc-800 px-1.5 py-0.2 font-mono text-[10px] font-medium text-zinc-400 group-hover:text-cyan-300">
                            {item.code}
                          </span>
                          <span className="rounded bg-cyan-950/60 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-400">
                            {item.unit}
                          </span>
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs font-medium text-zinc-200 group-hover:text-cyan-200">
                          {item.description}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-400">
                          <span>{item.group}</span>
                          {item.weightBar > 0 && <span>• {item.weightBar} kg</span>}
                        </div>
                      </div>

                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:border-cyan-500 group-hover:bg-cyan-500 group-hover:text-zinc-950">
                        <Plus className="h-4 w-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Current Selected Items in the List (Table + Inline Controls) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
        {/* Table Filter & Sort Controls */}
        <div className="flex flex-col gap-3 border-b border-zinc-800/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-zinc-100 sm:text-base">
              Itens Adicionados na Lista ({items.length})
            </h2>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
              {totalQty} un. total
            </span>
          </div>

          {/* Filter table items */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={filterTableQuery}
                onChange={(e) => setFilterTableQuery(e.target.value)}
                placeholder="Filtrar nesta lista..."
                className="rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={filterTableGroup}
              onChange={(e) => setFilterTableGroup(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-cyan-500"
            >
              <option value="ALL">Todos os Grupos</option>
              {settings.groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Items Table */}
        {displayedItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
              <PlusCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-zinc-300">
              {items.length === 0
                ? 'Nenhum material adicionado ainda'
                : 'Nenhum item corresponde ao filtro da lista'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {items.length === 0
                ? 'Use o campo de pesquisa acima para selecionar e adicionar os insumos necessários.'
                : 'Ajuste os termos do filtro.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
                <tr>
                  <th
                    onClick={() => handleSort('order')}
                    className="w-10 cursor-pointer px-3 py-3 text-center font-semibold hover:text-zinc-100"
                  >
                    #
                  </th>
                  <th
                    onClick={() => handleSort('code')}
                    className="cursor-pointer px-3 py-3 font-semibold hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1">
                      <span>Código</span>
                      {renderSortIndicator('code')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('description')}
                    className="cursor-pointer px-3 py-3 font-semibold hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1">
                      <span>Descrição do Material</span>
                      {renderSortIndicator('description')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('group')}
                    className="cursor-pointer px-3 py-3 font-semibold hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1">
                      <span>Grupo</span>
                      {renderSortIndicator('group')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('unit')}
                    className="cursor-pointer px-2 py-3 text-center font-semibold hover:text-zinc-100"
                  >
                    Unid.
                  </th>
                  <th
                    onClick={() => handleSort('quantity')}
                    className="cursor-pointer px-3 py-3 text-center font-semibold hover:text-zinc-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Quantidade</span>
                      {renderSortIndicator('quantity')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('unitCost')}
                    className="cursor-pointer px-3 py-3 text-right font-semibold hover:text-zinc-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Custo Unit.</span>
                      {renderSortIndicator('unitCost')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalCost')}
                    className="cursor-pointer px-3 py-3 text-right font-semibold hover:text-zinc-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total ({settings.currencySymbol})</span>
                      {renderSortIndicator('totalCost')}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {displayedItems.map((item, index) => (
                  <tr key={item.id} className="transition hover:bg-zinc-900/40">
                    {/* Index */}
                    <td className="px-3 py-3 text-center font-mono text-zinc-400">
                      {index + 1}
                    </td>

                    {/* Code */}
                    <td className="px-3 py-3 font-mono font-medium text-zinc-300">
                      {item.code}
                    </td>

                    {/* Description & Notes */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-zinc-100">{item.description}</div>
                      {item.notes && (
                        <div className="text-[11px] italic text-zinc-400">
                          ↳ Obs: {item.notes}
                        </div>
                      )}
                    </td>

                    {/* Group */}
                    <td className="px-3 py-3">
                      <span className="rounded bg-zinc-800/90 px-2 py-0.5 text-[11px] text-zinc-300">
                        {item.group}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-2 py-3 text-center font-bold text-zinc-400">
                      {item.unit}
                    </td>

                    {/* Quantity with quick steppers */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1 py-1 text-center font-mono text-xs font-bold text-cyan-400 outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Unit Cost */}
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost || ''}
                        onChange={(e) =>
                          handleUpdateUnitCost(
                            item.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                        className="w-20 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-right font-mono text-xs text-zinc-200 outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Total Cost & Weight */}
                    <td className="px-3 py-3 text-right font-mono">
                      <div className="font-bold text-emerald-400">
                        {formatCurrency(item.totalCost, settings.currencySymbol)}
                      </div>
                      {item.totalWeight > 0 && (
                        <div className="text-[10px] text-zinc-400">
                          {item.totalWeight.toFixed(2)} kg
                        </div>
                      )}
                    </td>

                    {/* Remove Action */}
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-lg p-1 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                        title="Remover este item da lista"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary & Save Bar */}
        <div className="flex flex-col gap-4 border-t border-zinc-800 bg-zinc-900/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Summary stats */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-400">Itens Distintos:</span>{' '}
              <strong className="font-mono text-zinc-100">{items.length}</strong>
            </div>
            <div>
              <span className="text-zinc-400">Volume Total:</span>{' '}
              <strong className="font-mono text-zinc-100">{totalQty}</strong>
            </div>
            {totalWeight > 0 && (
              <div>
                <span className="text-zinc-400">Peso Total:</span>{' '}
                <strong className="font-mono text-zinc-100">{totalWeight.toFixed(2)} kg</strong>
              </div>
            )}
            <div>
              <span className="text-zinc-400">Custo Total Estimado:</span>{' '}
              <strong className="font-mono text-base font-bold text-emerald-400">
                {formatCurrency(totalCost, settings.currencySymbol)}
              </strong>
            </div>
          </div>

          {/* Quick Save and Export controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setItems([])}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              disabled={items.length === 0}
            >
              Limpar Todos
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow-lg transition ${
                hasSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'
              }`}
            >
              {hasSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Lista ({items.length} itens)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* List Preview Modal */}
      <ListPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        list={{ ...list, items }}
        settings={settings}
        onEditList={() => setIsPreviewOpen(false)}
        onOpenWhatsApp={(previewTarget) => {
          setIsPreviewOpen(false);
          onOpenWhatsApp(previewTarget);
        }}
      />
    </div>
  );
};
