'use client';

import { useState } from 'react';
import { CatalogItem, MaterialList, AppSettings } from './types';
import { generateSeedCatalog, DEFAULT_SETTINGS, INITIAL_SAMPLE_LISTS } from './seedData';

const STORAGE_KEYS = {
  CATALOG: 'industrial_catalog_items_v1',
  LISTS: 'industrial_material_lists_v1',
  SETTINGS: 'industrial_app_settings_v1',
};

function getInitialSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Error loading settings from localStorage:', e);
    return DEFAULT_SETTINGS;
  }
}

function getInitialCatalog(): CatalogItem[] {
  if (typeof window === 'undefined') return generateSeedCatalog();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const seeded = generateSeedCatalog();
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(seeded));
    return seeded;
  } catch (e) {
    console.error('Error loading catalog from localStorage:', e);
    return generateSeedCatalog();
  }
}

function getInitialLists(): MaterialList[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_LISTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LISTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(INITIAL_SAMPLE_LISTS));
    return INITIAL_SAMPLE_LISTS;
  } catch (e) {
    console.error('Error loading lists from localStorage:', e);
    return INITIAL_SAMPLE_LISTS;
  }
}

export function useIndustrialStorage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(getInitialCatalog);
  const [lists, setLists] = useState<MaterialList[]>(getInitialLists);
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const isLoaded = true;

  // Save Catalog
  const saveCatalog = (newCatalog: CatalogItem[]) => {
    setCatalog(newCatalog);
    try {
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(newCatalog));
    } catch (e) {
      console.error('Error saving catalog:', e);
    }
  };

  // Add/Save Item to Catalog
  const saveCatalogItem = (
    item: Omit<CatalogItem, 'id' | 'createdAt'>,
    id?: string
  ) => {
    if (id) {
      const updated = catalog.map((it) => (it.id === id ? { ...it, ...item } : it));
      saveCatalog(updated);
      return updated.find((it) => it.id === id);
    } else {
      const newItem: CatalogItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newItem, ...catalog];
      saveCatalog(updated);
      return newItem;
    }
  };

  // Delete Catalog Item
  const deleteCatalogItem = (id: string) => {
    const updated = catalog.filter((item) => item.id !== id);
    saveCatalog(updated);
  };

  // Reset Catalog to Default Database
  const resetCatalogToDefault = () => {
    const freshCatalog = generateSeedCatalog();
    saveCatalog(freshCatalog);
  };

  // Save Lists
  const saveLists = (newLists: MaterialList[]) => {
    setLists(newLists);
    try {
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(newLists));
    } catch (e) {
      console.error('Error saving lists:', e);
    }
  };

  // Add or Update Material List
  const saveList = (list: MaterialList) => {
    const exists = lists.some((l) => l.id === list.id);
    let updated: MaterialList[];
    const timestampedList = {
      ...list,
      updatedAt: new Date().toISOString(),
    };

    if (exists) {
      updated = lists.map((l) => (l.id === list.id ? timestampedList : l));
    } else {
      updated = [timestampedList, ...lists];
    }
    saveLists(updated);
    return timestampedList;
  };

  // Delete Material List
  const deleteList = (id: string) => {
    const updated = lists.filter((l) => l.id !== id);
    saveLists(updated);
  };

  // Duplicate Material List
  const duplicateList = (id: string) => {
    const source = lists.find((l) => l.id === id);
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

    const updated = [cloned, ...lists];
    saveLists(updated);
    return cloned;
  };

  // Save Settings
  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  // Add Group
  const addGroup = (groupName: string) => {
    const trimmed = groupName.trim();
    if (!trimmed || settings.groups.includes(trimmed)) return;
    const updatedGroups = [...settings.groups, trimmed];
    saveSettings({ ...settings, groups: updatedGroups });
  };

  // Delete Group
  const deleteGroup = (groupName: string) => {
    const updatedGroups = settings.groups.filter((g) => g !== groupName);
    saveSettings({ ...settings, groups: updatedGroups });
  };

  // Add Unit
  const addUnit = (unitName: string) => {
    const trimmed = unitName.trim().toUpperCase();
    if (!trimmed || settings.units.includes(trimmed)) return;
    const updatedUnits = [...settings.units, trimmed];
    saveSettings({ ...settings, units: updatedUnits });
  };

  // Delete Unit
  const deleteUnit = (unitName: string) => {
    const updatedUnits = settings.units.filter((u) => u !== unitName);
    saveSettings({ ...settings, units: updatedUnits });
  };

  // Export full JSON backup
  const exportBackupJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings,
      catalog,
      lists,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sistema_materiais_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const importBackupJSON = (jsonString: string): boolean => {
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
  };

  return {
    isLoaded,
    catalog,
    lists,
    settings,
    saveCatalog,
    saveCatalogItem,
    deleteCatalogItem,
    resetCatalogToDefault,
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
