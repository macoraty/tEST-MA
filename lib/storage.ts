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
import {
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  syncDataToSupabase,
  loadDataFromSupabase,
  testSupabaseConnection,
  getSupabaseClient,
  SUPABASE_SETUP_SQL,
} from './supabase';
import { DatabaseProvider, SupabaseConfig } from './types';

const STORAGE_KEYS = {
  CATALOG: 'industrial_catalog_items_v1',
  LISTS: 'industrial_material_lists_v1',
  REQUISITIONS: 'industrial_requisitions_v1',
  SETTINGS: 'industrial_app_settings_v1',
  ACTIVE_PROVIDER: 'industrial_active_database_provider_v1',
  LAST_BACKUP: 'industrial_last_backup_timestamp_v1',
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
let cloudSyncStatus: 'synced' | 'syncing' | 'offline' = 'syncing';
let isFirestoreInitialized = false;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function seedCatalogToFirestore(items: CatalogItem[]) {
  if (!items || items.length === 0) return;
  try {
    const chunkSize = 200;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((it) => {
        batch.set(doc(db, 'catalog', it.id), it);
      });
      await batch.commit();
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'catalog');
  }
}

async function seedListsToFirestore(lists: MaterialList[]) {
  if (!lists || lists.length === 0) return;
  try {
    const batch = writeBatch(db);
    lists.forEach((l) => {
      batch.set(doc(db, 'lists', l.id), l);
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'lists');
  }
}

async function seedRequisitionsToFirestore(reqs: SupplyRequisition[]) {
  if (!reqs || reqs.length === 0) return;
  try {
    const batch = writeBatch(db);
    reqs.forEach((r) => {
      batch.set(doc(db, 'requisitions', r.id), r);
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'requisitions');
  }
}

function initFirestoreSync() {
  if (typeof window === 'undefined' || isFirestoreInitialized) return;
  isFirestoreInitialized = true;

  testFirestoreConnection().catch(() => {
    cloudSyncStatus = 'offline';
    notify();
  });

  // 1. Real-time Catalog Sync
  try {
    const catalogCol = collection(db, 'catalog');
    onSnapshot(
      catalogCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: CatalogItem[] = [];
          snapshot.forEach((d) => {
            items.push(sanitizeCatalogItem({ ...d.data(), id: d.id }));
          });
          cachedCatalog = items;
          try {
            localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(items));
          } catch {}
          cloudSyncStatus = 'synced';
          notify();
        } else {
          const localCatalog = getCatalogSnapshot();
          if (localCatalog && localCatalog.length > 0) {
            seedCatalogToFirestore(localCatalog);
          }
        }
      },
      (error) => {
        cloudSyncStatus = 'offline';
        notify();
        handleFirestoreError(error, OperationType.LIST, 'catalog');
      }
    );
  } catch (err) {
    console.warn('Firestore catalog listener:', err);
  }

  // 2. Real-time Lists Sync
  try {
    const listsCol = collection(db, 'lists');
    onSnapshot(
      listsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedLists: MaterialList[] = [];
          snapshot.forEach((d) => {
            loadedLists.push(sanitizeMaterialList({ ...d.data(), id: d.id }));
          });
          cachedLists = loadedLists;
          try {
            localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(loadedLists));
          } catch {}
          cloudSyncStatus = 'synced';
          notify();
        } else {
          const localLists = getListsSnapshot();
          if (localLists && localLists.length > 0) {
            seedListsToFirestore(localLists);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'lists');
      }
    );
  } catch (err) {
    console.warn('Firestore lists listener:', err);
  }

  // 3. Real-time Requisitions Sync
  try {
    const reqsCol = collection(db, 'requisitions');
    onSnapshot(
      reqsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedReqs: SupplyRequisition[] = [];
          snapshot.forEach((d) => {
            loadedReqs.push(sanitizeRequisition({ ...d.data(), id: d.id }));
          });
          cachedRequisitions = loadedReqs;
          try {
            localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(loadedReqs));
          } catch {}
          cloudSyncStatus = 'synced';
          notify();
        } else {
          const localReqs = getRequisitionsSnapshot();
          if (localReqs && localReqs.length > 0) {
            seedRequisitionsToFirestore(localReqs);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'requisitions');
      }
    );
  } catch (err) {
    console.warn('Firestore requisitions listener:', err);
  }

  // 4. Real-time Settings Sync
  try {
    const settingsDoc = doc(db, 'settings', 'default');
    onSnapshot(
      settingsDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const merged: AppSettings = { ...STATIC_SETTINGS, ...data };
          cachedSettings = merged;
          try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
          } catch {}
          cloudSyncStatus = 'synced';
          notify();
        } else {
          const localSettings = getSettingsSnapshot();
          setDoc(settingsDoc, localSettings).catch((e) =>
            handleFirestoreError(e, OperationType.WRITE, 'settings/default')
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/default');
      }
    );
  } catch (err) {
    console.warn('Firestore settings listener:', err);
  }
}

let isSupabaseSyncRunning = false;
let cachedActiveProvider: DatabaseProvider = 'supabase';

export function getActiveDatabaseProviderSnapshot(): DatabaseProvider {
  return 'supabase';
}

export function getLastBackupTimestampSnapshot(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  return saved ? Number(saved) || 0 : 0;
}

async function initSupabaseSync() {
  if (typeof window === 'undefined' || isSupabaseSyncRunning) return;
  isSupabaseSyncRunning = true;

  const client = getSupabaseClient();
  if (!client) {
    cloudSyncStatus = 'offline';
    notify();
    isSupabaseSyncRunning = false;
    return;
  }

  cloudSyncStatus = 'syncing';
  notify();

  try {
    // 1. Catalog
    const remoteCatalog = (await loadDataFromSupabase('catalog')) as CatalogItem[] | null;
    if (remoteCatalog && Array.isArray(remoteCatalog) && remoteCatalog.length > 0) {
      const sanitized = remoteCatalog.map((it, idx) => sanitizeCatalogItem(it, idx));
      cachedCatalog = sanitized;
      try {
        localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(sanitized));
      } catch {}
    } else {
      const local = getCatalogSnapshot();
      if (local && local.length > 0) {
        await syncDataToSupabase('catalog', local);
      }
    }

    // 2. Lists
    const remoteLists = (await loadDataFromSupabase('lists')) as MaterialList[] | null;
    if (remoteLists && Array.isArray(remoteLists) && remoteLists.length > 0) {
      const sanitized = remoteLists.map((l, idx) => sanitizeMaterialList(l, idx));
      cachedLists = sanitized;
      try {
        localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(sanitized));
      } catch {}
    } else {
      const localLists = getListsSnapshot();
      if (localLists && localLists.length > 0) {
        await syncDataToSupabase('lists', localLists);
      }
    }

    // 3. Requisitions
    const remoteReqs = (await loadDataFromSupabase('requisitions')) as SupplyRequisition[] | null;
    if (remoteReqs && Array.isArray(remoteReqs) && remoteReqs.length > 0) {
      const sanitized = remoteReqs.map((r, idx) => sanitizeRequisition(r, idx));
      cachedRequisitions = sanitized;
      try {
        localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(sanitized));
      } catch {}
    } else {
      const localReqs = getRequisitionsSnapshot();
      if (localReqs && localReqs.length > 0) {
        await syncDataToSupabase('requisitions', localReqs);
      }
    }

    // 4. Settings
    const remoteSettings = (await loadDataFromSupabase('settings')) as AppSettings | null;
    if (remoteSettings) {
      const merged: AppSettings = { ...STATIC_SETTINGS, ...remoteSettings };
      cachedSettings = merged;
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      } catch {}
    } else {
      const localSettings = getSettingsSnapshot();
      await syncDataToSupabase('settings', localSettings);
    }

    cloudSyncStatus = 'synced';
  } catch (err) {
    console.error('Supabase sync error:', err);
    cloudSyncStatus = 'offline';
  } finally {
    isSupabaseSyncRunning = false;
    notify();
  }
}

function initActiveDatabaseSync() {
  initSupabaseSync();
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
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
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
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
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
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
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
  if (typeof window !== 'undefined') {
    initActiveDatabaseSync();
  }

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

  const syncStatus = useSyncExternalStore(
    subscribe,
    () => cloudSyncStatus,
    () => 'syncing' as const
  );

  const activeDatabaseProvider = useSyncExternalStore(
    subscribe,
    getActiveDatabaseProviderSnapshot,
    () => 'firebase' as DatabaseProvider
  );

  const lastBackupTimestamp = useSyncExternalStore(
    subscribe,
    getLastBackupTimestampSnapshot,
    () => 0
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

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      seedCatalogToFirestore(sanitized);
    } else if (prov === 'supabase') {
      syncDataToSupabase('catalog', sanitized);
    }
  }, []);

  // Add/Save Item to Catalog
  const saveCatalogItem = useCallback((
    item: Omit<CatalogItem, 'id' | 'createdAt'>,
    id?: string
  ) => {
    const currentCatalog = getCatalogSnapshot();
    const prov = getActiveDatabaseProviderSnapshot();

    if (id) {
      // Editing existing item - keep code locked/immutable
      const existing = currentCatalog.find((it) => it.id === id);
      const safeCode = existing?.code || item.code || getNextCodeForGroup(item.group, currentCatalog);
      const updatedItem = sanitizeCatalogItem({ ...existing, ...item, id, code: safeCode });
      const updated = currentCatalog.map((it) =>
        it.id === id ? updatedItem : it
      );
      saveCatalog(updated);

      if (prov === 'firebase') {
        setDoc(doc(db, 'catalog', id), updatedItem).catch((e) =>
          handleFirestoreError(e, OperationType.UPDATE, `catalog/${id}`)
        );
      } else if (prov === 'supabase') {
        syncDataToSupabase('catalog', updated);
      }
      return updatedItem;
    } else {
      // Creating new item - assign sequential code based on selected group
      const assignedCode =
        item.code?.trim().toUpperCase() ||
        getNextCodeForGroup(item.group || 'INSUMOS GERAIS', currentCatalog);

      const newItem: CatalogItem = sanitizeCatalogItem({
        ...item,
        code: assignedCode,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      });
      const updated = [newItem, ...currentCatalog];
      saveCatalog(updated);

      if (prov === 'firebase') {
        setDoc(doc(db, 'catalog', newItem.id), newItem).catch((e) =>
          handleFirestoreError(e, OperationType.CREATE, `catalog/${newItem.id}`)
        );
      } else if (prov === 'supabase') {
        syncDataToSupabase('catalog', updated);
      }
      return newItem;
    }
  }, [saveCatalog]);

  // Delete Catalog Item (frees its sequential code number for reuse)
  const deleteCatalogItem = useCallback((id: string) => {
    const currentCatalog = getCatalogSnapshot();
    const updated = currentCatalog.filter((item) => item.id !== id);
    saveCatalog(updated);

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      deleteDoc(doc(db, 'catalog', id)).catch((e) =>
        handleFirestoreError(e, OperationType.DELETE, `catalog/${id}`)
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('catalog', updated);
    }
  }, [saveCatalog]);

  // Delete multiple Catalog Items at once
  const deleteMultipleCatalogItems = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idsSet = new Set(ids);
    const currentCatalog = getCatalogSnapshot();
    const updated = currentCatalog.filter((item) => !idsSet.has(item.id));
    saveCatalog(updated);

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      try {
        const batch = writeBatch(db);
        ids.forEach((id) => batch.delete(doc(db, 'catalog', id)));
        batch.commit().catch((e) =>
          handleFirestoreError(e, OperationType.DELETE, 'catalog')
        );
      } catch (e) {
        console.error('Error batch deleting items:', e);
      }
    } else if (prov === 'supabase') {
      syncDataToSupabase('catalog', updated);
    }
  }, [saveCatalog]);

  // Clear / Delete all Catalog Items
  const clearAllCatalogItems = useCallback(async () => {
    saveCatalog([]);
    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      try {
        const snap = await getDocs(collection(db, 'catalog'));
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'catalog');
      }
    } else if (prov === 'supabase') {
      await syncDataToSupabase('catalog', []);
    }
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

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      seedListsToFirestore(sanitized);
    } else if (prov === 'supabase') {
      syncDataToSupabase('lists', sanitized);
    }
  }, []);

  // Add or Update Material List
  const saveList = useCallback((list: MaterialList) => {
    const currentLists = getListsSnapshot();
    const exists = currentLists.some((l) => l.id === list.id);
    let updated: MaterialList[];
    const timestampedList = {
      ...sanitizeMaterialList(list),
      updatedAt: new Date().toISOString(),
    };

    if (exists) {
      updated = currentLists.map((l) => (l.id === list.id ? timestampedList : l));
    } else {
      updated = [timestampedList, ...currentLists];
    }
    saveLists(updated);

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      setDoc(doc(db, 'lists', timestampedList.id), timestampedList).catch((e) =>
        handleFirestoreError(e, OperationType.WRITE, `lists/${timestampedList.id}`)
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('lists', updated);
    }
    return timestampedList;
  }, [saveLists]);

  // Delete Material List
  const deleteList = useCallback((id: string) => {
    const currentLists = getListsSnapshot();
    const updated = currentLists.filter((l) => l.id !== id);
    saveLists(updated);

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      deleteDoc(doc(db, 'lists', id)).catch((e) =>
        handleFirestoreError(e, OperationType.DELETE, `lists/${id}`)
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('lists', updated);
    }
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

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      setDoc(doc(db, 'lists', cloned.id), cloned).catch((e) =>
        handleFirestoreError(e, OperationType.WRITE, `lists/${cloned.id}`)
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('lists', updated);
    }
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

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      seedRequisitionsToFirestore(sanitized);
    } else if (prov === 'supabase') {
      syncDataToSupabase('requisitions', sanitized);
    }
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

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      setDoc(doc(db, 'requisitions', sanitizedReq.id), sanitizedReq).catch((e) =>
        handleFirestoreError(e, OperationType.WRITE, `requisitions/${sanitizedReq.id}`)
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('requisitions', updated);
    }
    return sanitizedReq;
  }, [saveRequisitions]);

  // Delete Requisition
  const deleteRequisition = useCallback((id: string) => {
    const current = getRequisitionsSnapshot();
    const updated = current.filter((r) => r.id !== id);
    saveRequisitions(updated);

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      deleteDoc(doc(db, 'requisitions', id)).catch((e) =>
        handleFirestoreError(e, OperationType.DELETE, `requisitions/${id}`)
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('requisitions', updated);
    }
  }, [saveRequisitions]);

  // Update Requisition Status
  const updateRequisitionStatus = useCallback((id: string, status: RequisitionStatus) => {
    const current = getRequisitionsSnapshot();
    const target = current.find((r) => r.id === id);
    if (!target) return;
    const updatedReq = { ...target, status, updatedAt: new Date().toISOString() };
    const updated = current.map((r) =>
      r.id === id ? updatedReq : r
    );
    saveRequisitions(updated);

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      setDoc(doc(db, 'requisitions', id), updatedReq).catch((e) =>
        handleFirestoreError(e, OperationType.UPDATE, `requisitions/${id}`)
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('requisitions', updated);
    }
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

    const prov = getActiveDatabaseProviderSnapshot();
    if (prov === 'firebase') {
      setDoc(doc(db, 'settings', 'default'), newSettings).catch((e) =>
        handleFirestoreError(e, OperationType.WRITE, 'settings/default')
      );
    } else if (prov === 'supabase') {
      syncDataToSupabase('settings', newSettings);
    }
  }, []);

  // Add Group
  const addGroup = useCallback((groupName: string) => {
    const currentSettings = getSettingsSnapshot();
    const trimmed = groupName.trim();
    if (!trimmed || currentSettings.groups.includes(trimmed)) return;
    const updatedGroups = [...currentSettings.groups, trimmed];
    saveSettings({ ...currentSettings, groups: updatedGroups });
  }, [saveSettings]);

  // Edit Group (and cascade to catalog and lists)
  const editGroup = useCallback((oldName: string, newName: string) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) return;

    // 1. Update settings
    const currentSettings = getSettingsSnapshot();
    const updatedGroups = currentSettings.groups.map((g) => (g === trimmedOld ? trimmedNew : g));
    saveSettings({ ...currentSettings, groups: updatedGroups });

    // 2. Cascade update to catalog
    const currentCatalog = getCatalogSnapshot();
    let hasChanges = false;
    const updatedCatalog = currentCatalog.map((item) => {
      if (item.group === trimmedOld) {
        hasChanges = true;
        return { ...item, group: trimmedNew };
      }
      return item;
    });
    if (hasChanges) {
      saveCatalog(updatedCatalog);
    }

    // 3. Cascade update to lists
    const currentLists = getListsSnapshot();
    let listsChanged = false;
    const updatedLists = currentLists.map((list) => {
      let listItemsChanged = false;
      const updatedItems = list.items.map((it) => {
        if (it.group === trimmedOld) {
          listItemsChanged = true;
          return { ...it, group: trimmedNew };
        }
        return it;
      });
      if (listItemsChanged) {
        listsChanged = true;
        return { ...list, items: updatedItems, updatedAt: new Date().toISOString() };
      }
      return list;
    });
    if (listsChanged) {
      saveLists(updatedLists);
    }
  }, [saveSettings, saveCatalog, saveLists]);

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

  // Edit Unit (and cascade to catalog and lists)
  const editUnit = useCallback((oldUnit: string, newUnit: string) => {
    const trimmedOld = oldUnit.trim().toUpperCase();
    const trimmedNew = newUnit.trim().toUpperCase();
    if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) return;

    // 1. Update settings
    const currentSettings = getSettingsSnapshot();
    const updatedUnits = currentSettings.units.map((u) => (u.toUpperCase() === trimmedOld ? trimmedNew : u));
    saveSettings({ ...currentSettings, units: updatedUnits });

    // 2. Cascade update to catalog
    const currentCatalog = getCatalogSnapshot();
    let hasChanges = false;
    const updatedCatalog = currentCatalog.map((item) => {
      if ((item.unit || '').toUpperCase() === trimmedOld) {
        hasChanges = true;
        return { ...item, unit: trimmedNew };
      }
      return item;
    });
    if (hasChanges) {
      saveCatalog(updatedCatalog);
    }

    // 3. Cascade update to lists
    const currentLists = getListsSnapshot();
    let listsChanged = false;
    const updatedLists = currentLists.map((list) => {
      let listItemsChanged = false;
      const updatedItems = list.items.map((it) => {
        if ((it.unit || '').toUpperCase() === trimmedOld) {
          listItemsChanged = true;
          return { ...it, unit: trimmedNew };
        }
        return it;
      });
      if (listItemsChanged) {
        listsChanged = true;
        return { ...list, items: updatedItems, updatedAt: new Date().toISOString() };
      }
      return list;
    });
    if (listsChanged) {
      saveLists(updatedLists);
    }
  }, [saveSettings, saveCatalog, saveLists]);

  // Delete Unit
  const deleteUnit = useCallback((unitName: string) => {
    const currentSettings = getSettingsSnapshot();
    const updatedUnits = currentSettings.units.filter((u) => u !== unitName);
    saveSettings({ ...currentSettings, units: updatedUnits });
  }, [saveSettings]);

  // Export full JSON backup with timestamp tracking
  const exportBackupJSON = useCallback(() => {
    const curProvider = getActiveDatabaseProviderSnapshot();
    const backupData = {
      timestamp: new Date().toISOString(),
      provider: curProvider,
      version: '1.2',
      settings: getSettingsSnapshot(),
      catalog: getCatalogSnapshot(),
      lists: getListsSnapshot(),
      requisitions: getRequisitionsSnapshot(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_seguranca_${curProvider}_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, String(Date.now()));
    }
    notify();
    return backupData;
  }, []);

  // Switch Database Provider (requires backup confirmation)
  const switchDatabaseProvider = useCallback(async (
    targetProvider: DatabaseProvider,
    options?: { migrateData?: boolean; backupConfirmed?: boolean }
  ): Promise<{ success: boolean; message: string }> => {
    const currentProvider = getActiveDatabaseProviderSnapshot();
    if (currentProvider === targetProvider) {
      return { success: true, message: `O banco ${targetProvider.toUpperCase()} já está ativo.` };
    }

    if (!options?.backupConfirmed) {
      return {
        success: false,
        message: 'É obrigatório realizar o download do backup de segurança antes de mudar de banco de dados.',
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, targetProvider);
      cachedActiveProvider = targetProvider;
    }

    // Migration of current local data into target database
    if (options?.migrateData) {
      const curCatalog = getCatalogSnapshot();
      const curLists = getListsSnapshot();
      const curReqs = getRequisitionsSnapshot();
      const curSettings = getSettingsSnapshot();

      if (targetProvider === 'supabase') {
        await syncDataToSupabase('catalog', curCatalog);
        await syncDataToSupabase('lists', curLists);
        await syncDataToSupabase('requisitions', curReqs);
        await syncDataToSupabase('settings', curSettings);
      } else if (targetProvider === 'firebase') {
        await seedCatalogToFirestore(curCatalog);
        await seedListsToFirestore(curLists);
        await seedRequisitionsToFirestore(curReqs);
        setDoc(doc(db, 'settings', 'default'), curSettings).catch(() => {});
      }
    }

    if (targetProvider === 'supabase') {
      isSupabaseSyncRunning = false;
      await initSupabaseSync();
    } else {
      isFirestoreInitialized = false;
      initFirestoreSync();
    }

    notify();
    return {
      success: true,
      message: `Banco de dados alternado para ${targetProvider === 'supabase' ? 'Supabase' : 'Firebase'}.`,
    };
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
    deleteMultipleCatalogItems,
    clearAllCatalogItems,
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
    editGroup,
    deleteGroup,
    addUnit,
    editUnit,
    deleteUnit,
    exportBackupJSON,
    importBackupJSON,
    syncStatus,
    activeDatabaseProvider,
    lastBackupTimestamp,
    switchDatabaseProvider,
    getSavedSupabaseConfig,
    saveSupabaseConfig,
    testSupabaseConnection,
    SUPABASE_SETUP_SQL,
    isCloudConnected: true,
    cloudDatabaseName: 'Supabase Cloud DB (PostgreSQL)',
  };
}
