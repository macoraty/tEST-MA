'use client';

import React, { useState, useMemo } from 'react';
import { MaterialList, AppSettings } from '@/lib/types';
import { formatCurrency, formatDate, exportListToExcel, exportListToPDF } from '@/lib/exportUtils';
import {
  X,
  Eye,
  Cog,
  Building2,
  Calendar,
  User,
  FileText,
  FileSpreadsheet,
  MessageSquare,
  Edit,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  Scale,
  DollarSign,
  Package,
} from 'lucide-react';

interface ListPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: MaterialList | null;
  settings: AppSettings;
  onEditList: (list: MaterialList) => void;
  onOpenWhatsApp: (list: MaterialList) => void;
}

export const ListPreviewModal: React.FC<ListPreviewModalProps> = ({
  isOpen,
  onClose,
  list,
  settings,
  onEditList,
  onOpenWhatsApp,
}) => {
  const [itemSearch, setItemSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  if (!isOpen || !list) return null;

  return (
    <ListPreviewModalContent
      key={list.id}
      list={list}
      settings={settings}
      onClose={onClose}
      onEditList={onEditList}
      onOpenWhatsApp={onOpenWhatsApp}
      itemSearch={itemSearch}
      setItemSearch={setItemSearch}
      selectedGroup={selectedGroup}
      setSelectedGroup={setSelectedGroup}
    />
  );
};

interface ListPreviewModalContentProps {
  list: MaterialList;
  settings: AppSettings;
  onClose: () => void;
  onEditList: (list: MaterialList) => void;
  onOpenWhatsApp: (list: MaterialList) => void;
  itemSearch: string;
  setItemSearch: (s: string) => void;
  selectedGroup: string;
  setSelectedGroup: (g: string) => void;
}

const ListPreviewModalContent: React.FC<ListPreviewModalContentProps> = ({
  list,
  settings,
  onClose,
  onEditList,
  onOpenWhatsApp,
  itemSearch,
  setItemSearch,
  selectedGroup,
  setSelectedGroup,
}) => {
  // Calculations
  const totalCost = useMemo(() => {
    return list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
  }, [list.items]);

  const totalWeight = useMemo(() => {
    return list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
  }, [list.items]);

  const totalQuantity = useMemo(() => {
    return list.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  }, [list.items]);

  // Unique groups present in this list
  const listGroups = useMemo(() => {
    const set = new Set<string>();
    list.items.forEach((item) => {
      if (item.group) set.add(item.group);
    });
    return Array.from(set).sort();
  }, [list.items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const query = itemSearch.toLowerCase().trim();
    return list.items.filter((item) => {
      const matchesSearch =
        !query ||
        item.description.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.group && item.group.toLowerCase().includes(query)) ||
        (item.notes && item.notes.toLowerCase().includes(query));

      const matchesGroup = selectedGroup === 'ALL' || item.group === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [list.items, itemSearch, selectedGroup]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluída':
      case 'Aprovada':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status}
          </span>
        );
      case 'Em Andamento':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
            <Clock className="h-3.5 w-3.5" />
            {status}
          </span>
        );
      case 'Entregue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/50 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {status || 'Rascunho'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:p-6">
      <div
        id="modal-list-preview"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl transition-all"
      >
        {/* Modal Top Header */}
        <div className="flex flex-col gap-3 border-b border-zinc-800/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3.5">
            {settings.companyLogo ? (
              <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-white/95 p-1 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.companyLogo}
                  alt={settings.companyName || 'Logo'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
                <Eye className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">
                  {list.name}
                </h2>
                {getStatusBadge(list.status)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span className="flex items-center gap-1 text-zinc-300">
                  <Cog className="h-3.5 w-3.5 text-cyan-400" />
                  <strong>Máquina:</strong> {list.machine}
                </span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  <strong>Cliente:</strong> {list.client || 'Interno'}
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  {formatDate(list.date)}
                </span>
                {list.responsible && (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    {list.responsible}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              id="btn-preview-whatsapp"
              onClick={() => {
                onClose();
                onOpenWhatsApp(list);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-900/50 hover:text-emerald-300"
              title="Compartilhar via WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              id="btn-preview-pdf"
              onClick={() => exportListToPDF(list, settings)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-900/50 hover:text-rose-300"
              title={`Exportar PDF (Template: ${settings.pdfTemplate || 'modern'})`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>

            <button
              id="btn-preview-excel"
              onClick={() => exportListToExcel(list, settings)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-900/50 hover:text-emerald-300"
              title={`Exportar Excel (Template: ${settings.excelTemplate || 'complete'})`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel</span>
            </button>

            <button
              id="btn-preview-print"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
              title="Imprimir visualização"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-preview-edit"
              onClick={() => {
                onClose();
                onEditList(list);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 shadow-md shadow-cyan-950/50 transition hover:bg-cyan-400"
              title="Editar Lista"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Editar</span>
            </button>

            <button
              id="btn-preview-close"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Notes alert if present */}
          {list.notes && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300">
              <strong className="text-cyan-400">Observações da Lista:</strong> {list.notes}
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Package className="h-3.5 w-3.5 text-cyan-400" />
                <span>Tipos de Itens</span>
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-zinc-100">
                {list.items.length} <span className="text-xs font-normal text-zinc-500">itens</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>Qtd Total de Peças</span>
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-zinc-100">
                {totalQuantity}{' '}
                <span className="text-xs font-normal text-zinc-500">unidades</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Scale className="h-3.5 w-3.5 text-amber-400" />
                <span>Peso Total Est.</span>
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-zinc-100">
                {totalWeight > 0 ? (
                  <>
                    {totalWeight.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-zinc-500">kg</span>
                  </>
                ) : (
                  <span className="text-zinc-500 text-sm">Não informado</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <span>Custo Geral Est.</span>
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-emerald-400">
                {totalCost > 0 ? (
                  formatCurrency(totalCost, settings.currencySymbol)
                ) : (
                  <span className="text-zinc-500 text-sm">Sem valores</span>
                )}
              </div>
            </div>
          </div>

          {/* Search and Group Filter inside Preview */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Filtrar itens por código ou descrição..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
                />
              </div>

              {listGroups.length > 0 && (
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-200 outline-none transition focus:border-cyan-500"
                >
                  <option value="ALL">Todos os Grupos</option>
                  {listGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-xs text-zinc-400">
              Exibindo <strong className="text-zinc-200">{filteredItems.length}</strong> de{' '}
              {list.items.length} itens
            </div>
          </div>

          {/* Items Table */}
          {list.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-xs text-zinc-400">
                Esta lista ainda não possui nenhum item cadastrado.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onEditList(list);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-400"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Adicionar Itens Agora</span>
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center text-xs text-zinc-400">
              Nenhum item corresponde ao filtro aplicado.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-zinc-800 bg-zinc-900/90 font-semibold text-zinc-400">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-10">#</th>
                      <th className="px-3 py-2.5">Código</th>
                      <th className="px-3 py-2.5">Descrição do Material / Insumo</th>
                      <th className="px-3 py-2.5">Grupo</th>
                      <th className="px-3 py-2.5 text-center">Qtd</th>
                      <th className="px-3 py-2.5 text-right">Custo Unit.</th>
                      <th className="px-3 py-2.5 text-right">Custo Total</th>
                      <th className="px-3 py-2.5 text-right">Peso (kg)</th>
                      <th className="px-3 py-2.5">Obs / Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredItems.map((item, idx) => {
                      const itemCost = Number(item.unitCost) || 0;
                      const itemTotal = Number(item.totalCost) || itemCost * (Number(item.quantity) || 1);
                      const itemWeight = Number(item.totalWeight) || 0;

                      return (
                        <tr
                          key={item.id || idx}
                          className="transition-colors hover:bg-zinc-800/40"
                        >
                          <td className="px-3 py-2.5 text-center font-mono text-[11px] text-zinc-500">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] font-medium text-cyan-400 whitespace-nowrap">
                            {item.code || '-'}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-zinc-100">
                            {item.description}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="rounded-md border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-300">
                              {item.group || 'INSUMOS GERAIS'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono whitespace-nowrap font-bold text-zinc-200">
                            {item.quantity}{' '}
                            <span className="text-[10px] font-normal text-zinc-400">
                              {item.unit || 'PÇ'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-300 whitespace-nowrap">
                            {itemCost > 0
                              ? formatCurrency(itemCost, settings.currencySymbol)
                              : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                            {itemTotal > 0
                              ? formatCurrency(itemTotal, settings.currencySymbol)
                              : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-300 whitespace-nowrap">
                            {itemWeight > 0 ? `${itemWeight.toFixed(2)} kg` : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-zinc-400 text-[11px]">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Table Summary Footer */}
                  <tfoot className="border-t border-zinc-800 bg-zinc-900/90 font-semibold text-zinc-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2.5 text-right">
                        Totais da Lista:
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-cyan-400">
                        {totalQuantity}
                      </td>
                      <td className="px-3 py-2.5"></td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-400">
                        {totalCost > 0
                          ? formatCurrency(totalCost, settings.currencySymbol)
                          : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-zinc-200">
                        {totalWeight > 0 ? `${totalWeight.toFixed(2)} kg` : '-'}
                      </td>
                      <td className="px-3 py-2.5"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 p-4 sm:px-6">
          <div className="text-xs text-zinc-500">
            {settings.companyName ? `${settings.companyName} • ` : ''}
            Lista ID: <span className="font-mono">{list.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onClose();
                onEditList(list);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md transition hover:bg-cyan-400"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Abrir no Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
