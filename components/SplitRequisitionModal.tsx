'use client';

import React, { useState, useMemo } from 'react';
import {
  SupplyRequisition,
  RequisitionItem,
  Partner,
  AppSettings,
} from '@/lib/types';
import { formatCurrency } from '@/lib/exportUtils';
import {
  exportRequisitionPDF,
  generateRequisitionWhatsAppUrl,
  generateRequisitionEmailUrl,
} from '@/lib/requisitionExportUtils';
import {
  X,
  Share2,
  FileDown,
  MessageSquare,
  Mail,
  Building2,
  Check,
  CheckSquare,
  Square,
  Package,
  Layers,
  Phone,
  AlertCircle,
} from 'lucide-react';

interface SplitRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: SupplyRequisition | null;
  partners?: Partner[];
  settings: AppSettings;
}

export const SplitRequisitionModal: React.FC<SplitRequisitionModalProps> = ({
  isOpen,
  onClose,
  requisition,
  partners = [],
  settings,
}) => {
  // Selected item IDs to send to this specific supplier
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => {
    return new Set((requisition?.items || []).map((it) => it.id));
  });

  // Supplier selection
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [customSupplierName, setCustomSupplierName] = useState<string>('');
  const [customSupplierPhone, setCustomSupplierPhone] = useState<string>('');
  const [customSupplierEmail, setCustomSupplierEmail] = useState<string>('');

  // Suppliers from partners
  const suppliers = useMemo(() => {
    return partners.filter((p) => p.type === 'fornecedor' || p.type === 'ambos');
  }, [partners]);

  // Handle supplier change
  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    if (!partnerId) return;
    const partner = suppliers.find((s) => s.id === partnerId);
    if (partner) {
      setCustomSupplierName(partner.name);
      setCustomSupplierPhone(partner.phone || '');
      setCustomSupplierEmail(partner.email || '');
    }
  };

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!requisition?.items) return;
    setSelectedItemIds(new Set(requisition.items.map((it) => it.id)));
  };

  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };

  // Filtered items to send
  const selectedItems: RequisitionItem[] = useMemo(() => {
    if (!requisition?.items) return [];
    return requisition.items.filter((it) => selectedItemIds.has(it.id));
  }, [requisition, selectedItemIds]);

  const selectedTotalCost = useMemo(() => {
    return selectedItems.reduce((acc, it) => acc + (Number(it.totalEstimatedCost) || 0), 0);
  }, [selectedItems]);

  if (!isOpen || !requisition) return null;

  const supplierDisplayName = customSupplierName.trim() || 'Fornecedor';

  // Export handlers
  const handleExportPDF = () => {
    if (selectedItems.length === 0) return;
    exportRequisitionPDF(requisition, settings, selectedItems, supplierDisplayName);
  };

  const handleSendWhatsApp = () => {
    if (selectedItems.length === 0) return;
    const url = generateRequisitionWhatsAppUrl(
      requisition,
      settings,
      customSupplierPhone,
      selectedItems,
      supplierDisplayName
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = () => {
    if (selectedItems.length === 0) return;
    const url = generateRequisitionEmailUrl(
      requisition,
      settings,
      customSupplierEmail,
      selectedItems,
      supplierDisplayName
    );
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
                  Dividir Solicitação por Fornecedor
                </h2>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-purple-300">
                  {requisition.protocol}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Selecione quais materiais enviar e para qual fornecedor direcionar a cotação.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Supplier Picker Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Destinatário / Fornecedor da Cotação
              </span>
              {suppliers.length > 0 && (
                <span className="text-[11px] text-zinc-500">
                  {suppliers.length} fornecedor(es) cadastrado(s)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Select Supplier from Partners */}
              {suppliers.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Selecionar dos Fornecedores Cadastrados:
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => handleSelectPartner(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- Digitar manual ou escolher parceiro --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} {sup.category ? `(${sup.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Supplier Name */}
              <div className={suppliers.length === 0 ? 'sm:col-span-2' : ''}>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Nome do Fornecedor / Empresa:
                </label>
                <input
                  type="text"
                  value={customSupplierName}
                  onChange={(e) => setCustomSupplierName(e.target.value)}
                  placeholder="Ex: Usinagem Precisa, Casa dos Parafusos, etc."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  WhatsApp / Telefone do Fornecedor:
                </label>
                <input
                  type="text"
                  value={customSupplierPhone}
                  onChange={(e) => setCustomSupplierPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none font-mono"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  E-mail de Contato / Cotações:
                </label>
                <input
                  type="email"
                  value={customSupplierEmail}
                  onChange={(e) => setCustomSupplierEmail(e.target.value)}
                  placeholder="Ex: compras@fornecedor.com.br"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Items Selector */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Selecione os Materiais para Este Fornecedor
                </span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-cyan-400 font-bold">
                  {selectedItems.length} de {requisition.items.length} itens
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Marcar Todos</span>
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-300 transition"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Desmarcar Todos</span>
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {(requisition.items || []).map((item, idx) => {
                const isSelected = selectedItemIds.has(item.id);
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition cursor-pointer ${
                      isSelected
                        ? 'border-purple-500/40 bg-purple-500/10 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                          isSelected
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-400">
                            {item.code}
                          </span>
                          <span className="truncate font-semibold text-zinc-200">
                            {item.description}
                          </span>
                          {item.group && (
                            <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                              {item.group}
                            </span>
                          )}
                        </div>
                        {item.destinationMachine && (
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Destino: {item.destinationMachine}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3 text-right">
                      <span className="font-bold text-zinc-200 font-mono">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold min-w-[70px]">
                        {formatCurrency(item.totalEstimatedCost, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtotal of selection */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs">
            <span className="text-zinc-400">
              Total Selecionado ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}):
            </span>
            <span className="font-mono text-base font-black text-emerald-400">
              {formatCurrency(selectedTotalCost, settings.currencySymbol)}
            </span>
          </div>

          {selectedItems.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Selecione ao menos 1 item para poder gerar PDF, enviar por WhatsApp ou E-mail.</span>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/80 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
          >
            Fechar
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download PDF button */}
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-bold text-zinc-200 transition shadow-sm cursor-pointer"
              title="Baixar PDF formatado apenas com estes itens para este fornecedor"
            >
              <FileDown className="h-4 w-4 text-cyan-400" />
              <span>PDF da Cotação</span>
            </button>

            {/* Email button */}
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleSendEmail}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-600/90 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              title="Abrir e-mail com a lista de materiais formatada"
            >
              <Mail className="h-4 w-4" />
              <span>Enviar por E-mail</span>
            </button>

            {/* WhatsApp button */}
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              title="Enviar lista dos materiais selecionados direto no WhatsApp do fornecedor"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Enviar WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
