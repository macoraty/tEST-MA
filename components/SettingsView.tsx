'use client';

import React, { useState } from 'react';
import { AppSettings, CatalogItem } from '@/lib/types';
import {
  Settings,
  Layers,
  Ruler,
  Building,
  MessageSquare,
  Database,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  RotateCcw,
  Check,
  Phone,
  Mail,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  catalog: CatalogItem[];
  onSaveSettings: (settings: AppSettings) => void;
  onAddGroup: (group: string) => void;
  onDeleteGroup: (group: string) => void;
  onAddUnit: (unit: string) => void;
  onDeleteUnit: (unit: string) => void;
  onExportBackup: () => void;
  onImportBackup: (json: string) => boolean;
  onResetCatalog: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  catalog,
  onSaveSettings,
  onAddGroup,
  onDeleteGroup,
  onAddUnit,
  onDeleteUnit,
  onExportBackup,
  onImportBackup,
  onResetCatalog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'parameters' | 'company' | 'whatsapp' | 'backup'>('parameters');
  const [newGroupInput, setNewGroupInput] = useState('');
  const [newUnitInput, setNewUnitInput] = useState('');

  // Editable company settings
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone || '');
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail || '');
  const [companyCnpj, setCompanyCnpj] = useState(settings.companyCnpj || '');
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress || '');
  const [defaultResponsible, setDefaultResponsible] = useState(settings.defaultResponsible || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'R$');
  const [whatsAppTemplate, setWhatsAppTemplate] = useState(settings.whatsAppTemplate || '');

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      companyName,
      companyPhone,
      companyEmail,
      companyCnpj,
      companyAddress,
      defaultResponsible,
      currencySymbol,
      whatsAppTemplate,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupInput.trim()) return;
    onAddGroup(newGroupInput.trim().toUpperCase());
    setNewGroupInput('');
  };

  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitInput.trim()) return;
    onAddUnit(newUnitInput.trim().toUpperCase());
    setNewUnitInput('');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportBackup(content);
      if (success) {
        setImportStatus('Backup importado e restaurado com sucesso!');
      } else {
        setImportStatus('Erro: O arquivo JSON selecionado é inválido.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Count items per group
  const groupCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    catalog.forEach((item) => {
      counts[item.group] = (counts[item.group] || 0) + 1;
    });
    return counts;
  }, [catalog]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
          Configurações & Parâmetros do Sistema
        </h1>
        <p className="text-xs text-zinc-400">
          Personalize grupos, unidades de medida, dados da empresa para PDF/Excel, WhatsApp e backups
        </p>
      </div>

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSubTab('parameters')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            activeSubTab === 'parameters'
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Grupos & Unidades</span>
        </button>

        <button
          onClick={() => setActiveSubTab('company')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            activeSubTab === 'company'
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Dados da Empresa & Cabeçalho</span>
        </button>

        <button
          onClick={() => setActiveSubTab('whatsapp')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            activeSubTab === 'whatsapp'
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Template do WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            activeSubTab === 'backup'
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Banco de Dados & Backup</span>
        </button>
      </div>

      {/* SUB-TAB 1: Dynamic Groups & Units */}
      {activeSubTab === 'parameters' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Grupos / Categorias */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Grupos / Categorias</h3>
                  <p className="text-[11px] text-zinc-400">
                    Classificação de materiais para pesquisa e relatórios
                  </p>
                </div>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300">
                {settings.groups.length} grupos
              </span>
            </div>

            {/* Add Group Form */}
            <form onSubmit={handleAddGroupSubmit} className="mt-4 flex gap-2">
              <input
                id="input-new-group-name"
                type="text"
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                placeholder="Nome do novo grupo (ex: HIDRÁULICA, ELÉTRICA)"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
              />
              <button
                id="btn-add-group"
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-400"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </form>

            {/* Group List */}
            <div className="mt-4 space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {settings.groups.map((grp) => {
                const count = groupCounts[grp] || 0;
                return (
                  <div
                    key={grp}
                    className="flex items-center justify-between rounded-xl border border-zinc-850 bg-zinc-900/70 px-3.5 py-2 text-xs transition hover:border-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200">{grp}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                        {count} {count === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteGroup(grp)}
                      title={`Remover grupo ${grp}`}
                      className="rounded p-1 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                      disabled={settings.groups.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unidades de Medida */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Unidades de Medida</h3>
                  <p className="text-[11px] text-zinc-400">
                    Unidades disponíveis para medição e contagem
                  </p>
                </div>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300">
                {settings.units.length} unidades
              </span>
            </div>

            {/* Add Unit Form */}
            <form onSubmit={handleAddUnitSubmit} className="mt-4 flex gap-2">
              <input
                id="input-new-unit-name"
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="Nova unidade (ex: M2, CJ, KIT, RL)"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
              />
              <button
                id="btn-add-unit"
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-400"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </form>

            {/* Units Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-96 overflow-y-auto pr-1">
              {settings.units.map((u) => (
                <div
                  key={u}
                  className="flex items-center justify-between rounded-xl border border-zinc-850 bg-zinc-900/70 px-3 py-2 text-xs transition hover:border-zinc-700"
                >
                  <span className="font-mono font-bold text-cyan-300">{u}</span>
                  <button
                    onClick={() => onDeleteUnit(u)}
                    title={`Remover unidade ${u}`}
                    className="rounded p-1 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                    disabled={settings.units.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Company & Headers */}
      {activeSubTab === 'company' && (
        <div className="max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
          <div className="border-b border-zinc-800 pb-4">
            <h3 className="text-base font-bold text-zinc-100">
              Dados da Empresa & Informações de Cabeçalho
            </h3>
            <p className="text-xs text-zinc-400">
              Estes dados serão impressos automaticamente nos relatórios PDF e planilhas Excel geradas
            </p>
          </div>

          <form onSubmit={handleSaveCompanyInfo} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Nome da Empresa / Razão Social
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Indústria Metalúrgica Alfa Ltda"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">CNPJ</label>
                <input
                  type="text"
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Telefone / WhatsApp de Contato
                </label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">E-mail Comercial</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="orcamentos@empresa.com.br"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Endereço / Localidade
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Av. Industrial, 500 - Distrito Industrial - São Paulo/SP"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Responsável Técnico Padrão
                </label>
                <input
                  type="text"
                  value={defaultResponsible}
                  onChange={(e) => setDefaultResponsible(e.target.value)}
                  placeholder="Ex: Engenharia / Manutenção"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Símbolo Monetário
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="R$"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-400"
              >
                {savedFeedback ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                <span>{savedFeedback ? 'Dados Salvos!' : 'Salvar Informações da Empresa'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: WhatsApp Template */}
      {activeSubTab === 'whatsapp' && (
        <div className="max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
          <div className="border-b border-zinc-800 pb-4">
            <h3 className="text-base font-bold text-zinc-100">
              Personalização da Mensagem de WhatsApp
            </h3>
            <p className="text-xs text-zinc-400">
              Ajuste as tags dinâmicas que serão preenchidas ao gerar o texto para envio aos clientes e equipes
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs text-zinc-300">
            <span className="font-semibold text-cyan-400">Variáveis dinâmicas suportadas:</span>
            <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{empresa}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{nome_lista}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{maquina}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{cliente}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{responsavel}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{data}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{total_itens}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{itens}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{resumo_financeiro}`}</code>
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{`{observacoes}`}</code>
            </div>
          </div>

          <div className="mt-4">
            <textarea
              rows={10}
              value={whatsAppTemplate}
              onChange={(e) => setWhatsAppTemplate(e.target.value)}
              className="w-full font-mono text-xs rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-200 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setWhatsAppTemplate(`📋 *LISTA DE MATERIAIS / ORÇAMENTO*\n🏭 *Empresa:* {empresa}\n📄 *Lista:* {nome_lista}\n⚙️ *Máquina/Equipamento:* {maquina}\n🏢 *Cliente:* {cliente}\n👤 *Responsável:* {responsavel}\n📅 *Data:* {data}\n━━━━━━━━━━━━━━━━━━━\n📦 *ITENS DA LISTA ({total_itens} itens):*\n{itens}\n━━━━━━━━━━━━━━━━━━━\n{resumo_financeiro}\n📝 *Observações:* {observacoes}`);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline"
            >
              Restaurar Mensagem Padrão
            </button>

            <button
              onClick={handleSaveCompanyInfo}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-400"
            >
              {savedFeedback ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span>{savedFeedback ? 'Template Salvo!' : 'Salvar Template'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Database & Backup */}
      {activeSubTab === 'backup' && (
        <div className="max-w-3xl space-y-5">
          {importStatus && (
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-4 text-xs font-semibold text-cyan-300">
              {importStatus}
            </div>
          )}

          {/* Export and Import Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h3 className="text-base font-bold text-zinc-100">
              Backup & Restauração de Dados
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Exporte todos os materiais cadastrados, listas e configurações em um único arquivo de segurança.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Export Backup */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <h4 className="font-semibold text-zinc-200">Exportar Backup Completo</h4>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Gera um arquivo .json seguro com todas as listas e catálogo atual.
                </p>
                <button
                  id="btn-export-backup"
                  onClick={onExportBackup}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-700"
                >
                  <Download className="h-4 w-4 text-cyan-400" />
                  <span>Baixar Arquivo de Backup</span>
                </button>
              </div>

              {/* Import Backup */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <h4 className="font-semibold text-zinc-200">Importar Backup</h4>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Carregue um arquivo JSON gerado anteriormente.
                </p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-700">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span>Selecionar Arquivo JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Reset Factory Seed Database */}
          <div className="rounded-2xl border border-red-950/60 bg-zinc-950 p-6 shadow-xl">
            <h3 className="text-base font-bold text-zinc-100">
              Restaurar Banco de Dados Original (15 Páginas da PDF)
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Recarrega os 300+ itens extraídos do catálogo fornecido (Correntes, Mancais, Parafusos Allen, Sextavados, Porcas, Rolamentos Séries 6000/6200, Barras Chatas, Tubos, Vigas, Motores, Redutores IBR, Pneumática PCF/PLF/PUL/PUT e Guias).
            </p>
            <button
              onClick={onResetCatalog}
              className="mt-4 flex items-center gap-2 rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/40"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restaurar Catálogo Original Completo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
