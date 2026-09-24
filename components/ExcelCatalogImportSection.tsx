'use client';

import React, { useState, useRef } from 'react';
import { CatalogItem, AppSettings } from '@/lib/types';
import {
  parseExcelCatalogFile,
  processCatalogImport,
  downloadCatalogImportTemplate,
  ParsedExcelItem,
  ExcelParseResult,
  CatalogImportMode,
} from '@/lib/excelCatalogUtils';
import { formatCurrency } from '@/lib/exportUtils';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Layers,
  ArrowRight,
  Database,
  Trash2,
  Check,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface ExcelCatalogImportSectionProps {
  catalog: CatalogItem[];
  settings: AppSettings;
  onSaveCatalog: (newCatalog: CatalogItem[]) => void;
  onSaveSettings: (newSettings: AppSettings) => void;
  onNavigateToCatalog?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const ExcelCatalogImportSection: React.FC<ExcelCatalogImportSectionProps> = ({
  catalog,
  settings,
  onSaveCatalog,
  onSaveSettings,
  onNavigateToCatalog,
  isModal = false,
  onCloseModal,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [importMode, setImportMode] = useState<CatalogImportMode>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{
    added: number;
    updated: number;
    total: number;
    newGroupsCount: number;
    newUnitsCount: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setParseResult(null);
    setImportSuccess(null);

    try {
      const result = await parseExcelCatalogFile(file);
      setParseResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao analisar arquivo';
      setParseResult({
        success: false,
        items: [],
        totalRowsFound: 0,
        validCount: 0,
        invalidCount: 0,
        detectedGroups: [],
        detectedUnits: [],
        sheetName: '',
        headersDetected: [],
        error: message,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleExecuteImport = () => {
    if (!parseResult || !parseResult.success || parseResult.items.length === 0) return;

    setIsImporting(true);

    try {
      // 1. Process items with current catalog and selected mode
      const { updatedCatalog, addedCount, updatedCount, totalCount } = processCatalogImport(
        catalog,
        parseResult.items,
        importMode
      );

      // 2. Identify new groups and units to register in AppSettings
      const existingGroupsSet = new Set((settings.groups || []).map((g) => g.trim().toUpperCase()));
      const existingUnitsSet = new Set((settings.units || []).map((u) => u.trim().toUpperCase()));

      const newGroupsToAdd: string[] = [];
      parseResult.detectedGroups.forEach((g) => {
        const clean = g.trim().toUpperCase();
        if (clean && !existingGroupsSet.has(clean)) {
          newGroupsToAdd.push(clean);
          existingGroupsSet.add(clean);
        }
      });

      const newUnitsToAdd: string[] = [];
      parseResult.detectedUnits.forEach((u) => {
        const clean = u.trim().toUpperCase();
        if (clean && !existingUnitsSet.has(clean)) {
          newUnitsToAdd.push(clean);
          existingUnitsSet.add(clean);
        }
      });

      // Update settings if new groups or units were discovered
      if (newGroupsToAdd.length > 0 || newUnitsToAdd.length > 0) {
        const updatedSettings: AppSettings = {
          ...settings,
          groups: [...(settings.groups || []), ...newGroupsToAdd],
          units: [...(settings.units || []), ...newUnitsToAdd],
        };
        onSaveSettings(updatedSettings);
      }

      // 3. Save new catalog
      onSaveCatalog(updatedCatalog);

      // 4. Update success status
      setImportSuccess({
        added: addedCount,
        updated: updatedCount,
        total: totalCount,
        newGroupsCount: newGroupsToAdd.length,
        newUnitsCount: newUnitsToAdd.length,
      });

      setParseResult(null);
      setSelectedFile(null);
    } catch (err: unknown) {
      console.error('Error executing import:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setImportSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100">
                  Importar Planilha Excel para o Catálogo Geral
                </h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  .xlsx / .xls / .csv
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Alimente ou atualize a base de dados de materiais e insumos industriais através de uma planilha Excel em segundos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadCatalogImportTemplate(settings)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900/50 shadow-sm shrink-0"
            title="Baixa uma planilha Excel com as colunas certas e exemplos reais"
          >
            <Download className="h-4 w-4" />
            <span>Baixar Planilha Modelo (.xlsx)</span>
          </button>
        </div>

        {/* SUCCESS CARD */}
        {importSuccess && (
          <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-950/60">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="text-base font-bold text-emerald-200">
                  Importação Concluída com Êxito!
                </h4>
                <p className="text-xs text-emerald-300/90 leading-relaxed">
                  Os materiais da sua planilha foram processados e integrados ao Catálogo Geral de Materiais e Insumos.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/20 p-3 text-center">
                    <span className="block font-mono text-xl font-black text-emerald-400">
                      +{importSuccess.added}
                    </span>
                    <span className="text-[11px] text-zinc-400">Novos Cadastrados</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/20 p-3 text-center">
                    <span className="block font-mono text-xl font-black text-cyan-400">
                      {importSuccess.updated}
                    </span>
                    <span className="text-[11px] text-zinc-400">Itens Atualizados</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/20 p-3 text-center">
                    <span className="block font-mono text-xl font-black text-zinc-100">
                      {importSuccess.total}
                    </span>
                    <span className="text-[11px] text-zinc-400">Total no Catálogo</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/20 p-3 text-center">
                    <span className="block font-mono text-xl font-black text-amber-400">
                      +{importSuccess.newGroupsCount}
                    </span>
                    <span className="text-[11px] text-zinc-400">Novos Grupos Criados</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  {onNavigateToCatalog && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToCatalog();
                        if (onCloseModal) onCloseModal();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md transition hover:bg-emerald-400"
                    >
                      <span>Abrir Catálogo de Materiais</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Importar Outra Planilha</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD DROP ZONE */}
        {!importSuccess && !parseResult && (
          <div className="mt-5 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-950/20 ring-4 ring-emerald-500/20'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-emerald-500/50 hover:bg-zinc-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 shadow-inner">
                {isParsing ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <Upload className="h-7 w-7" />
                )}
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-sm font-bold text-zinc-200">
                  {isParsing
                    ? 'Lendo e identificando colunas da planilha...'
                    : 'Clique para selecionar ou arraste sua planilha Excel aqui'}
                </p>
                <p className="text-xs text-zinc-400">
                  Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou CSV
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-md bg-zinc-850 px-2.5 py-1 font-mono text-[10px] text-zinc-300 border border-zinc-750">
                  Auto-detecção de Cabeçalhos
                </span>
                <span className="rounded-md bg-zinc-850 px-2.5 py-1 font-mono text-[10px] text-zinc-300 border border-zinc-750">
                  Gera Códigos Automáticos se Vazios
                </span>
                <span className="rounded-md bg-zinc-850 px-2.5 py-1 font-mono text-[10px] text-zinc-300 border border-zinc-750">
                  Cadastra Novos Grupos
                </span>
              </div>
            </div>

            {/* QUICK INSTRUCTIONS */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
              <h5 className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                <span>Como funciona a importação inteligente do catálogo:</span>
              </h5>
              <ul className="mt-2 space-y-1.5 text-[11px] text-zinc-400 leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-zinc-200">Coluna Obrigatória:</strong> Apenas a descrição do material (ex: &quot;PARAFUSO M10&quot;, &quot;ROLAMENTO 6205&quot;).
                </li>
                <li>
                  <strong className="text-zinc-200">Coluna de Código:</strong> É opcional! Se você não preencher na planilha, o sistema gera o código oficial sequencial com 5 letras do grupo + 4 dígitos (ex: <code className="text-cyan-300">PARAF0001</code>).
                </li>
                <li>
                  <strong className="text-zinc-200">Novos Grupos e Unidades:</strong> Grupos novos na planilha são cadastrados automaticamente na aba &quot;Grupos & Unidades&quot;.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* PARSED PREVIEW & IMPORT CONFIRMATION */}
        {parseResult && (
          <div className="mt-6 space-y-5 animate-in fade-in duration-200">
            {/* FILE STATUS BADGE */}
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">
                      {selectedFile?.name || 'Arquivo Carregado'}
                    </span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                      Aba: {parseResult.sheetName}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Encontrados <strong className="text-emerald-400">{parseResult.validCount}</strong> materiais válidos para importação
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-zinc-800 bg-zinc-850 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white"
              >
                <Trash2 className="h-3 w-3" />
                <span>Trocar arquivo</span>
              </button>
            </div>

            {parseResult.error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Não foi possível importar a planilha</strong>
                  <p className="mt-0.5 text-[11px] text-red-400">{parseResult.error}</p>
                </div>
              </div>
            )}

            {parseResult.success && parseResult.items.length > 0 && (
              <>
                {/* MODE SELECTION */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                  <label className="block text-xs font-bold text-zinc-200">
                    Selecione a Ação de Importação:
                  </label>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <label
                      className={`flex cursor-pointer flex-col rounded-xl border p-3 transition ${
                        importMode === 'merge'
                          ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="accent-cyan-500"
                        />
                        <span className="text-xs font-bold text-zinc-100">
                          Mesclar & Atualizar
                        </span>
                      </div>
                      <p className="mt-1 pl-5 text-[11px] text-zinc-400 leading-tight">
                        Atualiza custos e pesos de itens existentes e cadastra os novos (Recomendado).
                      </p>
                    </label>

                    <label
                      className={`flex cursor-pointer flex-col rounded-xl border p-3 transition ${
                        importMode === 'append'
                          ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="accent-cyan-500"
                        />
                        <span className="text-xs font-bold text-zinc-100">
                          Apenas Adicionar Novos
                        </span>
                      </div>
                      <p className="mt-1 pl-5 text-[11px] text-zinc-400 leading-tight">
                        Mantém o catálogo atual inalterado e cadastra somente itens inéditos.
                      </p>
                    </label>

                    <label
                      className={`flex cursor-pointer flex-col rounded-xl border p-3 transition ${
                        importMode === 'replace'
                          ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-red-500"
                        />
                        <span className="text-xs font-bold text-red-300">
                          Substituir Catálogo
                        </span>
                      </div>
                      <p className="mt-1 pl-5 text-[11px] text-zinc-400 leading-tight">
                        Substitui completamente todo o catálogo atual pelos itens da planilha.
                      </p>
                    </label>
                  </div>

                  {/* DETECTED GROUPS PREVIEW */}
                  {parseResult.detectedGroups.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80">
                      <span className="text-[11px] font-semibold text-zinc-400">
                        Grupos identificados na planilha ({parseResult.detectedGroups.length}):
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {parseResult.detectedGroups.map((grp) => {
                          const isNew = !settings.groups?.some(
                            (g) => g.trim().toUpperCase() === grp.trim().toUpperCase()
                          );
                          return (
                            <span
                              key={grp}
                              className={`rounded px-2 py-0.5 text-[10px] font-medium border ${
                                isNew
                                  ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                                  : 'border-zinc-800 bg-zinc-900 text-zinc-300'
                              }`}
                            >
                              {grp} {isNew && '(Novo)'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* PREVIEW TABLE */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <span className="text-xs font-bold text-zinc-200">
                      Pré-visualização dos Materiais (Primeiros {Math.min(8, parseResult.items.length)} de {parseResult.items.length})
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      Total: {parseResult.items.length} itens
                    </span>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-400">
                          <th className="pb-2 pl-2">Código</th>
                          <th className="pb-2">Descrição do Material</th>
                          <th className="pb-2">Grupo</th>
                          <th className="pb-2">Unid.</th>
                          <th className="pb-2 text-right">Custo Base</th>
                          <th className="pb-2 text-right pr-2">Peso (kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850/60 font-medium text-zinc-300">
                        {parseResult.items.slice(0, 8).map((it, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/50">
                            <td className="py-2.5 pl-2 font-mono text-[11px]">
                              {it.code ? (
                                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">
                                  {it.code}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-400 italic">
                                  (Auto-gerar)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 font-bold text-zinc-100 max-w-[280px] truncate">
                              {it.description}
                            </td>
                            <td className="py-2.5">
                              <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-300 border border-zinc-800">
                                {it.group}
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-zinc-400">{it.unit}</td>
                            <td className="py-2.5 text-right font-mono text-emerald-400">
                              {formatCurrency(it.cost, settings.currencySymbol)}
                            </td>
                            <td className="py-2.5 text-right pr-2 font-mono text-zinc-400">
                              {it.weightBar ? `${it.weightBar.toFixed(2)} kg` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parseResult.items.length > 8 && (
                    <p className="mt-3 text-center text-[11px] text-zinc-500 italic">
                      + {parseResult.items.length - 8} outros materiais prontos na planilha...
                    </p>
                  )}
                </div>

                {/* ACTION CONFIRMATION */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-950/60 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>
                      {isImporting
                        ? 'Processando Importação...'
                        : `Confirmar Importação de ${parseResult.items.length} Materiais`}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
