'use client';

import React from 'react';
import { SupplyRequisition, AppSettings } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/exportUtils';
import { exportRequisitionPDF, generateRequisitionWhatsAppUrl } from '@/lib/requisitionExportUtils';
import {
  X,
  Printer,
  FileDown,
  MessageSquare,
  ArrowRightCircle,
  Edit3,
  Calendar,
  AlertTriangle,
  Building2,
  Clock,
  User,
} from 'lucide-react';

interface RequisitionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: SupplyRequisition | null;
  settings: AppSettings;
  onEdit?: (requisition: SupplyRequisition) => void;
  onConvertToBOM?: (requisitionId: string) => void;
}

export const RequisitionPreviewModal: React.FC<RequisitionPreviewModalProps> = ({
  isOpen,
  onClose,
  requisition,
  settings,
  onEdit,
  onConvertToBOM,
}) => {
  if (!isOpen || !requisition) return null;

  const totalCost = requisition.items.reduce(
    (acc, it) => acc + (Number(it.totalEstimatedCost) || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    exportRequisitionPDF(requisition, settings);
  };

  const handleOpenWhatsApp = () => {
    const url = generateRequisitionWhatsAppUrl(requisition, settings);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md sm:p-5">
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-cyan-950/40 print:m-0 print:max-h-none print:w-full print:border-none print:bg-white print:p-0 print:shadow-none">
        {/* Header Actions Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-cyan-400">
              {requisition.protocol}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                requisition.priority === 'Urgente'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                  : requisition.priority === 'Alta'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {requisition.priority.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              title="Compartilhar pelo WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
              title="Baixar PDF Oficial da Requisição"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
              title="Imprimir visualização"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Convert to BOM */}
            {onConvertToBOM && (
              <button
                type="button"
                onClick={() => onConvertToBOM(requisition.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20"
                title="Transformar em Lista de Materiais da Engenharia"
              >
                <ArrowRightCircle className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Virar Lista (BOM)</span>
              </button>
            )}

            {/* Edit */}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(requisition);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 print:overflow-visible print:p-0">
          <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-inner print:border-none print:bg-transparent print:p-0">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center sm:justify-between print:border-zinc-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-xs font-bold text-cyan-400 print:text-cyan-800">
                    {settings.companyName || 'SISTEMA INDUSTRIAL'}
                  </span>
                  <span className="text-xs text-zinc-500 print:text-zinc-600">
                    {settings.companyCnpj ? `CNPJ: ${settings.companyCnpj}` : ''}
                  </span>
                </div>
                <h1 className="mt-1 text-xl font-black tracking-tight text-zinc-100 print:text-zinc-900">
                  REQUISIÇÃO INTERNA DE INSUMOS
                </h1>
                <p className="text-xs text-zinc-400 print:text-zinc-600">
                  {requisition.title}
                </p>
              </div>

              <div className="flex flex-col sm:items-end">
                <span className="font-mono text-lg font-black text-cyan-400 print:text-cyan-800">
                  {requisition.protocol}
                </span>
                <span className="text-xs text-zinc-400 print:text-zinc-600">
                  Emissão: {formatDate(requisition.requestDate)}
                </span>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    requisition.status === 'Aprovada'
                      ? 'bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-800'
                      : requisition.status === 'Em Cotação'
                      ? 'bg-sky-500/20 text-sky-300 print:bg-sky-100 print:text-sky-800'
                      : requisition.status === 'Entregue'
                      ? 'bg-purple-500/20 text-purple-300 print:bg-purple-100 print:text-purple-800'
                      : 'bg-amber-500/20 text-amber-300 print:bg-amber-100 print:text-amber-800'
                  }`}
                >
                  Status: {requisition.status}
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 text-xs sm:grid-cols-4 print:border-zinc-200 print:bg-zinc-50">
              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 print:text-zinc-600">
                  SOLICITANTE
                </span>
                <span className="font-bold text-zinc-200 print:text-zinc-900">
                  {requisition.requesterName || '-'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 print:text-zinc-600">
                  SETOR
                </span>
                <span className="font-medium text-zinc-200 print:text-zinc-900">
                  {requisition.sector || 'Geral'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 print:text-zinc-600">
                  MÁQUINA / DESTINO
                </span>
                <span className="font-medium text-zinc-200 print:text-zinc-900">
                  {requisition.destinationMachine || 'Geral'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 print:text-zinc-600">
                  DATA LIMITE
                </span>
                <span className="font-bold text-cyan-400 print:text-cyan-800">
                  {formatDate(requisition.neededByDate) || 'Imediato'}
                </span>
              </div>
            </div>

            {/* Justification if provided */}
            {requisition.justification && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-xs print:border-zinc-200 print:bg-zinc-50">
                <span className="font-bold text-zinc-300 print:text-zinc-700">
                  Motivo / Justificativa da Solicitação:
                </span>{' '}
                <span className="text-zinc-400 print:text-zinc-800 italic">
                  {requisition.justification}
                </span>
              </div>
            )}

            {/* Table */}
            <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-800 print:border-zinc-300">
              <table className="w-full text-left text-xs print:text-zinc-900">
                <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[10px] uppercase tracking-wider text-zinc-400 print:border-zinc-300 print:bg-zinc-100 print:text-zinc-700">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">#</th>
                    <th className="px-3 py-2 w-28">Código</th>
                    <th className="px-3 py-2">Descrição do Insumo</th>
                    <th className="px-2 py-2 text-center w-14">Qtd.</th>
                    <th className="px-2 py-2 text-center w-12">Un.</th>
                    <th className="px-3 py-2 text-right w-24">Valor Est.</th>
                    <th className="px-3 py-2 text-right w-24">Subtotal</th>
                    <th className="px-3 py-2">Aplicação / Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/20 print:divide-zinc-200 print:bg-transparent">
                  {requisition.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="px-3 py-2 text-center font-mono text-zinc-500 print:text-zinc-600">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-cyan-400 print:text-cyan-800">
                        {it.code}
                      </td>
                      <td className="px-3 py-2 font-medium text-zinc-200 print:text-zinc-900">
                        {it.description}
                        <span className="block text-[10px] text-zinc-500 print:text-zinc-500">
                          {it.group}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-zinc-100 print:text-zinc-900">
                        {it.quantity}
                      </td>
                      <td className="px-2 py-2 text-center font-mono text-zinc-400 print:text-zinc-700">
                        {it.unit}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-300 print:text-zinc-700">
                        {formatCurrency(it.estimatedCost, settings.currencySymbol)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-400 print:text-emerald-800">
                        {formatCurrency(it.totalEstimatedCost, settings.currencySymbol)}
                      </td>
                      <td className="px-3 py-2 text-zinc-400 print:text-zinc-600">
                        {it.destinationMachine || it.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-900/80 p-3 text-xs print:bg-zinc-100">
              <span className="text-zinc-400 print:text-zinc-700">
                Total de Insumos:{' '}
                <strong className="text-zinc-200 print:text-zinc-900">
                  {requisition.items.length} itens ({requisition.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} unidades)
                </strong>
              </span>
              <span className="text-sm font-bold text-zinc-300 print:text-zinc-800">
                Valor Total Estimado:{' '}
                <strong className="text-base text-emerald-400 print:text-emerald-800">
                  {formatCurrency(totalCost, settings.currencySymbol)}
                </strong>
              </span>
            </div>

            {/* Notes if any */}
            {requisition.notes && (
              <div className="mt-3 text-xs text-zinc-400 print:text-zinc-600">
                <strong>Instruções de entrega:</strong> {requisition.notes}
              </div>
            )}

            {/* Signatures */}
            <div className="mt-12 grid grid-cols-3 gap-6 pt-6 text-center text-xs print:border-t print:border-zinc-300">
              <div>
                <div className="mx-auto mb-2 w-4/5 border-b border-zinc-700 print:border-zinc-400" />
                <span className="font-bold text-zinc-300 print:text-zinc-800">
                  {requisition.requesterName || 'Solicitante'}
                </span>
                <span className="block text-[10px] text-zinc-500 print:text-zinc-600">
                  Assinatura do Solicitante
                </span>
              </div>

              <div>
                <div className="mx-auto mb-2 w-4/5 border-b border-zinc-700 print:border-zinc-400" />
                <span className="font-bold text-zinc-300 print:text-zinc-800">
                  Gerência / Supervisão
                </span>
                <span className="block text-[10px] text-zinc-500 print:text-zinc-600">
                  Aprovação Técnica
                </span>
              </div>

              <div>
                <div className="mx-auto mb-2 w-4/5 border-b border-zinc-700 print:border-zinc-400" />
                <span className="font-bold text-zinc-300 print:text-zinc-800">
                  Almoxarifado / Compras
                </span>
                <span className="block text-[10px] text-zinc-500 print:text-zinc-600">
                  Recebimento & Cotação
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
