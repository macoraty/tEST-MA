'use client';

import React, { useState } from 'react';
import { useIndustrialStorage } from '@/lib/storage';
import { MaterialList, CatalogItem, ActiveTab } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { ListsView } from '@/components/ListsView';
import { ListEditor } from '@/components/ListEditor';
import { CatalogView } from '@/components/CatalogView';
import { SettingsView } from '@/components/SettingsView';
import { ListHeaderModal } from '@/components/ListHeaderModal';
import { ItemModal } from '@/components/ItemModal';
import { WhatsAppModal } from '@/components/WhatsAppModal';
import { ListPreviewModal } from '@/components/ListPreviewModal';

export default function Home() {
  const {
    lists,
    catalog,
    settings,
    isLoaded,
    saveList,
    deleteList,
    duplicateList,
    saveCatalogItem,
    deleteCatalogItem,
    resetCatalogToDefault,
    regenerateAllCodes,
    saveSettings,
    addGroup,
    deleteGroup,
    addUnit,
    deleteUnit,
    exportBackupJSON,
    importBackupJSON,
  } = useIndustrialStorage();

  // Navigation & View states
  const [activeTab, setActiveTab] = useState<ActiveTab>('lists');
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Modals state
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [editingHeaderList, setEditingHeaderList] = useState<MaterialList | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewList, setPreviewList] = useState<MaterialList | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetList, setWhatsAppTargetList] = useState<MaterialList | null>(null);

  // Currently active list for the editor
  const activeEditingList = lists.find((l) => l.id === activeListId) || null;

  // Handlers for List creation flow
  const handleOpenNewListModal = () => {
    setEditingHeaderList(null);
    setIsHeaderModalOpen(true);
  };

  const handleSaveListHeader = (
    headerData: Omit<MaterialList, 'id' | 'items' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    let targetListId = id;

    if (id) {
      // Editing existing list metadata
      const existing = lists.find((l) => l.id === id);
      if (existing) {
        const updated: MaterialList = {
          ...existing,
          ...headerData,
          updatedAt: new Date().toISOString(),
        };
        saveList(updated);
      }
    } else {
      // Creating new list
      const newListId = `list-${Date.now()}`;
      const newList: MaterialList = {
        ...headerData,
        id: newListId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveList(newList);
      targetListId = newListId;
    }

    setIsHeaderModalOpen(false);
    setEditingHeaderList(null);

    // Prompt requirement: "em seguida ao salva, abrir uma pagina para criar a lista, onde vai ter um campo, para fazer a pesquisa o item..."
    if (targetListId) {
      setActiveListId(targetListId);
    }
  };

  // Open existing list for item editing
  const handleEditList = (list: MaterialList) => {
    setActiveListId(list.id);
  };

  // Open WhatsApp share
  const handleOpenWhatsApp = (list: MaterialList) => {
    setWhatsAppTargetList(list);
    setIsWhatsAppModalOpen(true);
  };

  // Handlers for Catalog Item Modal
  const handleOpenAddItemModal = () => {
    setEditingCatalogItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditCatalogItem = (item: CatalogItem) => {
    setEditingCatalogItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItemModal = (
    itemData: Omit<CatalogItem, 'id' | 'createdAt'>,
    id?: string
  ) => {
    saveCatalogItem(itemData, id);
    setIsItemModalOpen(false);
    setEditingCatalogItem(null);
  };

  // If loading from localStorage
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-xs text-zinc-400">Carregando banco de dados industrial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-16 text-zinc-100 selection:bg-cyan-500 selection:text-zinc-950">
      {/* Top Main Navigation Bar */}
      <Navbar
        activeTab={activeEditingList ? 'new-list' : activeTab}
        setActiveTab={(tab) => {
          if (tab === 'new-list') {
            handleOpenNewListModal();
          } else {
            setActiveListId(null);
            setActiveTab(tab);
          }
        }}
        onOpenNewListModal={handleOpenNewListModal}
        listsCount={lists.length}
        catalogCount={catalog.length}
        settings={settings}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Render View based on state */}
        {activeEditingList ? (
          /* LIST EDITOR (SEARCH & ADD ITEMS VIEW) */
          <ListEditor
            key={activeEditingList.id}
            list={activeEditingList}
            catalog={catalog}
            settings={settings}
            onSaveList={(updated) => {
              saveList(updated);
            }}
            onBackToLists={() => {
              setActiveListId(null);
              setActiveTab('lists');
            }}
            onEditHeader={() => {
              setEditingHeaderList(activeEditingList);
              setIsHeaderModalOpen(true);
            }}
            onOpenWhatsApp={handleOpenWhatsApp}
          />
        ) : activeTab === 'lists' ? (
          /* LISTS OVERVIEW (MAIN LISTS VIEW) */
          <ListsView
            lists={lists}
            settings={settings}
            onOpenNewListModal={handleOpenNewListModal}
            onPreviewList={(list) => {
              setPreviewList(list);
              setIsPreviewModalOpen(true);
            }}
            onEditList={handleEditList}
            onDuplicateList={duplicateList}
            onDeleteList={deleteList}
            onOpenWhatsApp={handleOpenWhatsApp}
          />
        ) : activeTab === 'catalog' ? (
          /* CATALOG MANAGEMENT VIEW */
          <CatalogView
            catalog={catalog}
            settings={settings}
            onOpenAddItemModal={handleOpenAddItemModal}
            onEditItem={handleEditCatalogItem}
            onDeleteItem={deleteCatalogItem}
            onResetToDefault={resetCatalogToDefault}
          />
        ) : (
          /* SETTINGS VIEW */
          <SettingsView
            settings={settings}
            catalog={catalog}
            onSaveSettings={saveSettings}
            onAddGroup={addGroup}
            onDeleteGroup={deleteGroup}
            onAddUnit={addUnit}
            onDeleteUnit={deleteUnit}
            onExportBackup={exportBackupJSON}
            onImportBackup={importBackupJSON}
            onResetCatalog={resetCatalogToDefault}
            onRegenerateAllCodes={regenerateAllCodes}
          />
        )}
      </main>

      {/* MODAL 1: Create / Edit List Header (Name, Machine, Client, etc.) */}
      <ListHeaderModal
        isOpen={isHeaderModalOpen}
        onClose={() => {
          setIsHeaderModalOpen(false);
          setEditingHeaderList(null);
        }}
        onSave={handleSaveListHeader}
        initialList={editingHeaderList}
        settings={settings}
        existingMachines={Array.from(new Set(lists.map((l) => l.machine).filter(Boolean)))}
        existingClients={Array.from(new Set(lists.map((l) => l.client).filter(Boolean)))}
      />

      {/* MODAL 2: Add / Edit Catalog Item */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingCatalogItem(null);
        }}
        onSave={handleSaveItemModal}
        initialItem={editingCatalogItem}
        catalog={catalog}
        groups={settings.groups}
        units={settings.units}
        currencySymbol={settings.currencySymbol}
      />

      {/* MODAL 3: WhatsApp Share & Preview Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setWhatsAppTargetList(null);
        }}
        list={whatsAppTargetList}
        settings={settings}
      />

      {/* MODAL 4: Visualizar Lista Completa (Preview Modal) */}
      <ListPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewList(null);
        }}
        list={previewList}
        settings={settings}
        onEditList={(list) => {
          setIsPreviewModalOpen(false);
          setPreviewList(null);
          handleEditList(list);
        }}
        onOpenWhatsApp={(list) => {
          setIsPreviewModalOpen(false);
          setPreviewList(null);
          handleOpenWhatsApp(list);
        }}
      />
    </div>
  );
}
