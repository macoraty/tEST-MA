'use client';

import { useSyncExternalStore, useCallback } from 'react';
import {
  CatalogItem,
  MaterialList,
  MaterialListItem,
  ListStatus,
  AppSettings,
  SupplyRequisition,
  RequisitionItem,
  RequisitionStatus,
  RequisitionPriority,
} from './types';
import {
  generateSeedCatalog,
  DEFAULT_SETTINGS,
  INITIAL_SAMPLE_LISTS,
  INITIAL_SAMPLE_REQUISITIONS,
} from './seedData';
import { getNextCodeForGroup, getGroupPrefix, regenerateAllCatalogCodes } from './codeUtils';

const STORAGE_KEYS = {
  CATALOG: 'industrial_catalog_items_v1',
  LISTS: 'industrial_material_lists_v1',
  REQUISITIONS: 'industrial_requisitions_v1',
  SETTINGS: 'industrial_app_settings_v1',
};

/**
 * Ensures any catalog item object has valid, safe properties.
 * Prevents TypeError when properties like code, description or group are missing or undefined.
 */
export function sanitizeCatalogItem(item: unknown, index = 0): CatalogItem {
  if (!item || typeof item !== 'object') {
    return {
      id: `item-fallback-${index}-${Date.now()}`,
      code: `GERAL${String(index + 1).padStart(4, '0')}`,
      description: 'MATERIAL SEM DESCRIÇÃO',
      group: 'INSUMOS GERAIS',
      unit: 'PÇ',
      cost: 0,
      weightBar: 0,
      notes: '',
      createdAt: new Date().toISOString(),
    };
  }

  const raw = item as Record<string, unknown>;
  const id = String(raw.id || `item-${index}-${Date.now()}`);
  const group = String(raw.group || 'INSUMOS GERAIS').trim() || 'INSUMOS GERAIS';
  const code = String(raw.code || '').trim() || `${getGroupPrefix(group)}${String(index + 1).padStart(4, '0')}`;
  const description = String(raw.description || 'MATERIAL SEM DESCRIÇÃO').trim();
  const unit = String(raw.unit || 'PÇ').trim() || 'PÇ';
  const cost = typeof raw.cost === 'number' && !isNaN(raw.cost) ? raw.cost : Math.max(0, parseFloat(String(raw.cost || 0).replace(',', '.')) || 0);
  const weightBar = typeof raw.weightBar === 'number' && !isNaN(raw.weightBar) ? raw.weightBar : Math.max(0, parseFloat(String(raw.weightBar || 0).replace(',', '.')) || 0);
  const notes = raw.notes ? String(raw.notes) : '';
  const createdAt = raw.createdAt ? String(raw.createdAt) : new Date().toISOString();

  return {
    id,
    code,
    description,
    group,
    unit,
    cost,
    weightBar,
    notes,
    createdAt,
  };
}

/**
 * Ensures any material list object has valid, safe properties and items array.
 */
export function sanitizeMaterialList(list: unknown, index = 0): MaterialList {
  const validStatuses: ListStatus[] = ['Rascunho', 'Em Andamento', 'Concluída', 'Aprovada', 'Entregue'];

  if (!list || typeof list !== 'object') {
    return {
      id: `list-fallback-${index}-${Date.now()}`,
      name: 'Lista de Materiais',
      machine: '',
      client: '',
      responsible: '',
      status: 'Rascunho',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const raw = list as Record<string, unknown>;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: MaterialListItem[] = rawItems
    .filter(Boolean)
    .map((it: unknown, iIdx: number) => {
      const r = (it && typeof it === 'object' ? it : {}) as Record<string, unknown>;
      const qty = Math.max(0.01, Number(r.quantity) || 1);
      const unitCost = Math.max(0, Number(r.unitCost) || 0);
      const weightBar = Math.max(0, Number(r.weightBar) || 0);
      return {
        id: String(r.id || `li-${iIdx}-${Date.now()}`),
        itemId: r.itemId ? String(r.itemId) : undefined,
        code: String(r.code || `MAT${String(iIdx + 1).padStart(4, '0')}`),
        description: String(r.description || 'ITEM SEM DESCRIÇÃO'),
        group: String(r.group || 'INSUMOS GERAIS'),
        unit: String(r.unit || 'PÇ'),
        quantity: qty,
        unitCost,
        totalCost: typeof r.totalCost === 'number' && !isNaN(r.totalCost) ? r.totalCost : qty * unitCost,
        weightBar,
        totalWeight: typeof r.totalWeight === 'number' && !isNaN(r.totalWeight) ? r.totalWeight : qty * weightBar,
        notes: r.notes ? String(r.notes) : '',
      };
    });

  const rawStatus = String(raw.status || 'Rascunho') as ListStatus;
  const status: ListStatus = validStatuses.includes(rawStatus) ? rawStatus : 'Rascunho';

  return {
    id: String(raw.id || `list-${index}-${Date.now()}`),
    name: String(raw.name || 'Lista de Materiais'),
    machine: String(raw.machine || ''),
    client: String(raw.client || ''),
    responsible: String(raw.responsible || ''),
    status,
    date: String(raw.date || raw.createdAt || new Date().toISOString().slice(0, 10)),
    notes: String(raw.notes || ''),
    items,
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

/**
 * Ensures any requisition object has valid, safe properties and items array.
 */
export function sanitizeRequisition(req: unknown, index = 0): SupplyRequisition {
  const validPriorities: RequisitionPriority[] = ['Baixa', 'Normal', 'Alta', 'Urgente'];
  const validStatuses: RequisitionStatus[] = ['Pendente', 'Em Cotação', 'Aprovada', 'Entregue', 'Cancelada'];

  if (!req || typeof req !== 'object') {
    return {
      id: `req-fallback-${index}-${Date.now()}`,
      protocol: `REQ-2026-${String(index + 1).padStart(4, '0')}`,
      title: 'Solicitação de Insumos',
      requesterName: '',
      sector: 'Manutenção Mecânica',
      destinationMachine: '',
      priority: 'Normal',
      status: 'Pendente',
      requestDate: new Date().toISOString().slice(0, 10),
      justification: '',
      items: [],
      totalEstimatedCost: 0,
      totalItemsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const raw = req as Record<string, unknown>;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: RequisitionItem[] = rawItems
    .filter(Boolean)
    .map((it: unknown, iIdx: number) => {
      const r = (it && typeof it === 'object' ? it : {}) as Record<string, unknown>;
      const qty = Math.max(0.01, Number(r.quantity) || 1);
      const estimatedCost = Math.max(0, Number(r.estimatedCost ?? (r as { unitCost?: number }).unitCost) || 0);
      const totalEstimatedCost = typeof r.totalEstimatedCost === 'number' && !isNaN(r.totalEstimatedCost)
        ? r.totalEstimatedCost
        : qty * estimatedCost;

      return {
        id: String(r.id || `req-item-${iIdx}-${Date.now()}`),
        catalogItemId: r.catalogItemId ? String(r.catalogItemId) : undefined,
        code: String(r.code || `INSUM-${String(iIdx + 1).padStart(4, '0')}`),
        description: String(r.description || 'INSUMO SEM DESCRIÇÃO'),
        group: String(r.group || 'INSUMOS GERAIS'),
        unit: String(r.unit || 'PÇ'),
        quantity: qty,
        estimatedCost,
        totalEstimatedCost,
        destinationMachine: r.destinationMachine ? String(r.destinationMachine) : undefined,
        notes: r.notes ? String(r.notes) : '',
      };
    });

  const rawPriority = String(raw.priority || 'Normal') as RequisitionPriority;
  const priority: RequisitionPriority = validPriorities.includes(rawPriority) ? rawPriority : 'Normal';

  const rawStatus = String(raw.status || 'Pendente') as RequisitionStatus;
  const status: RequisitionStatus = validStatuses.includes(rawStatus) ? rawStatus : 'Pendente';

  const totalEstimatedCost = items.reduce((acc, i) => acc + (Number(i.totalEstimatedCost) || 0), 0);
  const totalItemsCount = items.length;

  return {
    id: String(raw.id || `req-${index}-${Date.now()}`),
    protocol: String(raw.protocol || `REQ-2026-${String(index + 1).padStart(4, '0')}`),
    title: String(raw.title || 'Solicitação de Insumos'),
    requesterName: String(raw.requesterName || ''),
    sector: String(raw.sector || 'Geral'),
    destinationMachine: String(raw.destinationMachine || ''),
    priority,
    status,
    requestDate: String(raw.requestDate || raw.createdAt || new Date().toISOString().slice(0, 10)),
    neededByDate: raw.neededByDate ? String(raw.neededByDate) : undefined,
    justification: String(raw.justification || ''),
    items,
    totalEstimatedCost,
    totalItemsCount,
    notes: raw.notes ? String(raw.notes) : '',
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

const STATIC_CATALOG: CatalogItem[] = generateSeedCatalog().map((it, idx) => sanitizeCatalogItem(it, idx));
const STATIC_LISTS: MaterialList[] = INITIAL_SAMPLE_LISTS.map((l, idx) => sanitizeMaterialList(l, idx));
const STATIC_REQUISITIONS: SupplyRequisition[] = INITIAL_SAMPLE_REQUISITIONS.map((r, idx) => sanitizeRequisition(r, idx));
const STATIC_SETTINGS: AppSettings = DEFAULT_SETTINGS;

let cachedCatalog: CatalogItem[] | null = null;
let cachedLists: MaterialList[] | null = null;
let cachedRequisitions: SupplyRequisition[] | null = null;
let cachedSettings: AppSettings | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.CATALOG) cachedCatalog = null;
    if (e.key === STORAGE_KEYS.LISTS) cachedLists = null;
    if (e.key === STORAGE_KEYS.REQUISITIONS) cachedRequisitions = null;
    if (e.key === STORAGE_KEYS.SETTINGS) cachedSettings = null;
    callback();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

function getCatalogSnapshot(): CatalogItem[] {
  if (cachedCatalog) return cachedCatalog;
  if (typeof window === 'undefined') return STATIC_CATALOG;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed.map((it, idx) => sanitizeCatalogItem(it, idx));
        cachedCatalog = sanitized;
        return sanitized;
      }
    }
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(STATIC_CATALOG));
  } catch (e) {
    console.error('Error reading catalog:', e);
  }
  cachedCatalog = STATIC_CATALOG;
  return STATIC_CATALOG;
}

function getListsSnapshot(): MaterialList[] {
  if (cachedLists) return cachedLists;
  if (typeof window === 'undefined') return STATIC_LISTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LISTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed.map((l, idx) => sanitizeMaterialList(l, idx));
        cachedLists = sanitized;
        return sanitized;
      }
    }
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(STATIC_LISTS));
  } catch (e) {
    console.error('Error reading lists:', e);
  }
  cachedLists = STATIC_LISTS;
  return STATIC_LISTS;
}

function getRequisitionsSnapshot(): SupplyRequisition[] {
  if (cachedRequisitions) return cachedRequisitions;
  if (typeof window === 'undefined') return STATIC_REQUISITIONS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUISITIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed.map((r, idx) => sanitizeRequisition(r, idx));
        cachedRequisitions = sanitized;
        return sanitized;
      }
    }
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(STATIC_REQUISITIONS));
  } catch (e) {
    console.error('Error reading requisitions:', e);
  }
  cachedRequisitions = STATIC_REQUISITIONS;
  return STATIC_REQUISITIONS;
}

function getSettingsSnapshot(): AppSettings {
  if (cachedSettings) return cachedSettings;
  if (typeof window === 'undefined') return STATIC_SETTINGS;
  try {
    let saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) {
      saved = sessionStorage.getItem(STORAGE_KEYS.SETTINGS);
    }
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged: AppSettings = { ...STATIC_SETTINGS, ...parsed };
      cachedSettings = merged;
      return merged;
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(STATIC_SETTINGS));
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  cachedSettings = STATIC_SETTINGS;
  return STATIC_SETTINGS;
}

const getCatalogServerSnapshot = () => STATIC_CATALOG;
const getListsServerSnapshot = () => STATIC_LISTS;
const getRequisitionsServerSnapshot = () => STATIC_REQUISITIONS;
const getSettingsServerSnapshot = () => STATIC_SETTINGS;
const emptySubscribe = () => () => {};
const getIsLoadedClientSnapshot = () => true;
const getIsLoadedServerSnapshot = () => false;

export function useIndustrialStorage() {
  const catalog = useSyncExternalStore(
    subscribe,
    getCatalogSnapshot,
    getCatalogServerSnapshot
  );

  const lists = useSyncExternalStore(
    subscribe,
    getListsSnapshot,
    getListsServerSnapshot
  );

  const requisitions = useSyncExternalStore(
    subscribe,
    getRequisitionsSnapshot,
    getRequisitionsServerSnapshot
  );

  const settings = useSyncExternalStore(
    subscribe,
    getSettingsSnapshot,
    getSettingsServerSnapshot
  );

  // Reliable client-side hydration detection without cascading renders
  const isLoaded = useSyncExternalStore(
    emptySubscribe,
    getIsLoadedClientSnapshot,
    getIsLoadedServerSnapshot
  );

  // Save Catalog
  const saveCatalog = useCallback((newCatalog: CatalogItem[]) => {
    const sanitized = Array.isArray(newCatalog)
      ? newCatalog.map((it, idx) => sanitizeCatalogItem(it, idx))
      : STATIC_CATALOG;
    cachedCatalog = sanitized;
    try {
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Error saving catalog:', e);
    }
    notify();
  }, []);

  // Add/Save Item to Catalog
  const saveCatalogItem = useCallback((
    item: Omit<CatalogItem, 'id' | 'createdAt'>,
    id?: string
  ) => {
    const currentCatalog = getCatalogSnapshot();
    if (id) {
      // Editing existing item - keep code locked/immutable
      const existing = currentCatalog.find((it) => it.id === id);
      const safeCode = existing?.code || item.code || getNextCodeForGroup(item.group, currentCatalog);
      const updated = currentCatalog.map((it) =>
        it.id === id ? { ...it, ...item, code: safeCode } : it
      );
      saveCatalog(updated);
      return updated.find((it) => it.id === id);
    } else {
      // Creating new item - assign sequential code based on selected group
      const assignedCode =
        item.code?.trim().toUpperCase() ||
        getNextCodeForGroup(item.group || 'INSUMOS GERAIS', currentCatalog);

      const newItem: CatalogItem = {
        ...item,
        code: assignedCode,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newItem, ...currentCatalog];
      saveCatalog(updated);
      return newItem;
    }
  }, [saveCatalog]);

  // Delete Catalog Item (frees its sequential code number for reuse)
  const deleteCatalogItem = useCallback((id: string) => {
    const currentCatalog = getCatalogSnapshot();
    const updated = currentCatalog.filter((item) => item.id !== id);
    saveCatalog(updated);
  }, [saveCatalog]);

  // Reset Catalog to Default Database
  const resetCatalogToDefault = useCallback(() => {
    const freshCatalog = generateSeedCatalog();
    saveCatalog(freshCatalog);
  }, [saveCatalog]);

  // Regenerate and re-sequence all item codes according to 5-letter group prefix + 4 digits
  const regenerateAllCodes = useCallback(() => {
    const currentCatalog = getCatalogSnapshot();
    const { updatedCatalog, totalUpdated } = regenerateAllCatalogCodes(currentCatalog);
    saveCatalog(updatedCatalog);
    return {
      totalUpdated,
      totalItems: updatedCatalog.length,
    };
  }, [saveCatalog]);

  // Save Lists
  const saveLists = useCallback((newLists: MaterialList[]) => {
    const sanitized = Array.isArray(newLists)
      ? newLists.map((l, idx) => sanitizeMaterialList(l, idx))
      : STATIC_LISTS;
    cachedLists = sanitized;
    try {
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Error saving lists:', e);
    }
    notify();
  }, []);

  // Add or Update Material List
  const saveList = useCallback((list: MaterialList) => {
    const currentLists = getListsSnapshot();
    const exists = currentLists.some((l) => l.id === list.id);
    let updated: MaterialList[];
    const timestampedList = {
      ...list,
      updatedAt: new Date().toISOString(),
    };

    if (exists) {
      updated = currentLists.map((l) => (l.id === list.id ? timestampedList : l));
    } else {
      updated = [timestampedList, ...currentLists];
    }
    saveLists(updated);
    return timestampedList;
  }, [saveLists]);

  // Delete Material List
  const deleteList = useCallback((id: string) => {
    const currentLists = getListsSnapshot();
    const updated = currentLists.filter((l) => l.id !== id);
    saveLists(updated);
  }, [saveLists]);

  // Duplicate Material List
  const duplicateList = useCallback((id: string) => {
    const currentLists = getListsSnapshot();
    const source = currentLists.find((l) => l.id === id);
    if (!source) return null;

    const cloned: MaterialList = {
      ...source,
      id: `list-${Date.now()}`,
      name: `${source.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: source.items.map((it) => ({
        ...it,
        id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    const updated = [cloned, ...currentLists];
    saveLists(updated);
    return cloned;
  }, [saveLists]);

  // Save Requisitions
  const saveRequisitions = useCallback((newRequisitions: SupplyRequisition[]) => {
    const sanitized = Array.isArray(newRequisitions)
      ? newRequisitions.map((r, idx) => sanitizeRequisition(r, idx))
      : STATIC_REQUISITIONS;
    cachedRequisitions = sanitized;
    try {
      localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Error saving requisitions:', e);
    }
    notify();
  }, []);

  // Add or Update Supply Requisition
  const saveRequisition = useCallback((req: SupplyRequisition) => {
    const current = getRequisitionsSnapshot();
    const exists = current.some((r) => r.id === req.id);
    let updated: SupplyRequisition[];

    const sanitizedReq = sanitizeRequisition({
      ...req,
      updatedAt: new Date().toISOString(),
    });

    if (exists) {
      updated = current.map((r) => (r.id === req.id ? sanitizedReq : r));
    } else {
      updated = [sanitizedReq, ...current];
    }
    saveRequisitions(updated);
    return sanitizedReq;
  }, [saveRequisitions]);

  // Delete Requisition
  const deleteRequisition = useCallback((id: string) => {
    const current = getRequisitionsSnapshot();
    const updated = current.filter((r) => r.id !== id);
    saveRequisitions(updated);
  }, [saveRequisitions]);

  // Update Requisition Status
  const updateRequisitionStatus = useCallback((id: string, status: RequisitionStatus) => {
    const current = getRequisitionsSnapshot();
    const target = current.find((r) => r.id === id);
    if (!target) return;
    const updated = current.map((r) =>
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
    );
    saveRequisitions(updated);
  }, [saveRequisitions]);

  // Convert Requisition into an official Material List (BOM)
  const convertRequisitionToBOM = useCallback((requisitionId: string): MaterialList | null => {
    const currentReqs = getRequisitionsSnapshot();
    const req = currentReqs.find((r) => r.id === requisitionId);
    if (!req) return null;

    const currentCatalog = getCatalogSnapshot();
    const catalogMap = new Map<string, CatalogItem>();
    currentCatalog.forEach((it) => {
      catalogMap.set(it.id, it);
      if (it.code) catalogMap.set(it.code.toUpperCase(), it);
    });

    const newListItems: MaterialListItem[] = req.items.map((it, idx) => {
      const matchedCatalogItem = it.catalogItemId
        ? catalogMap.get(it.catalogItemId)
        : catalogMap.get((it.code || '').toUpperCase());

      const qty = Math.max(0.01, Number(it.quantity) || 1);
      const unitCost = matchedCatalogItem?.cost ?? it.estimatedCost ?? 0;
      const weightBar = matchedCatalogItem?.weightBar ?? 0;

      return {
        id: `li-from-req-${Date.now()}-${idx}`,
        itemId: matchedCatalogItem?.id,
        code: it.code || `INSUM-${String(idx + 1).padStart(4, '0')}`,
        description: it.description,
        group: it.group || 'INSUMOS GERAIS',
        unit: it.unit || 'PÇ',
        quantity: qty,
        unitCost,
        totalCost: qty * unitCost,
        weightBar,
        totalWeight: qty * weightBar,
        notes: it.notes || (it.destinationMachine ? `Aplicação: ${it.destinationMachine}` : ''),
      };
    });

    const newBOM: MaterialList = {
      id: `list-${Date.now()}`,
      name: `BOM - ${req.title || req.protocol}`,
      machine: req.destinationMachine || '',
      client: req.sector ? `Setor: ${req.sector}` : '',
      responsible: req.requesterName || '',
      date: new Date().toISOString().slice(0, 10),
      deliveryDate: req.neededByDate,
      status: 'Em Andamento',
      notes: `Gerada a partir da Requisição ${req.protocol}. Justificativa: ${req.justification || 'N/A'}${req.notes ? ` | Obs: ${req.notes}` : ''}`,
      items: newListItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveList(newBOM);

    // Optionally mark requisition as approved or converted
    updateRequisitionStatus(req.id, 'Aprovada');

    return newBOM;
  }, [saveList, updateRequisitionStatus]);

  // Save Settings
  const saveSettings = useCallback((newSettings: AppSettings) => {
    cachedSettings = newSettings;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
      try {
        sessionStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      } catch (err) {
        console.error('Error saving settings to sessionStorage:', err);
      }
    }
    notify();
  }, []);

  // Add Group
  const addGroup = useCallback((groupName: string) => {
    const currentSettings = getSettingsSnapshot();
    const trimmed = groupName.trim();
    if (!trimmed || currentSettings.groups.includes(trimmed)) return;
    const updatedGroups = [...currentSettings.groups, trimmed];
    saveSettings({ ...currentSettings, groups: updatedGroups });
  }, [saveSettings]);

  // Delete Group
  const deleteGroup = useCallback((groupName: string) => {
    const currentSettings = getSettingsSnapshot();
    const updatedGroups = currentSettings.groups.filter((g) => g !== groupName);
    saveSettings({ ...currentSettings, groups: updatedGroups });
  }, [saveSettings]);

  // Add Unit
  const addUnit = useCallback((unitName: string) => {
    const currentSettings = getSettingsSnapshot();
    const trimmed = unitName.trim().toUpperCase();
    if (!trimmed || currentSettings.units.includes(trimmed)) return;
    const updatedUnits = [...currentSettings.units, trimmed];
    saveSettings({ ...currentSettings, units: updatedUnits });
  }, [saveSettings]);

  // Delete Unit
  const deleteUnit = useCallback((unitName: string) => {
    const currentSettings = getSettingsSnapshot();
    const updatedUnits = currentSettings.units.filter((u) => u !== unitName);
    saveSettings({ ...currentSettings, units: updatedUnits });
  }, [saveSettings]);

  // Export full JSON backup
  const exportBackupJSON = useCallback(() => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings: getSettingsSnapshot(),
      catalog: getCatalogSnapshot(),
      lists: getListsSnapshot(),
      requisitions: getRequisitionsSnapshot(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sistema_materiais_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import JSON backup
  const importBackupJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.catalog && Array.isArray(data.catalog)) {
        saveCatalog(data.catalog);
      }
      if (data.lists && Array.isArray(data.lists)) {
        saveLists(data.lists);
      }
      if (data.requisitions && Array.isArray(data.requisitions)) {
        saveRequisitions(data.requisitions);
      }
      if (data.settings) {
        saveSettings(data.settings);
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }, [saveCatalog, saveLists, saveRequisitions, saveSettings]);

  return {
    isLoaded,
    catalog,
    lists,
    requisitions,
    settings,
    saveCatalog,
    saveCatalogItem,
    deleteCatalogItem,
    resetCatalogToDefault,
    regenerateAllCodes,
    saveList,
    deleteList,
    duplicateList,
    saveRequisitions,
    saveRequisition,
    deleteRequisition,
    updateRequisitionStatus,
    convertRequisitionToBOM,
    saveSettings,
    addGroup,
    deleteGroup,
    addUnit,
    deleteUnit,
    exportBackupJSON,
    importBackupJSON,
  };
}
