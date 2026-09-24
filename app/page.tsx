'use client';

import React, { useState, useEffect } from 'react';
import { useIndustrialStorage } from '@/lib/storage';
import { MaterialList, CatalogItem, SupplyRequisition, ActiveTab } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { ListsView } from '@/components/ListsView';
import { ListEditor } from '@/components/ListEditor';
import { CatalogView } from '@/components/CatalogView';
import { SettingsView } from '@/components/SettingsView';
import { RequisitionsView } from '@/components/RequisitionsView';
import { RequisitionModal } from '@/components/RequisitionModal';
import { RequisitionPreviewModal } from '@/components/RequisitionPreviewModal';
import { ListHeaderModal } from '@/components/ListHeaderModal';
import { ItemModal } from '@/components/ItemModal';
import { WhatsAppModal } from '@/components/WhatsAppModal';
import { ListPreviewModal } from '@/components/ListPreviewModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  const {
    lists,
    catalog,
    requisitions,
    settings,
    isLoaded,
    saveList,
    deleteList,
    duplicateList,
    saveCatalogItem,
    deleteCatalogItem,
    resetCatalogToDefault,
    regenerateAllCodes,
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
  } = useIndustrialStorage();

  // Navigation & View states
  const [activeTab, setActiveTab] = useState<ActiveTab>('lists');
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Modals state: Material List
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [editingHeaderList, setEditingHeaderList] = useState<MaterialList | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewList, setPreviewList] = useState<MaterialList | null>(null);

  // Modals state: Catalog Items
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null);

  // Modals state: WhatsApp Share
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetList, setWhatsAppTargetList] = useState<MaterialList | null>(null);

  // Modals state: Requisitions (Solicitação de Insumos)
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState<SupplyRequisition | null>(null);
  const [selectedBOMForRequisition, setSelectedBOMForRequisition] = useState<string | null>(null);
  const [isRequisitionPreviewOpen, setIsRequisitionPreviewOpen] = useState(false);
  const [previewingRequisition, setPreviewingRequisition] = useState<SupplyRequisition | null>(null);

  // Success toast / notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

    if (targetListId) {
      setActiveListId(targetListId);
    }
  };

  // Open existing list for item editing
  const handleEditList = (list: MaterialList) => {
    setActiveListId(list.id);
  };

  // Open WhatsApp share for list
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

  // Handlers for Requisitions (Solicitação de Insumos)
  const handleOpenNewRequisitionModal = (preselectedListId?: string) => {
    setEditingRequisition(null);
    setSelectedBOMForRequisition(preselectedListId || null);
    setIsRequisitionModalOpen(true);
  };

  const handleEditRequisition = (req: SupplyRequisition) => {
    setSelectedBOMForRequisition(null);
    setEditingRequisition(req);
    setIsRequisitionModalOpen(true);
  };

  const handleSaveRequisition = (req: SupplyRequisition) => {
    saveRequisition(req);
    setIsRequisitionModalOpen(false);
    setEditingRequisition(null);
    showToast(`Solicitação ${req.protocol} salva com sucesso!`);
  };

  const handlePreviewRequisition = (req: SupplyRequisition) => {
    setPreviewingRequisition(req);
    setIsRequisitionPreviewOpen(true);
  };

  const handleConvertRequisitionToBOM = (reqId: string) => {
    const createdBOM = convertRequisitionToBOM(reqId);
    if (createdBOM) {
      setIsRequisitionPreviewOpen(false);
      setPreviewingRequisition(null);
      setActiveListId(createdBOM.id);
      setActiveTab('lists');
      showToast(`Lista de Materiais "${createdBOM.name}" criada com sucesso a partir da requisição!`);
    }
  };

  // State to prevent infinite loading lockups
  const [forceEnter, setForceEnter] = useState(false);
  const [tookTooLong, setTookTooLong] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTookTooLong(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Safe fallback if client hydration takes longer than normal
  if (!isLoaded && !forceEnter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <div className="font-mono text-base font-bold text-cyan-400">
            Carregando banco de dados industrial...
          </div>
          <p className="text-xs text-zinc-500">
            Sincronizando catálogo de insumos, listas e requisições
          </p>

          {tookTooLong && (
            <div className="mt-4 flex flex-col gap-2 w-full pt-4 border-t border-zinc-800 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => setForceEnter(true)}
                className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-cyan-400 shadow-md"
              >
                Abrir Sistema Imediatamente
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {
                    console.error(e);
                  }
                  window.location.reload();
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Restaurar Banco Original se estiver travado
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const pendingReqsCount = requisitions.filter((r) => r.status === 'Pendente').length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 pb-16 text-zinc-100 selection:bg-cyan-500 selection:text-zinc-950">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-zinc-900/95 px-5 py-3 text-sm font-semibold text-emerald-300 shadow-2xl shadow-emerald-950/60 backdrop-blur-md animate-in slide-in-from-bottom duration-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">
              ✓
            </span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Main Navigation Bar with Menu */}
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
          onOpenNewRequisitionModal={handleOpenNewRequisitionModal}
          onExportBackup={exportBackupJSON}
          listsCount={lists.length}
          catalogCount={catalog.length}
          requisitionsCount={requisitions.length}
          pendingRequisitionsCount={pendingReqsCount}
          settings={settings}
        />

        {/* Main Container */}
        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {/* Render View based on state */}
          {activeEditingList ? (
            /* 1. LIST EDITOR (SEARCH & ADD ITEMS VIEW) */
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
            /* 2. LISTS OVERVIEW (MAIN LISTS VIEW) */
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
              onGenerateRequisition={(list) => {
                handleOpenNewRequisitionModal(list.id);
              }}
            />
          ) : activeTab === 'requisitions' ? (
            /* 3. SOLICITAÇÃO DE INSUMOS (REQUISITIONS VIEW) */
            <RequisitionsView
              requisitions={requisitions}
              lists={lists}
              settings={settings}
              onOpenNewRequisitionModal={handleOpenNewRequisitionModal}
              onEditRequisition={handleEditRequisition}
              onPreviewRequisition={handlePreviewRequisition}
              onDeleteRequisition={deleteRequisition}
              onUpdateStatus={updateRequisitionStatus}
              onConvertToBOM={handleConvertRequisitionToBOM}
            />
          ) : activeTab === 'catalog' ? (
            /* 4. CATALOG MANAGEMENT VIEW */
            <CatalogView
              catalog={catalog}
              settings={settings}
              onOpenAddItemModal={handleOpenAddItemModal}
              onEditItem={handleEditCatalogItem}
              onDeleteItem={deleteCatalogItem}
              onResetToDefault={resetCatalogToDefault}
            />
          ) : (
            /* 5. SETTINGS VIEW */
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

        {/* MODAL 3: WhatsApp Share & Preview Modal for List */}
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
          onGenerateRequisition={(list) => {
            setIsPreviewModalOpen(false);
            setPreviewList(null);
            handleOpenNewRequisitionModal(list.id);
          }}
        />

        {/* MODAL 5: Create / Edit Requisition (Nova Solicitação de Insumos) */}
        <RequisitionModal
          isOpen={isRequisitionModalOpen}
          onClose={() => {
            setIsRequisitionModalOpen(false);
            setEditingRequisition(null);
            setSelectedBOMForRequisition(null);
          }}
          onSave={handleSaveRequisition}
          initialRequisition={editingRequisition}
          initialSelectedListId={selectedBOMForRequisition}
          lists={lists}
          catalog={catalog}
          settings={settings}
          existingRequisitionsCount={requisitions.length}
        />

        {/* MODAL 6: Preview Requisition (Visualização e Impressão de Requisição) */}
        <RequisitionPreviewModal
          isOpen={isRequisitionPreviewOpen}
          onClose={() => {
            setIsRequisitionPreviewOpen(false);
            setPreviewingRequisition(null);
          }}
          requisition={previewingRequisition}
          settings={settings}
          onEdit={(req) => {
            setIsRequisitionPreviewOpen(false);
            setPreviewingRequisition(null);
            handleEditRequisition(req);
          }}
          onConvertToBOM={handleConvertRequisitionToBOM}
        />
      </div>
    </ErrorBoundary>
  );
}
