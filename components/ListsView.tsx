'use client';

import React, { useState, useMemo } from 'react';
import { MaterialList, AppSettings, SortOrder } from '@/lib/types';
import { formatCurrency, formatDate, exportListToExcel, exportListToPDF } from '@/lib/exportUtils';
import {
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Eye,
  Edit,
  Copy,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Cog,
  Calendar,
  Layers,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ListsViewProps {
  lists: MaterialList[];
  settings: AppSettings;
  onOpenNewListModal: () => void;
  onPreviewList: (list: MaterialList) => void;
  onEditList: (list: MaterialList) => void;
  onDuplicateList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onOpenWhatsApp: (list: MaterialList) => void;
}

type SortField = 'name' | 'machine' | 'client' | 'date' | 'itemsCount' | 'totalCost' | 'status';

export const ListsView: React.FC<ListsViewProps> = ({
  lists,
  settings,
  onOpenNewListModal,
  onPreviewList,
  onEditList,
  onDuplicateList,
  onDeleteList,
  onOpenWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Unique machines and clients for quick filters
  const uniqueMachines = useMemo(() => {
    const set = new Set<string>();
    lists.forEach((l) => {
      if (l.machine) set.add(l.machine);
    });
    return Array.from(set).sort();
  }, [lists]);

  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    lists.forEach((l) => {
      if (l.client) set.add(l.client);
    });
    return Array.from(set).sort();
  }, [lists]);

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort lists
  const filteredAndSortedLists = useMemo(() => {
    return lists
      .filter((list) => {
        // Search term
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          !query ||
          list.name.toLowerCase().includes(query) ||
          list.machine.toLowerCase().includes(query) ||
          list.client.toLowerCase().includes(query) ||
          (list.responsible && list.responsible.toLowerCase().includes(query)) ||
          (list.notes && list.notes.toLowerCase().includes(query)) ||
          list.items.some((i) => i.description.toLowerCase().includes(query) || i.code.toLowerCase().includes(query));

        // Machine filter
        const matchesMachine = selectedMachine === 'ALL' || list.machine === selectedMachine;

        // Client filter
        const matchesClient = selectedClient === 'ALL' || list.client === selectedClient;

        // Status filter
        const matchesStatus = selectedStatus === 'ALL' || list.status === selectedStatus;

        return matchesSearch && matchesMachine && matchesClient && matchesStatus;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortField === 'machine') {
          valA = a.machine.toLowerCase();
          valB = b.machine.toLowerCase();
        } else if (sortField === 'client') {
          valA = a.client.toLowerCase();
          valB = b.client.toLowerCase();
        } else if (sortField === 'date') {
          valA = new Date(a.date || a.createdAt).getTime();
          valB = new Date(b.date || b.createdAt).getTime();
        } else if (sortField === 'itemsCount') {
          valA = a.items.length;
          valB = b.items.length;
        } else if (sortField === 'totalCost') {
          valA = a.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
          valB = b.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
        } else if (sortField === 'status') {
          valA = a.status.toLowerCase();
          valB = b.status.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [lists, searchTerm, selectedMachine, selectedClient, selectedStatus, sortField, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluída':
      case 'Aprovada':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {status}
          </span>
        );
      case 'Em Andamento':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400">
            <Clock className="h-3 w-3" />
            {status}
          </span>
        );
      case 'Entregue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/40 px-2.5 py-0.5 text-[11px] font-medium text-purple-400">
            <CheckCircle2 className="h-3 w-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
            <AlertCircle className="h-3 w-3" />
            {status || 'Rascunho'}
          </span>
        );
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-zinc-600 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-cyan-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-cyan-400" />
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
            Listas de Materiais Geradas
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie, filtre e exporte listas organizadas por máquina, cliente e projeto
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'table' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Visualização em Tabela"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'cards' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Visualização em Cartões"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* New List Button */}
          <button
            id="btn-new-list-main"
            onClick={onOpenNewListModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-950/40 transition hover:from-cyan-400 hover:to-blue-500"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Criar Nova Lista</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-5">
        {/* Search input */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            id="input-search-lists"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por lista, máquina, cliente, item..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2 text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter by Machine */}
        <div>
          <select
            id="filter-machine"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 outline-none transition focus:border-cyan-500"
          >
            <option value="ALL">Todas as Máquinas</option>
            {uniqueMachines.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Client */}
        <div>
          <select
            id="filter-client"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 outline-none transition focus:border-cyan-500"
          >
            <option value="ALL">Todos os Clientes</option>
            {uniqueClients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 outline-none transition focus:border-cyan-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluída">Concluída</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Rascunho">Rascunho</option>
            <option value="Entregue">Entregue</option>
          </select>
        </div>
      </div>

      {/* Results Header / Stats */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <span>
          Mostrando <strong className="text-zinc-200">{filteredAndSortedLists.length}</strong> de{' '}
          {lists.length} listas
        </span>
        <div className="flex items-center gap-1">
          <span>Ordenado por:</span>
          <span className="font-semibold text-cyan-400">
            {sortField === 'name' && 'Nome da Lista'}
            {sortField === 'machine' && 'Máquina'}
            {sortField === 'client' && 'Cliente'}
            {sortField === 'date' && 'Data'}
            {sortField === 'itemsCount' && 'Quantidade de Itens'}
            {sortField === 'totalCost' && 'Custo Total'}
            {sortField === 'status' && 'Status'}
          </span>
          <span className="text-zinc-500">({sortOrder === 'asc' ? 'Crescente ↑' : 'Decrescente ↓'})</span>
        </div>
      </div>

      {/* Lists Content: Table or Cards */}
      {filteredAndSortedLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">Nenhuma lista encontrada</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-400">
            {searchTerm || selectedMachine !== 'ALL' || selectedClient !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Nenhuma lista corresponde aos filtros aplicados. Tente ajustar os parâmetros de pesquisa.'
              : 'Você ainda não possui listas criadas. Clique no botão abaixo para iniciar.'}
          </p>
          <button
            onClick={onOpenNewListModal}
            className="mt-5 flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-md transition hover:bg-cyan-400"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Criar Lista de Materiais</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nome da Lista / Projeto</span>
                      {renderSortIndicator('name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('machine')}
                    className="cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Máquina</span>
                      {renderSortIndicator('machine')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('client')}
                    className="cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Cliente</span>
                      {renderSortIndicator('client')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('date')}
                    className="cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Data</span>
                      {renderSortIndicator('date')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('itemsCount')}
                    className="cursor-pointer px-3 py-3 text-center font-semibold transition hover:text-zinc-100"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Itens</span>
                      {renderSortIndicator('itemsCount')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalCost')}
                    className="cursor-pointer px-4 py-3 text-right font-semibold transition hover:text-zinc-100"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Custo Est.</span>
                      {renderSortIndicator('totalCost')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="cursor-pointer px-4 py-3 font-semibold transition hover:text-zinc-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Ações & Exportação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAndSortedLists.map((list) => {
                  const totalCost = list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
                  const totalWeight = list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
                  const isDeleting = deleteConfirmId === list.id;

                  return (
                    <tr
                      key={list.id}
                      className="group transition-colors hover:bg-zinc-900/50"
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onPreviewList(list)}
                          title="Clique para visualizar a lista"
                          className="text-left font-semibold text-zinc-100 transition hover:text-cyan-400 group-hover:text-cyan-300"
                        >
                          {list.name}
                        </button>
                        {list.notes && (
                          <p className="line-clamp-1 text-[11px] text-zinc-400">{list.notes}</p>
                        )}
                      </td>

                      {/* Machine */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-zinc-200">
                          <Cog className="h-3.5 w-3.5 text-cyan-400/70" />
                          <span>{list.machine}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{list.client || '-'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400">
                        {formatDate(list.date)}
                      </td>

                      {/* Items Count */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="rounded-lg bg-zinc-800/80 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-200">
                          {list.items.length}
                        </span>
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-200">
                        {totalCost > 0 ? (
                          <span className="font-semibold text-emerald-400">
                            {formatCurrency(totalCost, settings.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                        {totalWeight > 0 && (
                          <div className="text-[10px] text-zinc-400">
                            {totalWeight.toFixed(1)} kg
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(list.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] text-red-400">Excluir?</span>
                            <button
                              onClick={() => onDeleteList(list.id)}
                              className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {/* Visualizar */}
                            <button
                              onClick={() => onPreviewList(list)}
                              title="Visualizar Lista Completa"
                              className="rounded-lg p-1.5 text-cyan-400 transition hover:bg-cyan-950/60 hover:text-cyan-300"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* WhatsApp */}
                            <button
                              onClick={() => onOpenWhatsApp(list)}
                              title="Compartilhar via WhatsApp"
                              className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/60 hover:text-emerald-300"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>

                            {/* PDF */}
                            <button
                              onClick={() => exportListToPDF(list, settings)}
                              title="Baixar PDF formatado"
                              className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-950/60 hover:text-rose-300"
                            >
                              <FileText className="h-4 w-4" />
                            </button>

                            {/* Excel */}
                            <button
                              onClick={() => exportListToExcel(list, settings)}
                              title="Baixar Planilha Excel (.xlsx)"
                              className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/60 hover:text-emerald-300"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditList(list)}
                              title="Editar Lista e Itens"
                              className="rounded-lg p-1.5 text-cyan-400 transition hover:bg-cyan-950/60 hover:text-cyan-300"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => onDuplicateList(list.id)}
                              title="Duplicar / Clonar Lista"
                              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                            >
                              <Copy className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteConfirmId(list.id)}
                              title="Excluir Lista"
                              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedLists.map((list) => {
            const totalCost = list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
            const totalWeight = list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
            const isDeleting = deleteConfirmId === list.id;

            return (
              <div
                key={list.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl transition hover:border-zinc-700/80"
              >
                <div>
                  {/* Top info and status */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                      <h3
                        onClick={() => onPreviewList(list)}
                        title="Clique para visualizar a lista"
                        className="cursor-pointer font-semibold text-zinc-100 transition hover:text-cyan-400"
                      >
                        {list.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                        <Cog className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{list.machine}</span>
                      </div>
                    </div>
                    <div>{getStatusBadge(list.status)}</div>
                  </div>

                  {/* Client, Date, Items */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Building2 className="h-3.5 w-3.5" /> Cliente:
                      </span>
                      <span className="font-medium text-zinc-200">{list.client || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Calendar className="h-3.5 w-3.5" /> Data:
                      </span>
                      <span className="text-zinc-300">{formatDate(list.date)}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500">Total de Itens:</span>
                      <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono font-bold text-zinc-200">
                        {list.items.length} itens
                      </span>
                    </div>

                    {totalCost > 0 && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-zinc-500">Custo Estimado:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrency(totalCost, settings.currencySymbol)}
                        </span>
                      </div>
                    )}

                    {totalWeight > 0 && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-zinc-500">Peso Total:</span>
                        <span className="text-zinc-300">{totalWeight.toFixed(2)} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  {isDeleting ? (
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs text-red-400">Confirmar exclusão?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onDeleteList(list.id)}
                          className="rounded bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-500"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenWhatsApp(list)}
                          title="WhatsApp"
                          className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/60"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportListToPDF(list, settings)}
                          title="PDF"
                          className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-950/60"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportListToExcel(list, settings)}
                          title="Excel"
                          className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/60"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onPreviewList(list)}
                          className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-900/50 hover:text-cyan-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver</span>
                        </button>
                        <button
                          onClick={() => onEditList(list)}
                          className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => onDuplicateList(list.id)}
                          title="Duplicar"
                          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(list.id)}
                          title="Excluir"
                          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
