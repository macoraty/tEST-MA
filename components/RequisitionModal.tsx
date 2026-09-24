'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SupplyRequisition,
  RequisitionItem,
  RequisitionPriority,
  RequisitionStatus,
  CatalogItem,
  AppSettings,
  MaterialList,
  MaterialListItem,
} from '@/lib/types';
import { formatCurrency } from '@/lib/exportUtils';
import {
  X,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ArrowDownToLine,
  FolderOpen,
  Info,
  Wrench,
  Check,
} from 'lucide-react';

interface RequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (requisition: SupplyRequisition) => void;
  initialRequisition?: SupplyRequisition | null;
  initialSelectedListId?: string | null;
  lists: MaterialList[];
  catalog: CatalogItem[];
  settings: AppSettings;
  existingRequisitionsCount: number;
}

const SECTOR_PRESETS = [
  'Manutenção Mecânica',
  'Manutenção Elétrica',
  'Usinagem (Torno / Fresa / CNC)',
  'Solda & Caldeiraria',
  'Montagem & Ajustagem',
  'Produção / Linha Operacional',
  'Engenharia & Projetos',
  'Almoxarifado Central',
  'Qualidade & Metrologia',
];

let globalItemCounter = 0;
function createItemId(prefix = 'item') {
  globalItemCounter += 1;
  return `req-${prefix}-${Date.now()}-${globalItemCounter}`;
}

function generateRequisitionId(existingId?: string) {
  if (existingId) return existingId;
  return `req-${Date.now()}`;
}

function convertBOMItemToRequisitionItem(
  bomItem: MaterialListItem,
  machineName?: string
): RequisitionItem {
  const qty = Math.max(0.01, Number(bomItem.quantity) || 1);
  const cost = Math.max(0, Number(bomItem.unitCost) || 0);
  return {
    id: createItemId('bom'),
    catalogItemId: bomItem.itemId,
    code: bomItem.code || 'INSUMO',
    description: bomItem.description || '',
    group: bomItem.group || 'GERAL',
    unit: bomItem.unit || 'PÇ',
    quantity: qty,
    estimatedCost: cost,
    totalEstimatedCost: qty * cost,
    destinationMachine: machineName || '',
    notes: bomItem.notes || '',
  };
}

export const RequisitionModal: React.FC<RequisitionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRequisition,
  initialSelectedListId,
  lists,
  catalog,
  settings,
  existingRequisitionsCount,
}) => {
  if (!isOpen) return null;

  const modalKey = initialRequisition
    ? initialRequisition.id
    : initialSelectedListId
    ? `bom-${initialSelectedListId}`
    : 'new-requisition';

  return (
    <RequisitionModalContent
      key={modalKey}
      onClose={onClose}
      onSave={onSave}
      initialRequisition={initialRequisition}
      initialSelectedListId={initialSelectedListId}
      lists={lists}
      catalog={catalog}
      settings={settings}
      existingRequisitionsCount={existingRequisitionsCount}
    />
  );
};

interface RequisitionModalContentProps {
  onClose: () => void;
  onSave: (requisition: SupplyRequisition) => void;
  initialRequisition?: SupplyRequisition | null;
  initialSelectedListId?: string | null;
  lists: MaterialList[];
  catalog: CatalogItem[];
  settings: AppSettings;
  existingRequisitionsCount: number;
}

const RequisitionModalContent: React.FC<RequisitionModalContentProps> = ({
  onClose,
  onSave,
  initialRequisition,
  initialSelectedListId,
  lists,
  catalog,
  settings,
  existingRequisitionsCount,
}) => {
  const isEditing = Boolean(initialRequisition);

  // If a list was preselected on open
  const preselectedList = useMemo(() => {
    if (!initialSelectedListId || initialRequisition) return null;
    return lists.find((l) => l.id === initialSelectedListId) || null;
  }, [initialSelectedListId, initialRequisition, lists]);

  // Initial values computed once
  const defaultYear = new Date().getFullYear();
  const defaultSeq = String(existingRequisitionsCount + 1).padStart(4, '0');
  const defaultNeededDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  };

  const initialItems = useMemo(() => {
    if (initialRequisition?.items) {
      return [...initialRequisition.items];
    }
    if (preselectedList && preselectedList.items.length > 0) {
      return preselectedList.items.map((it) =>
        convertBOMItemToRequisitionItem(it, preselectedList.machine)
      );
    }
    return [];
  }, [initialRequisition, preselectedList]);

  const [protocol, setProtocol] = useState(
    initialRequisition?.protocol || `REQ-${defaultYear}-${defaultSeq}`
  );
  const [title, setTitle] = useState(
    initialRequisition?.title || (preselectedList ? `Solicitação - ${preselectedList.name}` : '')
  );
  const [requesterName, setRequesterName] = useState(
    initialRequisition?.requesterName || preselectedList?.responsible || settings.defaultResponsible || ''
  );

  const isPresetSector =
    initialRequisition && SECTOR_PRESETS.includes(initialRequisition.sector);

  const [sector, setSector] = useState(
    initialRequisition ? (isPresetSector ? initialRequisition.sector : 'Outro') : SECTOR_PRESETS[0]
  );
  const [customSector, setCustomSector] = useState(
    initialRequisition && !isPresetSector ? initialRequisition.sector : ''
  );
  const [destinationMachine, setDestinationMachine] = useState(
    initialRequisition?.destinationMachine || preselectedList?.machine || ''
  );
  const [priority, setPriority] = useState<RequisitionPriority>(
    initialRequisition?.priority || 'Normal'
  );
  const [status, setStatus] = useState<RequisitionStatus>(
    initialRequisition?.status || 'Pendente'
  );
  const [requestDate, setRequestDate] = useState(
    initialRequisition?.requestDate || new Date().toISOString().slice(0, 10)
  );
  const [neededByDate, setNeededByDate] = useState(
    initialRequisition?.neededByDate || defaultNeededDate()
  );
  const [justification, setJustification] = useState(
    initialRequisition?.justification ||
      (preselectedList ? `Solicitação gerada com base na Lista de Materiais "${preselectedList.name}"` : '')
  );
  const [notes, setNotes] = useState(
    initialRequisition?.notes || (preselectedList?.notes ? `Obs da lista: ${preselectedList.notes}` : '')
  );
  const [items, setItems] = useState<RequisitionItem[]>(initialItems);

  // Search in Catalog state
  const [itemSearch, setItemSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // List Selection (BOM Picker) state
  const [isListPickerExpanded, setIsListPickerExpanded] = useState<boolean>(
    !initialRequisition && !preselectedList && lists.length > 0
  );
  const [selectedBOMId, setSelectedBOMId] = useState<string>(preselectedList ? preselectedList.id : '');
  const [selectedBOMItemIds, setSelectedBOMItemIds] = useState<Record<string, boolean>>({});
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [updateHeaderWithBOM, setUpdateHeaderWithBOM] = useState<boolean>(true);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Error validation
  const [errorMsg, setErrorMsg] = useState('');

  // Handle clicking outside search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter catalog items for search dropdown
  const filteredCatalog = useMemo(() => {
    const q = itemSearch.toLowerCase().trim();
    if (!q) return [];
    return catalog
      .filter(
        (it) =>
          (it.code || '').toLowerCase().includes(q) ||
          (it.description || '').toLowerCase().includes(q) ||
          (it.group || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [catalog, itemSearch]);

  // The currently chosen BOM in the picker
  const activeChosenBOM = useMemo(() => {
    if (!selectedBOMId) return null;
    return lists.find((l) => l.id === selectedBOMId) || null;
  }, [selectedBOMId, lists]);

  // When user selects a BOM from the dropdown
  const handleSelectBOM = (listId: string) => {
    setSelectedBOMId(listId);
    const target = lists.find((l) => l.id === listId);
    if (target) {
      const map: Record<string, boolean> = {};
      target.items.forEach((it) => {
        map[it.id] = true;
      });
      setSelectedBOMItemIds(map);
    } else {
      setSelectedBOMItemIds({});
    }
  };

  // Toggle selection of all items in the chosen BOM
  const handleToggleAllBOMItems = (selectAll: boolean) => {
    if (!activeChosenBOM) return;
    const map: Record<string, boolean> = {};
    activeChosenBOM.items.forEach((it) => {
      map[it.id] = selectAll;
    });
    setSelectedBOMItemIds(map);
  };

  // Toggle individual item in chosen BOM
  const handleToggleBOMItem = (itemId: string) => {
    setSelectedBOMItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Import items from selected BOM into requisition
  const handleExecuteImportBOM = () => {
    if (!activeChosenBOM) return;

    const itemsToImport = activeChosenBOM.items.filter(
      (it) => selectedBOMItemIds[it.id] !== false
    );

    if (itemsToImport.length === 0) {
      setErrorMsg('Selecione pelo menos um item da lista para importar.');
      return;
    }

    const convertedItems = itemsToImport.map((it) =>
      convertBOMItemToRequisitionItem(it, activeChosenBOM.machine)
    );

    if (importMode === 'replace' || items.length === 0) {
      setItems(convertedItems);
    } else {
      setItems((prev) => [...prev, ...convertedItems]);
    }

    // Auto update headers if requested
    if (updateHeaderWithBOM) {
      if (!title.trim() || title === 'Solicitação de Insumos') {
        setTitle(`Solicitação - ${activeChosenBOM.name}`);
      }
      if (!destinationMachine.trim() && activeChosenBOM.machine) {
        setDestinationMachine(activeChosenBOM.machine);
      }
      if (!requesterName.trim() && activeChosenBOM.responsible) {
        setRequesterName(activeChosenBOM.responsible);
      }
      if (!justification.trim()) {
        setJustification(
          `Insumos requeridos com base na Lista de Materiais "${activeChosenBOM.name}" (Máquina: ${activeChosenBOM.machine || 'Geral'}).`
        );
      }
    }

    setErrorMsg('');
    setImportNotification(
      `✓ ${itemsToImport.length} insumos importados com sucesso da lista "${activeChosenBOM.name}"!`
    );
    setIsListPickerExpanded(false);
  };

  // Add Item from Catalog
  const handleAddCatalogItem = (catalogItem: CatalogItem) => {
    const newItem: RequisitionItem = {
      id: createItemId('cat'),
      catalogItemId: catalogItem.id,
      code: catalogItem.code,
      description: catalogItem.description,
      group: catalogItem.group,
      unit: catalogItem.unit || 'PÇ',
      quantity: 1,
      estimatedCost: catalogItem.cost || 0,
      totalEstimatedCost: catalogItem.cost || 0,
      destinationMachine: destinationMachine || '',
      notes: '',
    };
    setItems((prev) => [...prev, newItem]);
    setItemSearch('');
    setIsSearchOpen(false);
  };

  // Add Custom Item (not in catalog)
  const handleAddCustomItem = () => {
    const fallbackDesc = itemSearch.trim() || 'NOVO INSUMO AVULSO';
    const newItem: RequisitionItem = {
      id: createItemId('avulso'),
      code: `REQ-AVULSO`,
      description: fallbackDesc.toUpperCase(),
      group: 'INSUMOS GERAIS',
      unit: 'PÇ',
      quantity: 1,
      estimatedCost: 0,
      totalEstimatedCost: 0,
      destinationMachine: destinationMachine || '',
      notes: 'Item avulso (não catalogado)',
    };
    setItems((prev) => [...prev, newItem]);
    setItemSearch('');
    setIsSearchOpen(false);
  };

  // Update Item in table
  const handleUpdateItem = (
    id: string,
    field: keyof RequisitionItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity' || field === 'estimatedCost') {
          const q = field === 'quantity' ? Math.max(0.01, Number(value) || 0) : it.quantity;
          const c = field === 'estimatedCost' ? Math.max(0, Number(value) || 0) : it.estimatedCost;
          updated.totalEstimatedCost = q * c;
        }
        return updated;
      })
    );
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Totals
  const totalCost = items.reduce((acc, it) => acc + (Number(it.totalEstimatedCost) || 0), 0);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requesterName.trim()) {
      setErrorMsg('Por favor, informe o nome do solicitante.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Por favor, forneça um título ou finalidade para a solicitação.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Adicione pelo menos um insumo à solicitação ou selecione uma lista de materiais pronta.');
      return;
    }

    const finalSector = sector === 'Outro' ? customSector.trim() || 'Geral' : sector;
    const requisitionId = generateRequisitionId(initialRequisition?.id);

    const requisitionData: SupplyRequisition = {
      id: requisitionId,
      protocol: protocol.trim() || `REQ-${defaultYear}-0001`,
      title: title.trim(),
      requesterName: requesterName.trim(),
      sector: finalSector,
      destinationMachine: destinationMachine.trim() || undefined,
      priority,
      status,
      requestDate: requestDate || new Date().toISOString().slice(0, 10),
      neededByDate: neededByDate || undefined,
      justification: justification.trim(),
      items,
      totalEstimatedCost: totalCost,
      totalItemsCount: items.length,
      notes: notes.trim() || undefined,
      createdAt: initialRequisition?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(requisitionData);
  };

  // Selected BOM items count for button label
  const selectedBOMCount = activeChosenBOM
    ? activeChosenBOM.items.filter((it) => selectedBOMItemIds[it.id] !== false).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-5">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-cyan-950/40">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 sm:text-xl">
                {isEditing ? 'Editar Solicitação de Insumos' : 'Nova Solicitação de Insumos'}
              </h2>
              <p className="text-xs text-zinc-400">
                Requisição interna para compras, almoxarifado ou manutenção
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {importNotification && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-sm text-emerald-300 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-400 font-bold" />
                <span>{importNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportNotification(null)}
                className="text-xs text-emerald-400 hover:text-emerald-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SPECIAL FEATURE: SELECIONAR LISTA DE MATERIAIS JÁ FEITA (BOM PICKER)     */}
          {/* ========================================================================= */}
          <div className="overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-900 shadow-md">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-inner">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100">
                      Selecionar uma Lista de Materiais Feita (BOM)
                    </h3>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                      {lists.length} {lists.length === 1 ? 'lista cadastrada' : 'listas cadastradas'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Carregue rapidamente todos os insumos, máquina e especificações de uma lista já existente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsListPickerExpanded(!isListPickerExpanded)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 transition-colors hover:bg-cyan-500/20"
              >
                <FolderOpen className="h-4 w-4" />
                <span>{isListPickerExpanded ? 'Fechar Seletor de Lista' : 'Abrir e Selecionar Lista'}</span>
                {isListPickerExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                )}
              </button>
            </div>

            {/* EXPANDED LIST SELECTOR & ITEM PREVIEW */}
            {isListPickerExpanded && (
              <div className="border-t border-zinc-800 bg-zinc-950/70 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {lists.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-400">
                    Nenhuma lista de materiais cadastrada no momento. Crie listas na aba &quot;Listas de Materiais&quot; para poder importá-las aqui.
                  </div>
                ) : (
                  <>
                    {/* List Dropdown Selector */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                        Escolha a Lista de Materiais:
                      </label>
                      <select
                        value={selectedBOMId}
                        onChange={(e) => handleSelectBOM(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm font-bold text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">-- Selecione uma lista para importar os insumos --</option>
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} — Máquina: {l.machine || 'Geral'} ({l.items.length} itens) — Cliente: {l.client || 'Interno'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active List Information Card */}
                    {activeChosenBOM && (
                      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                          <div>
                            <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                              <span>{activeChosenBOM.name}</span>
                              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                                {activeChosenBOM.status}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400">
                              <span>
                                Máquina:{' '}
                                <strong className="text-zinc-200">{activeChosenBOM.machine || 'Não informada'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Cliente / Destino:{' '}
                                <strong className="text-zinc-200">{activeChosenBOM.client || 'Interno'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Total de Insumos:{' '}
                                <strong className="text-cyan-400">{activeChosenBOM.items.length}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Custo Est. Total:{' '}
                                <strong className="text-emerald-400">
                                  {formatCurrency(
                                    activeChosenBOM.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0),
                                    settings.currencySymbol
                                  )}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Options: Auto fill headers and Mode */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={updateHeaderWithBOM}
                              onChange={(e) => setUpdateHeaderWithBOM(e.target.checked)}
                              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span>
                              Preencher automaticamente <strong>Título</strong>, <strong>Máquina</strong> e <strong>Justificativa</strong> com os dados da lista
                            </span>
                          </label>

                          {items.length > 0 && (
                            <div className="flex items-center gap-4 text-zinc-300">
                              <span className="font-medium text-zinc-400">Modo de Inserção:</span>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="importMode"
                                  value="append"
                                  checked={importMode === 'append'}
                                  onChange={() => setImportMode('append')}
                                  className="text-cyan-500 focus:ring-cyan-500"
                                />
                                <span>Adicionar / Mesclar</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="importMode"
                                  value="replace"
                                  checked={importMode === 'replace'}
                                  onChange={() => setImportMode('replace')}
                                  className="text-cyan-500 focus:ring-cyan-500"
                                />
                                <span>Substituir existentes ({items.length})</span>
                              </label>
                            </div>
                          )}
                        </div>

                        {/* List items selection table */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-300">
                              Selecione os insumos que deseja importar ({selectedBOMCount} de {activeChosenBOM.items.length}):
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleAllBOMItems(true)}
                                className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                              >
                                Selecionar Todos
                              </button>
                              <span className="text-zinc-600">|</span>
                              <button
                                type="button"
                                onClick={() => handleToggleAllBOMItems(false)}
                                className="text-zinc-400 hover:text-zinc-200 underline font-medium"
                              >
                                Desmarcar Todos
                              </button>
                            </div>
                          </div>

                          <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950">
                            <table className="w-full text-left text-xs">
                              <thead className="border-b border-zinc-800 bg-zinc-900/90 text-[10px] uppercase tracking-wider text-zinc-400 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 w-10 text-center"></th>
                                  <th className="px-3 py-2">Código / Descrição</th>
                                  <th className="px-3 py-2 w-20 text-center">Qtd.</th>
                                  <th className="px-3 py-2 w-24 text-right">Custo Est.</th>
                                  <th className="px-3 py-2 w-28 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60">
                                {activeChosenBOM.items.map((it) => {
                                  const isChecked = selectedBOMItemIds[it.id] !== false;
                                  return (
                                    <tr
                                      key={it.id}
                                      onClick={() => handleToggleBOMItem(it.id)}
                                      className={`cursor-pointer transition-colors ${
                                        isChecked ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'opacity-50 hover:bg-zinc-900'
                                      }`}
                                    >
                                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleToggleBOMItem(it.id)}
                                          className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className="font-mono font-bold text-cyan-400 mr-2">
                                          {it.code}
                                        </span>
                                        <span className="text-zinc-200 font-medium">
                                          {it.description}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-center text-zinc-300 font-mono">
                                        {it.quantity} {it.unit}
                                      </td>
                                      <td className="px-3 py-2 text-right text-zinc-400">
                                        {formatCurrency(it.unitCost, settings.currencySymbol)}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-emerald-400">
                                        {formatCurrency(it.totalCost, settings.currencySymbol)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Import CTA Button */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsListPickerExpanded(false)}
                            className="rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Fechar sem importar
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteImportBOM}
                            disabled={selectedBOMCount === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-cyan-950/50 transition-all hover:brightness-110 disabled:opacity-50"
                          >
                            <ArrowDownToLine className="h-4 w-4" />
                            <span>Importar {selectedBOMCount} Insumos da Lista</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Section 1: Identification & Protocol */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Protocol */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Protocolo / N° Requisição
              </label>
              <input
                type="text"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value.toUpperCase())}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm font-bold text-cyan-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Data da Solicitação
              </label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Nível de Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 ${
                  priority === 'Urgente'
                    ? 'border-rose-500 bg-rose-950/40 text-rose-300 focus:ring-rose-500'
                    : priority === 'Alta'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300 focus:ring-amber-500'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-200 focus:ring-cyan-500'
                }`}
              >
                <option value="Baixa">Baixa (Rotina / Estoque)</option>
                <option value="Normal">Normal (Até 5 dias)</option>
                <option value="Alta">Alta (Até 48h)</option>
                <option value="Urgente">URGENTE (Parada de Máquina / Imediato)</option>
              </select>
            </div>
          </div>

          {/* Title / Objective */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Título / Finalidade da Requisição <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Insumos para Manutenção Preventiva Prensa 120T ou Reposição de Brocas e Parafusos"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Section 2: Requester, Sector, Machine */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Requester Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Nome do Solicitante <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Setor Solicitante
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {SECTOR_PRESETS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
                <option value="Outro">Outro Setor...</option>
              </select>
              {sector === 'Outro' && (
                <input
                  type="text"
                  value={customSector}
                  onChange={(e) => setCustomSector(e.target.value)}
                  placeholder="Especifique o setor..."
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500"
                />
              )}
            </div>

            {/* Destination Machine / Project */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Máquina / O.S. / Destino
              </label>
              <input
                type="text"
                value={destinationMachine}
                onChange={(e) => setDestinationMachine(e.target.value)}
                placeholder="Ex: Torno CNC 02 / Prensa 120T"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Section 3: Needed Date & Status & Justification */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Data Limite de Necessidade
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Status Atual da Solicitação
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RequisitionStatus)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="Pendente">🟡 Pendente (Aguardando Análise)</option>
                <option value="Em Cotação">🔵 Em Cotação (Almoxarifado/Compras)</option>
                <option value="Aprovada">🟢 Aprovada para Compra</option>
                <option value="Entregue">🟣 Entregue / Atendida</option>
                <option value="Cancelada">🔴 Cancelada</option>
              </select>
            </div>
          </div>

          {/* Justification Textarea */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Justificativa / Motivo da Solicitação
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex: Troca preventiva de componentes com folga para evitar travamento da esteira no turno da tarde..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Section 4: Items Table & Catalog Search */}
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">
                  Insumos e Materiais Solicitados ({items.length})
                </h3>
                <p className="text-xs text-zinc-400">
                  Busque no catálogo para autopreencher código, unidade e custo estimado, ou adicione itens avulsos.
                </p>
              </div>

              {/* Add Custom Item Button */}
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
              >
                <Plus className="h-3.5 w-3.5 text-cyan-400" />
                Adicionar Insumo Avulso
              </button>
            </div>

            {/* Quick Search & Add from Catalog */}
            <div ref={searchContainerRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Pesquisar no catálogo pelo código ou descrição do insumo (ex: MANCAL, CORRENTE, PARAFUSO, TUBO)..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Suggestions Dropdown */}
              {isSearchOpen && itemSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                  {filteredCatalog.length > 0 ? (
                    filteredCatalog.map((catItem) => (
                      <button
                        key={catItem.id}
                        type="button"
                        onClick={() => handleAddCatalogItem(catItem)}
                        className="flex w-full items-center justify-between border-b border-zinc-800/50 px-4 py-2 text-left text-xs transition-colors hover:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">
                            {catItem.code}
                          </span>
                          <span className="font-medium text-zinc-200">
                            {catItem.description}
                          </span>
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            {catItem.group}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400">{catItem.unit}</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(catItem.cost, settings.currencySymbol)}
                          </span>
                          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                            + Adicionar
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-zinc-400">
                      Nenhum item encontrado no catálogo com o termo &quot;{itemSearch}&quot;.
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="ml-2 font-bold text-cyan-400 underline hover:text-cyan-300"
                      >
                        Clique aqui para adicionar como item avulso
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                <Package className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                <p className="text-sm font-medium text-zinc-300">Nenhum insumo incluído ainda.</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Você pode usar o seletor acima para <strong>importar itens de uma lista já feita</strong>, buscar diretamente no catálogo industrial ou adicionar itens avulsos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-3 py-2.5">Código / Insumo</th>
                      <th className="px-3 py-2.5 w-24 text-center">Qtd.</th>
                      <th className="px-2 py-2.5 w-16 text-center">Unid.</th>
                      <th className="px-3 py-2.5 w-28 text-right">Valor Est.</th>
                      <th className="px-3 py-2.5 w-28 text-right">Subtotal</th>
                      <th className="px-3 py-2.5">Aplicação / Destino</th>
                      <th className="px-2 py-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {items.map((it) => (
                      <tr key={it.id} className="transition-colors hover:bg-zinc-800/30">
                        {/* Description & Code */}
                        <td className="px-3 py-2">
                          <div className="font-mono text-[11px] font-bold text-cyan-400">
                            {it.code}
                          </div>
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => handleUpdateItem(it.id, 'description', e.target.value)}
                            className="mt-0.5 w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-zinc-200 hover:border-zinc-700 focus:border-cyan-500 focus:bg-zinc-800 focus:outline-none"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItem(it.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-center font-bold text-zinc-100 focus:border-cyan-500 focus:outline-none"
                          />
                        </td>

                        {/* Unit */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={it.unit}
                            onChange={(e) => handleUpdateItem(it.id, 'unit', e.target.value.toUpperCase())}
                            className="w-full rounded border border-zinc-700 bg-zinc-800 px-1.5 py-1 text-center font-mono text-zinc-300 focus:border-cyan-500 focus:outline-none"
                          />
                        </td>

                        {/* Unit Cost */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.estimatedCost}
                            onChange={(e) => handleUpdateItem(it.id, 'estimatedCost', parseFloat(e.target.value) || 0)}
                            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-right text-zinc-200 focus:border-cyan-500 focus:outline-none"
                          />
                        </td>

                        {/* Subtotal */}
                        <td className="px-3 py-2 text-right font-bold text-emerald-400">
                          {formatCurrency(it.totalEstimatedCost, settings.currencySymbol)}
                        </td>

                        {/* Application / Destination */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={it.destinationMachine || ''}
                            onChange={(e) => handleUpdateItem(it.id, 'destinationMachine', e.target.value)}
                            placeholder="Onde será usado..."
                            className="w-full rounded border border-zinc-700/60 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </td>

                        {/* Remove */}
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="rounded p-1 text-zinc-500 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
                            title="Remover item da solicitação"
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

            {/* Total Footer */}
            {items.length > 0 && (
              <div className="flex flex-wrap items-center justify-between rounded-lg bg-zinc-900 px-4 py-3 text-xs">
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>
                    Total de Itens:{' '}
                    <strong className="text-zinc-200">{items.length}</strong>
                  </span>
                  <span>
                    Quantidade Total:{' '}
                    <strong className="text-zinc-200">
                      {items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Custo Estimado Total:</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatCurrency(totalCost, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Observações Gerais / Instruções de Entrega (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Entregar na bancada 3 aos cuidados do mecânico do turno matutino."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-cyan-900/30 transition-all hover:brightness-110 active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isEditing ? 'Salvar Alterações' : 'Concluir & Criar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
