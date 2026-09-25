'use client';

import React, { useState, useMemo } from 'react';
import {
  SupplyRequisition,
  RequisitionStatus,
  RequisitionPriority,
  AppSettings,
  MaterialList,
} from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/exportUtils';
import { exportRequisitionPDF, generateRequisitionWhatsAppUrl } from '@/lib/requisitionExportUtils';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  FileDown,
  MessageSquare,
  ArrowRightCircle,
  Edit3,
  Trash2,
  Building2,
  Wrench,
  Copy,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  Package,
} from 'lucide-react';

interface RequisitionsViewProps {
  requisitions: SupplyRequisition[];
  lists?: MaterialList[];
  settings: AppSettings;
  onOpenNewRequisitionModal: (initialListId?: string) => void;
  onEditRequisition: (requisition: SupplyRequisition) => void;
  onPreviewRequisition: (requisition: SupplyRequisition) => void;
  onDeleteRequisition: (id: string) => void;
  onUpdateStatus: (id: string, status: RequisitionStatus) => void;
  onConvertToBOM: (id: string) => void;
}

export const RequisitionsView: React.FC<RequisitionsViewProps> = ({
  requisitions,
  lists = [],
  settings,
  onOpenNewRequisitionModal,
  onEditRequisition,
  onPreviewRequisition,
  onDeleteRequisition,
  onUpdateStatus,
  onConvertToBOM,
}) => {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  // Copied protocol feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Distinct sectors
  const distinctSectors = useMemo(() => {
    const s = new Set<string>();
    requisitions.forEach((r) => {
      if (r.sector) s.add(r.sector);
    });
    return Array.from(s).sort();
  }, [requisitions]);

  // Filtered requisitions
  const filteredRequisitions = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return requisitions.filter((req) => {
      // Status filter
      if (selectedStatus !== 'all' && req.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && req.priority !== selectedPriority) {
        return false;
      }

      // Sector filter
      if (selectedSector !== 'all' && req.sector !== selectedSector) {
        return false;
      }

      // Search term
      if (q) {
        const matchProtocol = (req.protocol || '').toLowerCase().includes(q);
        const matchTitle = (req.title || '').toLowerCase().includes(q);
        const matchRequester = (req.requesterName || '').toLowerCase().includes(q);
        const matchSector = (req.sector || '').toLowerCase().includes(q);
        const matchMachine = (req.destinationMachine || '').toLowerCase().includes(q);
        const matchItems = req.items?.some(
          (it) =>
            (it.code || '').toLowerCase().includes(q) ||
            (it.description || '').toLowerCase().includes(q)
        );

        if (
          !matchProtocol &&
          !matchTitle &&
          !matchRequester &&
          !matchSector &&
          !matchMachine &&
          !matchItems
        ) {
          return false;
        }
      }

      return true;
    });
  }, [requisitions, searchTerm, selectedStatus, selectedPriority, selectedSector]);

  // Metrics
  const metrics = useMemo(() => {
    const total = requisitions.length;
    const pending = requisitions.filter((r) => r.status === 'Pendente').length;
    const quoting = requisitions.filter((r) => r.status === 'Em Cotação').length;
    const urgent = requisitions.filter((r) => r.priority === 'Urgente').length;
    const totalValue = requisitions.reduce(
      (acc, r) => acc + (Number(r.totalEstimatedCost) || 0),
      0
    );

    return { total, pending, quoting, urgent, totalValue };
  }, [requisitions]);

  const handleCopyProtocol = (protocol: string, id: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsApp = (req: SupplyRequisition) => {
    const url = generateRequisitionWhatsAppUrl(req, settings);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Almoxarifado & Compras
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-100 sm:text-3xl">
            Solicitação de Insumos
          </h1>
          <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
            Requisições internas de materiais, reposição para bancada e peças de manutenção industrial.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {lists && lists.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenNewRequisitionModal(lists[0]?.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-zinc-900 px-4 py-3 text-sm font-semibold text-cyan-300 shadow-md transition hover:bg-zinc-800 hover:text-cyan-200"
              title="Criar solicitação importando dados de uma lista de materiais já feita"
            >
              <Package className="h-4 w-4 text-cyan-400" />
              <span>Importar de Lista Pronta</span>
            </button>
          )}
          <button
            id="btn-new-requisition"
            onClick={() => onOpenNewRequisitionModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-cyan-950/50 transition-all hover:brightness-110 active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Nova Solicitação de Insumos</span>
          </button>
        </div>
      </div>

      {/* KPI / Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Total */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="text-[11px] font-semibold text-zinc-400">Total Solicitações</div>
          <div className="mt-1 font-mono text-2xl font-black text-zinc-100">
            {metrics.total}
          </div>
        </div>

        {/* Pendentes */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300">
            <span>Pendentes</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-amber-400">
            {metrics.pending}
          </div>
        </div>

        {/* Em Cotação */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold text-sky-300">
            <span>Em Cotação</span>
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-sky-400">
            {metrics.quoting}
          </div>
        </div>

        {/* Urgentes */}
        <div
          className={`rounded-xl p-3.5 backdrop-blur-sm border ${
            metrics.urgent > 0
              ? 'border-rose-500/50 bg-rose-500/15 shadow-sm shadow-rose-950/50 animate-pulse'
              : 'border-zinc-800/80 bg-zinc-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-300">
            <span>Urgentes</span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-rose-400">
            {metrics.urgent}
          </div>
        </div>

        {/* Total Estimado */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 backdrop-blur-sm">
          <div className="text-[11px] font-semibold text-emerald-300">Custo Total Estimado</div>
          <div className="mt-1 font-mono text-lg font-black text-emerald-400 truncate">
            {formatCurrency(metrics.totalValue, settings.currencySymbol)}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por protocolo (REQ-...), solicitante, máquina, setor ou insumo..."
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 py-2 pl-10 pr-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-2.5 py-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900">Todos os Status</option>
              <option value="Pendente" className="bg-zinc-900">Pendente</option>
              <option value="Em Cotação" className="bg-zinc-900">Em Cotação</option>
              <option value="Aprovada" className="bg-zinc-900">Aprovada</option>
              <option value="Entregue" className="bg-zinc-900">Entregue</option>
              <option value="Cancelada" className="bg-zinc-900">Cancelada</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-2.5 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900">Todas Prioridades</option>
              <option value="Urgente" className="bg-zinc-900 text-rose-400">Urgente</option>
              <option value="Alta" className="bg-zinc-900 text-amber-400">Alta</option>
              <option value="Normal" className="bg-zinc-900">Normal</option>
              <option value="Baixa" className="bg-zinc-900">Baixa</option>
            </select>
          </div>

          {/* Sector Filter */}
          {distinctSectors.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-2.5 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">Todos os Setores</option>
                {distinctSectors.map((sec) => (
                  <option key={sec} value={sec} className="bg-zinc-900">
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters button */}
          {(searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedSector !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedPriority('all');
                setSelectedSector('all');
              }}
              className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Requisitions List */}
      {filteredRequisitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/80 text-zinc-400 mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-200">
            Nenhuma solicitação de insumos encontrada
          </h3>
          <p className="mt-1 max-w-md text-xs text-zinc-400 sm:text-sm">
            {requisitions.length === 0
              ? 'Crie sua primeira requisição interna para compras, almoxarifado ou manutenção de máquinas.'
              : 'Nenhum resultado corresponde aos filtros aplicados.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {lists && lists.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenNewRequisitionModal(lists[0]?.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-cyan-300 transition-all hover:bg-zinc-800"
              >
                <Package className="h-4 w-4 text-cyan-400" />
                <span>Importar de Lista Pronta</span>
              </button>
            )}
            <button
              onClick={() => onOpenNewRequisitionModal()}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-zinc-950 transition-all hover:bg-cyan-400"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Criar Solicitação de Insumos</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredRequisitions.map((req) => {
            const isUrgent = req.priority === 'Urgente';
            const isHigh = req.priority === 'Alta';

            return (
              <div
                key={req.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-zinc-900/90 p-5 shadow-lg transition-all hover:border-zinc-700 ${
                  isUrgent
                    ? 'border-rose-500/40 shadow-rose-950/20'
                    : isHigh
                    ? 'border-amber-500/40 shadow-amber-950/20'
                    : 'border-zinc-800 shadow-black/40'
                }`}
              >
                <div>
                  {/* Top Line: Protocol, Urgency & Status selector */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyProtocol(req.protocol, req.id)}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="Copiar número do protocolo"
                      >
                        <span>{req.protocol}</span>
                        {copiedId === req.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-zinc-500" />
                        )}
                      </button>

                      {/* Priority pill */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isUrgent
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {req.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Inline Status Dropdown */}
                    <div className="relative">
                      <select
                        value={req.status}
                        onChange={(e) => onUpdateStatus(req.id, e.target.value as RequisitionStatus)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer ${
                          req.status === 'Aprovada'
                            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                            : req.status === 'Em Cotação'
                            ? 'border-sky-500/40 bg-sky-950/40 text-sky-300'
                            : req.status === 'Entregue'
                            ? 'border-purple-500/40 bg-purple-950/40 text-purple-300'
                            : req.status === 'Cancelada'
                            ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
                            : 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                        }`}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Cotação">Em Cotação</option>
                        <option value="Aprovada">Aprovada</option>
                        <option value="Entregue">Entregue</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-zinc-100 line-clamp-1">
                      {req.title}
                    </h3>

                    {/* Metadata Grid */}
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-zinc-400">
                      <div>
                        <span className="text-zinc-500">Solicitante:</span>{' '}
                        <strong className="text-zinc-200">{req.requesterName}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Setor:</span>{' '}
                        <span className="text-zinc-300">{req.sector}</span>
                      </div>
                      {req.destinationMachine && (
                        <div className="col-span-2">
                          <span className="text-zinc-500">Destino/Máquina:</span>{' '}
                          <span className="text-zinc-300">{req.destinationMachine}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-zinc-500">Solicitado em:</span>{' '}
                        <span className="text-zinc-300">{formatDate(req.requestDate)}</span>
                      </div>
                      {req.neededByDate && (
                        <div>
                          <span className="text-zinc-500">Data Limite:</span>{' '}
                          <strong className="text-cyan-400">{formatDate(req.neededByDate)}</strong>
                        </div>
                      )}
                    </div>

                    {/* Justification snippet if available */}
                    {req.justification && (
                      <p className="mt-2.5 rounded-lg bg-zinc-950/60 p-2 text-xs italic text-zinc-400 line-clamp-2">
                        &ldquo;{req.justification}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Items Preview */}
                  <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-2">
                      <span>Insumos ({req.items?.length || 0})</span>
                      <span className="text-emerald-400 font-bold">
                        Est.: {formatCurrency(req.totalEstimatedCost, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {(req.items || []).slice(0, 3).map((it, idx) => (
                        <div
                          key={it.id || idx}
                          className="flex items-center justify-between text-zinc-300"
                        >
                          <span className="truncate pr-2 font-mono text-[11px]">
                            <strong className="text-cyan-400">{it.code}</strong> - {it.description}
                          </span>
                          <span className="shrink-0 font-semibold text-zinc-400">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      ))}
                      {(req.items?.length || 0) > 3 && (
                        <div className="text-[11px] font-bold text-zinc-500 pt-1">
                          + {(req.items?.length || 0) - 3} outro(s) insumo(s)...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center gap-1.5">
                    {/* View Preview */}
                    <button
                      type="button"
                      onClick={() => onPreviewRequisition(req)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-cyan-500/50 hover:bg-zinc-700"
                      title="Visualizar e Imprimir"
                    >
                      <Eye className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Ver</span>
                    </button>

                    {/* PDF */}
                    <button
                      type="button"
                      onClick={() => exportRequisitionPDF(req, settings)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-cyan-500/50 hover:bg-zinc-700"
                      title="Baixar PDF Oficial"
                    >
                      <FileDown className="h-3.5 w-3.5 text-cyan-400" />
                      <span>PDF</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(req)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                      title="Compartilhar pelo WhatsApp"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Convert to BOM */}
                    <button
                      type="button"
                      onClick={() => onConvertToBOM(req.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20"
                      title="Transformar esta requisição em uma Lista de Materiais (BOM)"
                    >
                      <ArrowRightCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Virar BOM</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEditRequisition(req)}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      title="Editar requisição"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    {deleteConfirmId === req.id ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-rose-950/60 p-1 border border-rose-500/40 animate-in fade-in">
                        <span className="text-[10px] text-rose-300 font-semibold px-1">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteRequisition(req.id);
                            setDeleteConfirmId(null);
                          }}
                          className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(req.id)}
                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
                        title="Excluir requisição"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
