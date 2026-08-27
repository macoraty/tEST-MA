'use client';

import React, { useState } from 'react';
import { CatalogItem } from '@/lib/types';
import { X, Package, Tag, Layers, Scale, DollarSign, FileText } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<CatalogItem, 'id' | 'createdAt'>, id?: string) => void;
  initialItem?: CatalogItem | null;
  groups: string[];
  units: string[];
  currencySymbol: string;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  groups,
  units,
  currencySymbol,
}) => {
  if (!isOpen) return null;

  return (
    <ItemModalContent
      key={initialItem ? initialItem.id : 'new-item'}
      onClose={onClose}
      onSave={onSave}
      initialItem={initialItem}
      groups={groups}
      units={units}
      currencySymbol={currencySymbol}
    />
  );
};

interface ItemModalContentProps {
  onClose: () => void;
  onSave: (item: Omit<CatalogItem, 'id' | 'createdAt'>, id?: string) => void;
  initialItem?: CatalogItem | null;
  groups: string[];
  units: string[];
  currencySymbol: string;
}

const ItemModalContent: React.FC<ItemModalContentProps> = ({
  onClose,
  onSave,
  initialItem,
  groups,
  units,
  currencySymbol,
}) => {
  const [code, setCode] = useState(
    () => initialItem?.code || ''
  );
  const [description, setDescription] = useState(initialItem?.description || '');
  const [group, setGroup] = useState(
    initialItem?.group || groups[0] || 'INSUMOS GERAIS'
  );
  const [unit, setUnit] = useState(initialItem?.unit || units[0] || 'PÇ');
  const [cost, setCost] = useState(String(initialItem?.cost ?? '0'));
  const [weightBar, setWeightBar] = useState(String(initialItem?.weightBar ?? '0'));
  const [notes, setNotes] = useState(initialItem?.notes || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!description.trim()) {
      newErrors.description = 'A descrição do item é obrigatória.';
    }
    if (!code.trim()) {
      newErrors.code = 'O código de referência é obrigatório.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        code: code.trim(),
        description: description.trim().toUpperCase(),
        group: group || 'INSUMOS GERAIS',
        unit: unit || 'PÇ',
        cost: Math.max(0, parseFloat(cost.replace(',', '.')) || 0),
        weightBar: Math.max(0, parseFloat(weightBar.replace(',', '.')) || 0),
        notes: notes.trim(),
      },
      initialItem?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-catalog-item"
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all sm:p-7"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                {initialItem ? 'Editar Item do Catálogo' : 'Novo Material / Insumo'}
              </h2>
              <p className="text-xs text-zinc-400">
                Cadastre informações de referência para seleção rápida nas listas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Descrição */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              Nome / Descrição do Material <span className="text-red-400">*</span>
            </label>
            <input
              id="input-item-desc"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              placeholder="Ex: ROLAMENTO 6204 2RS, TUBO 50X50 #14, PARAFUSO ALLEN M10X30"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              autoFocus
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Código e Grupo */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Código */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Tag className="h-3.5 w-3.5 text-cyan-400" />
                Código / Ref <span className="text-red-400">*</span>
              </label>
              <input
                id="input-item-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errors.code) setErrors({ ...errors, code: '' });
                }}
                placeholder="Ex: INSUM-0142, MAT-098"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
              />
              {errors.code && <p className="mt-1 text-xs text-red-400">{errors.code}</p>}
            </div>

            {/* Grupo */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                Grupo / Categoria
              </label>
              <select
                id="select-item-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
              >
                {groups.map((g) => (
                  <option key={g} value={g} className="bg-zinc-900 text-zinc-100">
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unidade, Valor de Custo e Peso Barra */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Unidade */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                Unidade
              </label>
              <select
                id="select-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
              >
                {units.map((u) => (
                  <option key={u} value={u} className="bg-zinc-900 text-zinc-100">
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor de Custo */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Custo ({currencySymbol})
              </label>
              <input
                id="input-item-cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
              />
            </div>

            {/* Peso Barra / Peça */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Scale className="h-3.5 w-3.5 text-amber-400" />
                Peso Ref. (kg)
              </label>
              <input
                id="input-item-weight"
                type="number"
                step="0.01"
                min="0"
                value={weightBar}
                onChange={(e) => setWeightBar(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              Observações / Detalhes de Fabricação
            </label>
            <input
              id="input-item-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tolerância h7, Tratamento térmico, Aço 1045, etc."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              id="btn-save-item-modal"
              type="submit"
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-400"
            >
              {initialItem ? 'Salvar Alterações' : 'Cadastrar Item no Catálogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
