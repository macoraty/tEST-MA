'use client';

import React, { useState } from 'react';
import {
  AppSettings,
  CatalogItem,
  PDFTemplateType,
  ExcelTemplateType,
  PDFThemeColor,
} from '@/lib/types';
import { getGroupPrefix } from '@/lib/codeUtils';
import { generateSamplePDF, generateSampleExcel } from '@/lib/exportUtils';
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
  Tag,
  Sparkles,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Image as ImageIcon,
  FileSpreadsheet,
  Palette,
  CheckCircle2,
  Sliders,
  Eye,
  FileCheck,
  Briefcase,
  Wrench,
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
  onRegenerateAllCodes: () => { totalUpdated: number; totalItems: number };
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
  onRegenerateAllCodes,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'parameters' | 'codes' | 'company' | 'templates' | 'whatsapp' | 'backup'
  >('company');

  const [newGroupInput, setNewGroupInput] = useState('');
  const [newUnitInput, setNewUnitInput] = useState('');

  // Editable app branding & logo settings
  const [appName, setAppName] = useState(settings.appName || 'ListaPro Industrial');
  const [appLogo, setAppLogo] = useState(settings.appLogo || '');
  const [appLogoError, setAppLogoError] = useState<string | null>(null);

  // Editable company settings
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [companyLogo, setCompanyLogo] = useState(settings.companyLogo || '');
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone || '');
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail || '');
  const [companyCnpj, setCompanyCnpj] = useState(settings.companyCnpj || '');
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress || '');
  const [defaultResponsible, setDefaultResponsible] = useState(settings.defaultResponsible || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'R$');
  const [whatsAppTemplate, setWhatsAppTemplate] = useState(settings.whatsAppTemplate || '');

  // Template settings
  const [pdfTemplate, setPdfTemplate] = useState<PDFTemplateType>(
    settings.pdfTemplate || 'modern'
  );
  const [pdfThemeColor, setPdfThemeColor] = useState<PDFThemeColor>(
    settings.pdfThemeColor || 'navy'
  );
  const [pdfShowLogo, setPdfShowLogo] = useState<boolean>(
    settings.pdfShowLogo ?? true
  );
  const [pdfShowPrices, setPdfShowPrices] = useState<boolean>(
    settings.pdfShowPrices ?? true
  );
  const [pdfShowWeights, setPdfShowWeights] = useState<boolean>(
    settings.pdfShowWeights ?? true
  );
  const [pdfShowSignatures, setPdfShowSignatures] = useState<boolean>(
    settings.pdfShowSignatures ?? true
  );
  const [pdfShowNotes, setPdfShowNotes] = useState<boolean>(
    settings.pdfShowNotes ?? true
  );
  const [pdfFooterText, setPdfFooterText] = useState<string>(
    settings.pdfFooterText || 'Documento técnico emitido pelo Sistema de Gestão Industrial'
  );

  const [excelTemplate, setExcelTemplate] = useState<ExcelTemplateType>(
    settings.excelTemplate || 'complete'
  );
  const [excelIncludeSummary, setExcelIncludeSummary] = useState<boolean>(
    settings.excelIncludeSummary ?? true
  );
  const [excelIncludeHeader, setExcelIncludeHeader] = useState<boolean>(
    settings.excelIncludeHeader ?? true
  );
  const [excelShowPrices, setExcelShowPrices] = useState<boolean>(
    settings.excelShowPrices ?? true
  );
  const [excelShowWeights, setExcelShowWeights] = useState<boolean>(
    settings.excelShowWeights ?? true
  );

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Code Regeneration state & confirmation modal
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [codeRegenFeedback, setCodeRegenFeedback] = useState<string | null>(null);

  // Program Logo upload handler
  const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAppLogoError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAppLogoError('A imagem deve ter no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setAppLogo(base64Data);
    };
    reader.onerror = () => {
      setAppLogoError('Erro ao ler a imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetAppLogo = () => {
    setAppLogo('');
    setAppLogoError(null);
  };

  // Company Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setLogoError('A imagem deve ter no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setCompanyLogo(base64Data);
    };
    reader.onerror = () => {
      setLogoError('Erro ao ler a imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setCompanyLogo('');
    setLogoError(null);
  };

  const handleSaveAllSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedSettings: AppSettings = {
      ...settings,
      appName: appName.trim() || 'ListaPro Industrial',
      appLogo,
      companyName,
      companyLogo,
      companyPhone,
      companyEmail,
      companyCnpj,
      companyAddress,
      defaultResponsible,
      currencySymbol,
      whatsAppTemplate,

      // PDF
      pdfTemplate,
      pdfThemeColor,
      pdfShowLogo,
      pdfShowPrices,
      pdfShowWeights,
      pdfShowSignatures,
      pdfShowNotes,
      pdfFooterText,

      // Excel
      excelTemplate,
      excelIncludeSummary,
      excelIncludeHeader,
      excelShowPrices,
      excelShowWeights,
    };

    onSaveSettings(updatedSettings);
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

  const handleExecuteRegenerateCodes = () => {
    const res = onRegenerateAllCodes();
    setIsRegenerateModalOpen(false);
    setCodeRegenFeedback(
      `Sucesso! ${res.totalItems} materiais foram reordenados e padronizados com o formato [5 Letras + 4 Dígitos].`
    );
    setTimeout(() => setCodeRegenFeedback(null), 5000);
  };

  // Count items per group
  const groupCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    catalog.forEach((item) => {
      const grp = item.group || 'INSUMOS GERAIS';
      counts[grp] = (counts[grp] || 0) + 1;
    });
    return counts;
  }, [catalog]);

  const currentActiveSettings: AppSettings = {
    ...settings,
    appName: appName.trim() || 'ListaPro Industrial',
    appLogo,
    companyName,
    companyLogo,
    companyPhone,
    companyEmail,
    companyCnpj,
    companyAddress,
    defaultResponsible,
    currencySymbol,
    whatsAppTemplate,
    pdfTemplate,
    pdfThemeColor,
    pdfShowLogo,
    pdfShowPrices,
    pdfShowWeights,
    pdfShowSignatures,
    pdfShowNotes,
    pdfFooterText,
    excelTemplate,
    excelIncludeSummary,
    excelIncludeHeader,
    excelShowPrices,
    excelShowWeights,
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
            Configurações & Parâmetros do Sistema
          </h1>
          <p className="text-xs text-zinc-400">
            Personalize o logo do programa, logo da empresa, templates de PDF/Excel, dados cadastrais, grupos e códigos
          </p>
        </div>

        {savedFeedback && (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>Configurações Salvas com Sucesso!</span>
          </div>
        )}
      </div>

      {codeRegenFeedback && (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/60 p-4 text-xs font-medium text-cyan-200">
          <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
          <span>{codeRegenFeedback}</span>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          id="tab-btn-company"
          onClick={() => setActiveSubTab('company')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            activeSubTab === 'company'
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Identidade Visual & Logos (Programa / Empresa)</span>
        </button>

        <button
          id="tab-btn-templates"
          onClick={() => setActiveSubTab('templates')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            activeSubTab === 'templates'
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Templates PDF & Excel</span>
        </button>

        <button
          id="tab-btn-codes"
          onClick={() => setActiveSubTab('codes')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            activeSubTab === 'codes'
              ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Padronização de Códigos (5L + 4N)</span>
        </button>

        <button
          id="tab-btn-parameters"
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
          id="tab-btn-whatsapp"
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
          id="tab-btn-backup"
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

      {/* SUB-TAB: Company Data & Logo */}
      {activeSubTab === 'company' && (
        <div className="max-w-4xl space-y-6">
          <form onSubmit={handleSaveAllSettings} className="space-y-6">
            {/* 1. SEÇÃO: LOGOTIPO & NOME DO PROGRAMA */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-zinc-950 to-zinc-950 p-6 shadow-xl sm:p-7">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100">Logotipo do Programa (Barra Superior)</h3>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                      Sistema Principal
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Insira uma imagem personalizada para o logo do programa ou utilize o monograma padrão com a letra &quot;M&quot;.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Logo Preview no Header */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-500/30 bg-zinc-900/80 p-5 text-center">
                  <div className="space-y-3 w-full">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/90">
                      Prévia no Cabeçalho
                    </span>
                    <div className="mx-auto flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 shadow-md justify-center">
                      {appLogo ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-500/40 bg-zinc-900/90 p-1 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={appLogo}
                            alt="Logo do Programa"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950 via-zinc-900 to-zinc-950 text-cyan-400 shadow-sm">
                          <span className="font-mono text-xl font-black tracking-tight text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                            M
                          </span>
                        </div>
                      )}
                      <div className="text-left min-w-0">
                        <span className="block truncate text-xs font-bold text-zinc-100">
                          {appName || 'ListaPro Industrial'}
                        </span>
                        <span className="text-[10px] text-zinc-400">v1.0</span>
                      </div>
                    </div>

                    <span className="inline-block rounded-md bg-cyan-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                      {appLogo ? 'Logo Customizado Ativo' : 'Monograma [M] Ativo'}
                    </span>
                  </div>
                </div>

                {/* Upload & Actions for App Logo */}
                <div className="sm:col-span-2 flex flex-col justify-center space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-200">
                      Nome do Programa / Sistema
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Ex: ListaPro Industrial ou Metalúrgica Silva"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Título exibido ao lado do logo na barra superior do software.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-200">
                      Arquivo de Imagem para o Logo do Programa
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Formatos suportados: PNG, JPG, SVG ou WEBP (até 3MB). Fundo transparente recomendado.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <label
                      htmlFor="app-logo-input"
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md transition hover:bg-cyan-400"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{appLogo ? 'Trocar Logo do Programa' : 'Carregar Logo do Programa'}</span>
                      <input
                        id="app-logo-input"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                        onChange={handleAppLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {appLogo && (
                      <button
                        type="button"
                        onClick={handleResetAppLogo}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Restaurar Monograma &quot;M&quot;</span>
                      </button>
                    )}

                    {companyLogo && !appLogo && (
                      <button
                        type="button"
                        onClick={() => setAppLogo(companyLogo)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-900/50"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Usar mesmo Logo da Empresa</span>
                      </button>
                    )}
                  </div>

                  {appLogoError && (
                    <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{appLogoError}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. SEÇÃO: LOGOTIPO DA EMPRESA (RELATÓRIOS PDF / EXPORTAÇÃO) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-7">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Logotipo da Empresa (Relatórios PDF & Exportações)</h3>
                  <p className="text-xs text-zinc-400">
                    O logotipo será exibido automaticamente no cabeçalho dos relatórios PDF e orçamentos exportados
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Logo Preview */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-750 bg-zinc-900/60 p-5 text-center">
                  {companyLogo ? (
                    <div className="space-y-3">
                      <div className="relative mx-auto flex h-28 w-44 items-center justify-center rounded-xl border border-zinc-800 bg-white/95 p-2 shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={companyLogo}
                          alt="Logo da Empresa"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="inline-block rounded-md bg-emerald-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        Logotipo Ativo nos Relatórios
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-500">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                      <p className="text-xs font-medium text-zinc-400">Nenhum logo carregado</p>
                      <p className="text-[11px] text-zinc-500">PNG, JPG, SVG ou WEBP (Max 3MB)</p>
                    </div>
                  )}
                </div>

                {/* Upload & Actions */}
                <div className="sm:col-span-2 flex flex-col justify-center space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-200">
                      Selecionar Arquivo de Imagem da Empresa
                    </label>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Recomendamos imagem com fundo transparente (formato PNG) para obter a melhor qualidade visual nos relatórios e orçamentos.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <label
                      htmlFor="company-logo-input"
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-md transition hover:bg-cyan-400"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{companyLogo ? 'Trocar Logotipo da Empresa' : 'Carregar Logotipo da Empresa'}</span>
                      <input
                        id="company-logo-input"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {companyLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-900/50 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remover Logo</span>
                      </button>
                    )}

                    {companyLogo && !appLogo && (
                      <button
                        type="button"
                        onClick={() => setAppLogo(companyLogo)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-2.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-900/50"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Aplicar também como Logo do Programa</span>
                      </button>
                    )}
                  </div>

                  {logoError && (
                    <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{logoError}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* General Company Information */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-7">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-100">
                  Dados Institucionais & Contato
                </h3>
                <p className="text-xs text-zinc-400">
                  Dados impressos no cabeçalho e rodapé dos documentos técnicos
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Razão Social / Nome da Empresa */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Building className="h-3.5 w-3.5 text-cyan-400" />
                    Razão Social / Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: INDÚSTRIA METALÚRGICA VANGUARDA LTDA"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {/* CNPJ */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                    CNPJ / Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={companyCnpj}
                    onChange={(e) => setCompanyCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    Telefone / WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {/* E-mail */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Mail className="h-3.5 w-3.5 text-cyan-400" />
                    E-mail de Contato Comercial / Engenharia
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {/* Endereço */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Av. Industrial, 1500 - Distrito Industrial - Cidade/UF"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {/* Responsável Padrão */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    Responsável Técnico Padrão
                  </label>
                  <input
                    type="text"
                    value={defaultResponsible}
                    onChange={(e) => setDefaultResponsible(e.target.value)}
                    placeholder="Ex: Engenharia Mecânica / PCM"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                  />
                </div>

                {/* Símbolo da Moeda */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                    Símbolo da Moeda
                  </label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    placeholder="R$"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3">
              <button
                id="btn-save-company-info"
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-400"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Dados da Empresa</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB: Templates PDF & Excel */}
      {activeSubTab === 'templates' && (
        <div className="max-w-4xl space-y-6">
          <form onSubmit={handleSaveAllSettings} className="space-y-6">
            {/* 1. PDF TEMPLATE SELECTOR */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Template de Relatório PDF</h3>
                    <p className="text-xs text-zinc-400">
                      Escolha a estrutura visual e os blocos a incluir no documento PDF
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => generateSamplePDF(currentActiveSettings)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-900/50"
                  title="Baixa um PDF de demonstração com as configurações atuais"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Baixar PDF de Teste</span>
                </button>
              </div>

              {/* Template Choices Grid */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Moderno Industrial */}
                <div
                  onClick={() => setPdfTemplate('modern')}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    pdfTemplate === 'modern'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-zinc-100">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      <span>Moderno Industrial (Padrão)</span>
                    </div>
                    {pdfTemplate === 'modern' && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                    Barra superior sólida com logo da empresa, caixa de projeto com cantos arredondados, tabela zebra e resumo com assinaturas.
                  </p>
                </div>

                {/* Corporativo Executivo */}
                <div
                  onClick={() => setPdfTemplate('corporate')}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    pdfTemplate === 'corporate'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-zinc-100">
                      <Building className="h-4 w-4 text-blue-400" />
                      <span>Corporativo Executivo</span>
                    </div>
                    {pdfTemplate === 'corporate' && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                    Visual limpo em fundo branco, logotipo em destaque com dados fiscais, linha divisória elegante e tipografia formal.
                  </p>
                </div>

                {/* Oficina & Separação (PCP) */}
                <div
                  onClick={() => setPdfTemplate('workshop')}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    pdfTemplate === 'workshop'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-zinc-100">
                      <Wrench className="h-4 w-4 text-amber-400" />
                      <span>Oficina & Separação de Almoxarifado</span>
                    </div>
                    {pdfTemplate === 'workshop' && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                    Foco operacional com checkboxes <span className="font-mono text-cyan-300 font-bold">[ ]</span> para conferência física no almoxarifado, foco em pesos e quantidades.
                  </p>
                </div>

                {/* Proposta Comercial / Orçamento */}
                <div
                  onClick={() => setPdfTemplate('quote')}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    pdfTemplate === 'quote'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-zinc-100">
                      <Briefcase className="h-4 w-4 text-emerald-400" />
                      <span>Proposta Comercial & Orçamento</span>
                    </div>
                    {pdfTemplate === 'quote' && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                    Layout comercial com destaque para cliente, valores unitários, condições e espaço para aceite do comprador.
                  </p>
                </div>
              </div>

              {/* Theme Color Palette */}
              <div className="mt-6 border-t border-zinc-800/80 pt-4">
                <label className="mb-2 block text-xs font-semibold text-zinc-300">
                  Paleta de Cores do PDF
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {(
                    [
                      { id: 'navy', name: 'Azul Marinho / Slate', color: 'bg-slate-900 border-sky-500' },
                      { id: 'cyan', name: 'Ciano Industrial', color: 'bg-cyan-950 border-cyan-400' },
                      { id: 'emerald', name: 'Verde Esmeralda', color: 'bg-emerald-950 border-emerald-400' },
                      { id: 'slate', name: 'Cinza Grafite', color: 'bg-zinc-800 border-zinc-400' },
                      { id: 'crimson', name: 'Vinho Carmesim', color: 'bg-rose-950 border-rose-400' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPdfThemeColor(item.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                        pdfThemeColor === item.id
                          ? `${item.color} text-zinc-100 ring-2 ring-cyan-500/40`
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${item.color.split(' ')[0]}`} />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Toggles & Options */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-zinc-800/80 pt-4">
                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={pdfShowLogo}
                    onChange={(e) => setPdfShowLogo(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Exibir Logotipo da Empresa no Topo</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={pdfShowPrices}
                    onChange={(e) => setPdfShowPrices(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Exibir Colunas de Valores & Custos</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={pdfShowWeights}
                    onChange={(e) => setPdfShowWeights(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Exibir Colunas de Peso Unitário & Total</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={pdfShowSignatures}
                    onChange={(e) => setPdfShowSignatures(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Exibir Linhas de Assinatura no Rodapé</span>
                </label>
              </div>

              {/* PDF Footer Custom text */}
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Texto Personalizado do Rodapé do PDF
                </label>
                <input
                  type="text"
                  value={pdfFooterText}
                  onChange={(e) => setPdfFooterText(e.target.value)}
                  placeholder="Ex: Documento técnico emitido pelo Sistema de Gestão Industrial"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
                />
              </div>
            </div>

            {/* 2. EXCEL TEMPLATE SELECTOR */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Template de Planilha Excel (.xlsx)</h3>
                    <p className="text-xs text-zinc-400">
                      Configure a formatação e as colunas das planilhas geradas
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => generateSampleExcel(currentActiveSettings)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-900/50"
                  title="Baixa uma planilha de demonstração com as configurações atuais"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Baixar Excel de Teste</span>
                </button>
              </div>

              {/* Excel Choices Grid */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Completa */}
                <div
                  onClick={() => setExcelTemplate('complete')}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    excelTemplate === 'complete'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-100">Tabela Industrial Completa</span>
                    {excelTemplate === 'complete' && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                    Cabeçalho da empresa, metadados da máquina/cliente, todas as colunas de material, peso, custos e resumo.
                  </p>
                </div>

                {/* Engenharia & PCP */}
                <div
                  onClick={() => setExcelTemplate('engineering')}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    excelTemplate === 'engineering'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-100">Engenharia & PCP</span>
                    {excelTemplate === 'engineering' && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                    Foco técnico em especificações de projeto, tolerâncias, códigos e balanço de massa/peso total.
                  </p>
                </div>

                {/* Compras & Suprimentos */}
                <div
                  onClick={() => setExcelTemplate('procurement')}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    excelTemplate === 'procurement'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-100">Compras & Cotações</span>
                    {excelTemplate === 'procurement' && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                    Foco em aquisição com colunas de fornecedor cotado, prazos de entrega e controle de status de compra.
                  </p>
                </div>
              </div>

              {/* Excel Toggles */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-zinc-800/80 pt-4">
                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={excelIncludeHeader}
                    onChange={(e) => setExcelIncludeHeader(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Incluir Cabeçalho Institucional da Empresa</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={excelIncludeSummary}
                    onChange={(e) => setExcelIncludeSummary(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Incluir Bloco de Resumo e Totais</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={excelShowPrices}
                    onChange={(e) => setExcelShowPrices(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Exibir Colunas de Preços & Valores</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 p-3 text-xs text-zinc-300 cursor-pointer hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={excelShowWeights}
                    onChange={(e) => setExcelShowWeights(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0"
                  />
                  <span>Exibir Colunas de Peso (kg)</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3">
              <button
                id="btn-save-templates"
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-400"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Configurações de Templates</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 1: Dynamic Groups & Units */}
      {activeSubTab === 'parameters' && (
        <div className="space-y-6">
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
                      {settings.groups.length} grupos cadastrados
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Group Form */}
              <form onSubmit={handleAddGroupSubmit} className="mt-4 flex gap-2">
                <input
                  id="input-new-group"
                  type="text"
                  value={newGroupInput}
                  onChange={(e) => setNewGroupInput(e.target.value)}
                  placeholder="Novo grupo (ex: FERRAMENTAS)"
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
                />
                <button
                  id="btn-add-group"
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* List of Groups */}
              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {settings.groups.map((group) => {
                  const count = groupCounts[group] || 0;
                  const prefix = getGroupPrefix(group);
                  return (
                    <div
                      key={group}
                      className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 text-xs text-zinc-200 transition hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group}</span>
                        <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                          {prefix}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                          {count} {count === 1 ? 'item' : 'itens'}
                        </span>
                        {settings.groups.length > 1 && (
                          <button
                            onClick={() => onDeleteGroup(group)}
                            title="Remover Grupo"
                            className="rounded-lg p-1 text-zinc-500 transition hover:bg-red-950/40 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unidades de Medida */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Ruler className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Unidades de Medida</h3>
                    <p className="text-[11px] text-zinc-400">
                      {settings.units.length} unidades cadastradas
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Unit Form */}
              <form onSubmit={handleAddUnitSubmit} className="mt-4 flex gap-2">
                <input
                  id="input-new-unit"
                  type="text"
                  value={newUnitInput}
                  onChange={(e) => setNewUnitInput(e.target.value)}
                  placeholder="Nova unidade (ex: CX, RL, CJ, PAR)"
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
                />
                <button
                  id="btn-add-unit"
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* List of Units */}
              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {settings.units.map((unit) => (
                  <div
                    key={unit}
                    className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 text-xs text-zinc-200 transition hover:bg-zinc-900"
                  >
                    <span className="font-mono font-semibold text-zinc-200">{unit}</span>
                    {settings.units.length > 1 && (
                      <button
                        onClick={() => onDeleteUnit(unit)}
                        title="Remover Unidade"
                        className="rounded-lg p-1 text-zinc-500 transition hover:bg-red-950/40 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Code Generation & Sequence Standardization */}
      {activeSubTab === 'codes' && (
        <div className="space-y-6">
          {/* Main Action Card */}
          <div className="rounded-2xl border border-cyan-500/30 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
                      Padronização & Sequenciamento de Códigos
                    </h2>
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                      5 LETRAS + 4 DÍGITOS
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Regra oficial do sistema: todo material possui um código único formado pela abreviação de 5 letras do seu grupo mais 4 números sequenciais em ordem alfabética (ex: <span className="font-mono text-cyan-300 font-bold">PERFI0001</span>, <span className="font-mono text-cyan-300 font-bold">INSUM0001</span>, <span className="font-mono text-cyan-300 font-bold">MOTOR0001</span>).
                  </p>
                </div>
              </div>

              {/* Refazer Todos os Codigos Button */}
              <button
                id="btn-trigger-regenerate-codes"
                onClick={() => setIsRegenerateModalOpen(true)}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-400"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refazer Todos os Códigos</span>
              </button>
            </div>
          </div>

          {/* Group Codes Live Matrix */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Matriz de Prefixos por Grupo & Próximos Códigos
                </h3>
                <p className="text-xs text-zinc-400">
                  Abreviações calculadas para os grupos e o próximo código a ser gerado para novos materiais
                </p>
              </div>
              <span className="text-xs text-zinc-400">
                Total de Itens: <strong className="text-zinc-200">{catalog.length}</strong>
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="pb-3 pl-2">Grupo / Categoria</th>
                    <th className="pb-3">Prefixo (5 Letras)</th>
                    <th className="pb-3">Exemplo de Código</th>
                    <th className="pb-3 text-center">Itens Cadastrados</th>
                    <th className="pb-3 pr-2 text-right">Próximo Código na Sequência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 font-medium text-zinc-300">
                  {settings.groups.map((grp) => {
                    const prefix = getGroupPrefix(grp);
                    const count = groupCounts[grp] || 0;
                    const itemsInGroup = catalog.filter((i) => (i.group || '').trim().toUpperCase() === grp.trim().toUpperCase());
                    const usedNumbers = new Set<number>();
                    itemsInGroup.forEach((item) => {
                      if (item.code && item.code.startsWith(prefix)) {
                        const numPart = parseInt(item.code.substring(5), 10);
                        if (!isNaN(numPart)) usedNumbers.add(numPart);
                      }
                    });
                    let nextNum = 1;
                    while (usedNumbers.has(nextNum)) nextNum++;
                    const nextCode = `${prefix}${String(nextNum).padStart(4, '0')}`;

                    return (
                      <tr key={grp} className="transition hover:bg-zinc-900/50">
                        <td className="py-3 pl-2 font-bold text-zinc-100">{grp}</td>
                        <td className="py-3">
                          <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-400">
                            {prefix}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-zinc-400">{prefix}0001</td>
                        <td className="py-3 text-center">
                          <span className="rounded-md bg-zinc-850 px-2 py-0.5 text-xs text-zinc-300 font-mono">
                            {count}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <span className="rounded bg-emerald-950/80 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300 border border-emerald-500/20">
                            {nextCode}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: WhatsApp Template */}
      {activeSubTab === 'whatsapp' && (
        <div className="max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
          <form onSubmit={handleSaveAllSettings} className="space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100">
                Modelo de Mensagem para WhatsApp
              </h3>
              <p className="text-xs text-zinc-400">
                Personalize o texto automático gerado ao clicar em compartilhar via WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Variáveis disponíveis para substituição automática:
              </label>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-cyan-300">
                {[
                  '{empresa}',
                  '{nome_lista}',
                  '{maquina}',
                  '{cliente}',
                  '{responsavel}',
                  '{data}',
                  '{status}',
                  '{total_itens}',
                  '{itens}',
                  '{resumo_financeiro}',
                  '{observacoes}',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-zinc-900 px-2 py-0.5 border border-zinc-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={whatsAppTemplate}
                onChange={(e) => setWhatsAppTemplate(e.target.value)}
                rows={12}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 font-mono text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg transition hover:bg-cyan-400"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Template WhatsApp</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB: Backup & Database */}
      {activeSubTab === 'backup' && (
        <div className="max-w-3xl space-y-6">
          {/* Backup Box */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100">
                Backup Completo do Sistema (JSON)
              </h3>
              <p className="text-xs text-zinc-400">
                Exporte ou restaure todo o catálogo de materiais, listas criadas e configurações
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                id="btn-export-backup"
                onClick={onExportBackup}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg transition hover:bg-cyan-400"
              >
                <Download className="h-4 w-4" />
                <span>Exportar Backup Completo</span>
              </button>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800">
                <Upload className="h-4 w-4" />
                <span>Restaurar Backup (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div
                className={`mt-4 rounded-xl p-3 text-xs font-medium ${
                  importStatus.includes('Erro')
                    ? 'border border-red-500/30 bg-red-950/40 text-red-300'
                    : 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                }`}
              >
                {importStatus}
              </div>
            )}
          </div>

          {/* Reset Box */}
          <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-6 sm:p-8">
            <h3 className="text-base font-bold text-red-400">Zona de Perigo / Restauração</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Restaura todo o catálogo com os 60+ materiais e insumos industriais padrão. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4">
              <button
                id="btn-reset-default-catalog"
                onClick={() => {
                  if (
                    window.confirm(
                      'Tem certeza que deseja restaurar o catálogo para o padrão de fábrica? Itens personalizados serão substituídos.'
                    )
                  ) {
                    onResetCatalog();
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restaurar Catálogo Padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Regeneration Confirmation Modal */}
      {isRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Refazer & Reordenar Todos os Códigos?
                </h3>
                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                  Esta ação irá reordenar todos os <strong className="text-zinc-200">{catalog.length}</strong> materiais do catálogo em ordem alfabética dentro de cada grupo e atribuirá códigos contínuos no padrão oficial <span className="font-mono text-cyan-300 font-bold">[5 Letras + 0001, 0002...]</span>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setIsRegenerateModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteRegenerateCodes}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-cyan-400 shadow-md"
              >
                <Check className="h-4 w-4" />
                <span>Sim, Refazer Todos os Códigos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
