'use client';

import React from 'react';
import { CatalogItem, AppSettings } from '@/lib/types';
import { ExcelCatalogImportSection } from './ExcelCatalogImportSection';
import { X } from 'lucide-react';

interface ExcelCatalogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  settings: AppSettings;
  onSaveCatalog: (newCatalog: CatalogItem[]) => void;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const ExcelCatalogImportModal: React.FC<ExcelCatalogImportModalProps> = ({
  isOpen,
  onClose,
  catalog,
  settings,
  onSaveCatalog,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <ExcelCatalogImportSection
          catalog={catalog}
          settings={settings}
          onSaveCatalog={onSaveCatalog}
          onSaveSettings={onSaveSettings}
          isModal={true}
          onCloseModal={onClose}
        />
      </div>
    </div>
  );
};
