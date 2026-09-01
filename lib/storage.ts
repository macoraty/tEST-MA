'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { CatalogItem, MaterialList, AppSettings } from './types';
import { generateSeedCatalog, DEFAULT_SETTINGS, INITIAL_SAMPLE_LISTS } from './seedData';
import { getNextCodeForGroup, regenerateAllCatalogCodes } from './codeUtils';

const STORAGE_KEYS = {
  CATALOG: 'industrial_catalog_items_v1',
  LISTS: 'industrial_material_lists_v1',
  SETTINGS: 'industrial_app_settings_v1',
};

const STATIC_CATALOG: CatalogItem[] = generateSeedCatalog();
const STATIC_LISTS: MaterialList[] = INITIAL_SAMPLE_LISTS;
const STATIC_SETTINGS: AppSettings = DEFAULT_SETTINGS;

let cachedCatalog: CatalogItem[] | null = null;
let cachedLists: MaterialList[] | null = null;
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
        cachedCatalog = parsed;
        return parsed;
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
        cachedLists = parsed;
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(STATIC_LISTS));
  } catch (e) {
    console.error('Error reading lists:', e);
  }
  cachedLists = STATIC_LISTS;
  return STATIC_LISTS;
}

function getSettingsSnapshot(): AppSettings {
  if (cachedSettings) return cachedSettings;
  if (typeof window === 'undefined') return STATIC_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      cachedSettings = parsed;
      return parsed;
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
const getSettingsServerSnapshot = () => STATIC_SETTINGS;
const getIsLoadedServerSnapshot = () => false;
const getIsLoadedClientSnapshot = () => true;

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

  const settings = useSyncExternalStore(
    subscribe,
    getSettingsSnapshot,
    getSettingsServerSnapshot
  );

  const isLoaded = useSyncExternalStore(
    subscribe,
    getIsLoadedClientSnapshot,
    getIsLoadedServerSnapshot
  );

  // Save Catalog
  const saveCatalog = useCallback((newCatalog: CatalogItem[]) => {
    cachedCatalog = newCatalog;
    try {
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(newCatalog));
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
    cachedLists = newLists;
    try {
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(newLists));
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

  // Save Settings
  const saveSettings = useCallback((newSettings: AppSettings) => {
    cachedSettings = newSettings;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings:', e);
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
      if (data.settings) {
        saveSettings(data.settings);
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }, [saveCatalog, saveLists, saveSettings]);

  return {
    isLoaded,
    catalog,
    lists,
    settings,
    saveCatalog,
    saveCatalogItem,
    deleteCatalogItem,
    resetCatalogToDefault,
    regenerateAllCodes,
    saveList,
    deleteList,
    duplicateList,
    saveSettings,
    addGroup,
    deleteGroup,
    addUnit,
    deleteUnit,
    exportBackupJSON,
    importBackupJSON,
  };
}
