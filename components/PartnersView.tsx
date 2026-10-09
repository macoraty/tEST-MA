'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  MessageCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ClipboardList,
  FileText,
  X,
  Briefcase,
  Download,
  Check,
  CreditCard,
} from 'lucide-react';
import { Partner, PartnerType, AppSettings } from '@/lib/types';

interface PartnersViewProps {
  partners: Partner[];
  settings: AppSettings;
  onSavePartner: (partner: Partner) => void;
  onDeletePartner: (id: string) => void;
  onNewListForClient?: (clientName: string) => void;
  onNewRequisitionForSupplier?: (supplierName: string) => void;
  initialTypeFilter?: 'todos' | 'cliente' | 'fornecedor';
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  settings,
  onSavePartner,
  onDeletePartner,
  onNewListForClient,
  onNewRequisitionForSupplier,
  initialTypeFilter = 'todos',
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'cliente' | 'fornecedor'>(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    type: PartnerType;
    name: string;
    tradeName: string;
    document: string;
    phone: string;
    email: string;
    contactPerson: string;
    city: string;
    state: string;
    address: string;
    category: string;
    paymentTerms: string;
    notes: string;
    status: 'ativo' | 'inativo';
  }>({
    type: 'cliente',
    name: '',
    tradeName: '',
    document: '',
    phone: '',
    email: '',
    contactPerson: '',
    city: '',
    state: 'SP',
    address: '',
    category: '',
    paymentTerms: '',
    notes: '',
    status: 'ativo',
  });

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [partners]);

  // Filtered Partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      // Type Filter
      if (typeFilter === 'cliente' && p.type !== 'cliente' && p.type !== 'ambos') return false;
      if (typeFilter === 'fornecedor' && p.type !== 'fornecedor' && p.type !== 'ambos') return false;

      // Status Filter
      if (statusFilter !== 'todos' && p.status !== statusFilter) return false;

      // Category Filter
      if (categoryFilter !== 'todos' && p.category !== categoryFilter) return false;

      // Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(query);
        const matchTrade = (p.tradeName || '').toLowerCase().includes(query);
        const matchDoc = (p.document || '').toLowerCase().includes(query);
        const matchContact = (p.contactPerson || '').toLowerCase().includes(query);
        const matchCity = (p.city || '').toLowerCase().includes(query);
        const matchEmail = (p.email || '').toLowerCase().includes(query);
        const matchPhone = (p.phone || '').toLowerCase().includes(query);
        const matchCat = (p.category || '').toLowerCase().includes(query);

        if (!matchName && !matchTrade && !matchDoc && !matchContact && !matchCity && !matchEmail && !matchPhone && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [partners, typeFilter, statusFilter, categoryFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = partners.length;
    const clients = partners.filter((p) => p.type === 'cliente' || p.type === 'ambos').length;
    const suppliers = partners.filter((p) => p.type === 'fornecedor' || p.type === 'ambos').length;
    const active = partners.filter((p) => p.status === 'ativo').length;
    const cities = new Set(partners.map((p) => p.city).filter(Boolean)).size;

    return { total, clients, suppliers, active, cities };
  }, [partners]);

  // Modal Open Handlers
  const handleOpenNewModal = (defaultType: PartnerType = 'cliente') => {
    setEditingPartner(null);
    setFormData({
      type: defaultType,
      name: '',
      tradeName: '',
      document: '',
      phone: '',
      email: '',
      contactPerson: '',
      city: '',
      state: 'SP',
      address: '',
      category: '',
      paymentTerms: '30 dias',
      notes: '',
      status: 'ativo',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      id: partner.id,
      type: partner.type,
      name: partner.name,
      tradeName: partner.tradeName || '',
      document: partner.document || '',
      phone: partner.phone || '',
      email: partner.email || '',
      contactPerson: partner.contactPerson || '',
      city: partner.city || '',
      state: partner.state || 'SP',
      address: partner.address || '',
      category: partner.category || '',
      paymentTerms: partner.paymentTerms || '',
      notes: partner.notes || '',
      status: partner.status,
    });
    setIsModalOpen(true);
  };

  // Save Handler
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const partnerToSave: Partner = {
      id: editingPartner ? editingPartner.id : `partner-${Date.now()}`,
      type: formData.type,
      name: formData.name.trim(),
      tradeName: formData.tradeName.trim() || undefined,
      document: formData.document.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      contactPerson: formData.contactPerson.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      address: formData.address.trim() || undefined,
      category: formData.category.trim() || undefined,
      paymentTerms: formData.paymentTerms.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      status: formData.status,
      createdAt: editingPartner ? editingPartner.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSavePartner(partnerToSave);
    setIsModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Tipo',
      'Razão Social / Nome',
      'Nome Fantasia',
      'CNPJ / CPF',
      'Telefone',
      'Email',
      'Contato',
      'Cidade',
      'UF',
      'Categoria',
      'Condição Pagamento',
      'Status',
    ];

    const rows = filteredPartners.map((p) => [
      p.type.toUpperCase(),
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.tradeName || '').replace(/"/g, '""')}"`,
      `"${(p.document || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(p.city || '').replace(/"/g, '""')}"`,
      p.state || '',
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.paymentTerms || '').replace(/"/g, '""')}"`,
      p.status.toUpperCase(),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes_e_fornecedores_maikmaq_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Format clean phone for WhatsApp
  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10 && !digits.startsWith('55')) {
      return `55${digits}`;
    }
    return digits;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-sm shadow-cyan-950/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
                Fornecedores & Clientes
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Gestão comercial centralizada no <strong className="text-cyan-400">Maikmaq System</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition active:scale-95 cursor-pointer shadow-sm"
            title="Exportar dados para Excel (.CSV)"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewModal('cliente')}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Novo Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewModal('fornecedor')}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-600 hover:bg-purple-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        {/* Total Cadastros */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Geral</span>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100 font-mono">{stats.total}</div>
          <div className="text-[11px] text-zinc-500 mt-1">{stats.active} ativos no sistema</div>
        </div>

        {/* Clientes */}
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">{stats.clients}</div>
          <div className="text-[11px] text-cyan-400/80 mt-1">Destinatários de BOM & Orçamentos</div>
        </div>

        {/* Fornecedores */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Fornecedores</span>
            <Briefcase className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">{stats.suppliers}</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Insumos, Peças & Matéria-Prima</div>
        </div>

        {/* Cidades / Regiões */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Regiões</span>
            <MapPin className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100 font-mono">{stats.cities}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Cidades cadastradas</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por Razão Social, Fantasia, CNPJ/CPF, Cidade, Contato ou Segmento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Segmented Type Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => setTypeFilter('todos')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                typeFilter === 'todos'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({partners.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('cliente')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                typeFilter === 'cliente'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Clientes ({stats.clients})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('fornecedor')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                typeFilter === 'fornecedor'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Fornecedores ({stats.suppliers})
            </button>
          </div>
        </div>

        {/* Secondary Sub-filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Apenas Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <span>Segmento:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none cursor-pointer max-w-[200px]"
              >
                <option value="todos">Todos os Segmentos</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto text-[11px] text-zinc-500">
            Exibindo <strong>{filteredPartners.length}</strong> de {partners.length} registros
          </div>
        </div>
      </div>

      {/* Partners List / Cards Grid */}
      {filteredPartners.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-400 mb-4">
            <Users className="h-7 w-7 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-200">Nenhum parceiro encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-6">
            {searchTerm || typeFilter !== 'todos' || statusFilter !== 'todos'
              ? 'Nenhum resultado corresponde aos filtros aplicados. Tente limpar os filtros de busca.'
              : 'Cadastre seus fornecedores e clientes para agilizar orçamentos e listas de materiais.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenNewModal('cliente')}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Cadastrar Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenNewModal('fornecedor')}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Cadastrar Fornecedor</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPartners.map((partner) => {
            const isClient = partner.type === 'cliente' || partner.type === 'ambos';
            const isSupplier = partner.type === 'fornecedor' || partner.type === 'ambos';
            const cleanPhone = getCleanPhone(partner.phone);

            return (
              <div
                key={partner.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-sm hover:border-zinc-700 hover:shadow-md transition-all"
              >
                <div>
                  {/* Top Tags & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {partner.type === 'cliente' && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                          <Building2 className="h-3 w-3" />
                          CLIENTE
                        </span>
                      )}
                      {partner.type === 'fornecedor' && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                          <Briefcase className="h-3 w-3" />
                          FORNECEDOR
                        </span>
                      )}
                      {partner.type === 'ambos' && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <Users className="h-3 w-3" />
                          CLIENTE & FORNECEDOR
                        </span>
                      )}

                      {partner.category && (
                        <span className="rounded-lg bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300 truncate max-w-[140px]">
                          {partner.category}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        partner.status === 'ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {partner.status === 'ativo' ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Ativo
                        </>
                      ) : (
                        'Inativo'
                      )}
                    </span>
                  </div>

                  {/* Name & Trade Name */}
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                      {partner.name}
                    </h3>
                    {partner.tradeName && partner.tradeName !== partner.name && (
                      <div className="text-xs font-semibold text-zinc-400">
                        Fantasia: {partner.tradeName}
                      </div>
                    )}
                    {partner.document && (
                      <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                        CNPJ/CPF: {partner.document}
                      </div>
                    )}
                  </div>

                  {/* Contact & Location Details */}
                  <div className="space-y-1.5 border-t border-zinc-800/80 pt-3 text-xs text-zinc-300">
                    {partner.contactPerson && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Users className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">Contato: <strong className="text-zinc-200">{partner.contactPerson}</strong></span>
                      </div>
                    )}

                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="font-mono text-zinc-300">{partner.phone}</span>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}

                    {partner.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <a
                          href={`mailto:${partner.email}`}
                          className="text-cyan-400 hover:underline truncate"
                        >
                          {partner.email}
                        </a>
                      </div>
                    )}

                    {(partner.city || partner.state) && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span>
                          {partner.city || 'Cidade N/D'}
                          {partner.state ? ` - ${partner.state}` : ''}
                        </span>
                      </div>
                    )}

                    {partner.paymentTerms && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <CreditCard className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span>Condição: {partner.paymentTerms}</span>
                      </div>
                    )}

                    {partner.notes && (
                      <div className="mt-2 rounded-lg bg-zinc-950/70 p-2 text-[11px] text-zinc-400 italic border border-zinc-800/60 line-clamp-2">
                        &ldquo;{partner.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Quick Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Create List for this Client */}
                    {isClient && onNewListForClient && (
                      <button
                        type="button"
                        onClick={() => onNewListForClient(partner.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 px-2 py-1 text-[11px] font-bold text-cyan-300 transition cursor-pointer"
                        title="Criar Lista de Materiais para este Cliente"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>+ Lista BOM</span>
                      </button>
                    )}

                    {/* Create Requisition for this Supplier */}
                    {isSupplier && onNewRequisitionForSupplier && (
                      <button
                        type="button"
                        onClick={() => onNewRequisitionForSupplier(partner.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 px-2 py-1 text-[11px] font-bold text-purple-300 transition cursor-pointer"
                        title="Criar Solicitação/Cotação para este Fornecedor"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>+ Cotação</span>
                      </button>
                    )}
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(partner)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition cursor-pointer"
                      title="Editar Cadastro"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {deletingId === partner.id ? (
                      <div className="flex items-center gap-1 bg-red-950/60 border border-red-500/40 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeletePartner(partner.id);
                            setDeletingId(null);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white hover:bg-red-500"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-1.5 py-0.5 rounded text-[10px] text-zinc-300 hover:text-white"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(partner.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-950/40 hover:text-red-400 transition cursor-pointer"
                        title="Excluir Parceiro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Criar / Editar Fornecedor ou Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    formData.type === 'fornecedor'
                      ? 'border-purple-500/40 bg-purple-950/40 text-purple-400'
                      : 'border-cyan-500/40 bg-cyan-950/40 text-cyan-400'
                  }`}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">
                    {editingPartner ? 'Editar Cadastro' : 'Novo Cadastro no Maikmaq System'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Preencha as informações do cliente ou fornecedor
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {/* Tipo de Cadastro */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Tipo de Parceiro *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'cliente' }))}
                    className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition cursor-pointer ${
                      formData.type === 'cliente'
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'fornecedor' }))}
                    className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition cursor-pointer ${
                      formData.type === 'fornecedor'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-sm'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Fornecedor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'ambos' }))}
                    className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition cursor-pointer ${
                      formData.type === 'ambos'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Ambos (Cliente & Forn.)</span>
                  </button>
                </div>
              </div>

              {/* Razão Social & Nome Fantasia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Razão Social / Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alimentos Boa Safra Ltda"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Boa Safra"
                    value={formData.tradeName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tradeName: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              {/* CNPJ/CPF & Segmento / Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={formData.document}
                    onChange={(e) => setFormData((prev) => ({ ...prev, document: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Categoria / Ramo de Atividade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Indústria Alimentícia, Usinagem, Parafusos..."
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              {/* Telefone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Telefone / WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    placeholder="contato@empresa.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              {/* Contato & Condição Comercial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Pessoa de Contato / Representante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Eng. Roberto Alves ou Felipe"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Condição de Pagamento Padrão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 30 dias, 28/45 dias, À vista c/ desconto"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              {/* Endereço, Cidade e Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Industrial, 500 - Distrito Industrial"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cidade / UF
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="UF"
                      value={formData.state}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      className="w-14 text-center uppercase font-mono rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Observações / Anotações */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observações Internas (Máquinas, histórico, preferências)
                </label>
                <textarea
                  rows={3}
                  placeholder="Anotações comerciais, detalhes técnicos, máquinas associadas..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="status-checkbox"
                  checked={formData.status === 'ativo'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.checked ? 'ativo' : 'inativo' }))}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="status-checkbox" className="text-xs font-medium text-zinc-300 cursor-pointer">
                  Cadastro Ativo (disponível para novas listas e cotações)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-cyan-500/40 bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {editingPartner ? 'Salvar Alterações' : 'Salvar no Maikmaq System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
