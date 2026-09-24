import * as XLSX from 'xlsx';
import { CatalogItem, AppSettings } from './types';
import { getGroupPrefix, getNextCodeForGroup } from './codeUtils';

export interface ParsedExcelItem {
  code: string;
  description: string;
  group: string;
  unit: string;
  cost: number;
  weightBar: number;
  notes?: string;
  isExistingMatch?: boolean;
}

export interface ExcelParseResult {
  success: boolean;
  items: ParsedExcelItem[];
  totalRowsFound: number;
  validCount: number;
  invalidCount: number;
  detectedGroups: string[];
  detectedUnits: string[];
  sheetName: string;
  headersDetected: string[];
  error?: string;
}

export type CatalogImportMode = 'merge' | 'append' | 'replace';

/**
 * Cleans and converts any value (string, number, localized currency) to a valid number.
 * Handles: "1.250,50", "1250,50", "1250.50", "R$ 45,00", etc.
 */
export function parseNumericCell(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.max(0, val);
  }
  if (!val) return 0;
  const str = String(val)
    .trim()
    .replace(/[R$\s]/g, '');

  if (!str) return 0;

  // If format is like "1.234,56"
  if (str.includes(',') && str.includes('.')) {
    const clean = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
  // If format is like "1234,56"
  if (str.includes(',')) {
    const clean = str.replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
  // Normal float like "1234.56"
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Generates and downloads a clean, professional sample Excel spreadsheet
 * specifically formatted for importing into the General Catalog of Materials & Supplies.
 */
export function downloadCatalogImportTemplate(settings?: AppSettings): void {
  const wb = XLSX.utils.book_new();

  const currency = settings?.currencySymbol || 'R$';

  const headers = [
    'CÓDIGO',
    'DESCRIÇÃO DO MATERIAL / INSUMO',
    'GRUPO / CATEGORIA',
    'UNIDADE',
    `CUSTO BASE (${currency})`,
    'PESO REF. (KG)',
    'OBSERVAÇÕES TÉCNICAS',
  ];

  const sampleRows = [
    [
      'CORRE0001',
      'CORRENTE DE TRANSMISSÃO ASA 40-1 PASSO 1/2" SIMPLES EM AÇO',
      'CORRENTES & TRANSMISSÃO',
      'M',
      68.5,
      0.65,
      'Carga de ruptura 14.5kN, aço carbono temperado',
    ],
    [
      'PARAF0001',
      'PARAFUSO SEXTAVADO M10 X 40 MM GRAU 8.8 ZINCADO BRANCO',
      'PARAFUSOS & FIXADORES',
      'CENTO',
      42.9,
      1.8,
      'Rosca métrica padrão MA passo 1.5mm DIN 933',
    ],
    [
      'ROLAM0001',
      'ROLAMENTO RÍGIDO DE ESFERAS 6205 DDU BLINDAGEM DUPLA',
      'ROLAMENTOS & MANCAIS',
      'PÇ',
      34.2,
      0.13,
      'Folga C3, lubrificação permanente com graxa Polyrex',
    ],
    [
      'TUBOS0001',
      'TUBO INDUSTRIAL REDONDO DE AÇO CARBONO Ø 2" X 2,00 MM',
      'TUBOS & PERFIS',
      'BARRA',
      128.0,
      14.6,
      'Barra comercial com 6 metros, norma NBR 6591',
    ],
    [
      'CHAPA0001',
      'CHAPA DE AÇO CARBONO SAE 1020 ESPESSURA 3/16" (4,75 MM)',
      'AÇOS & CHAPAS',
      'KG',
      7.85,
      37.2,
      'Chapa laminada a quente para caldeiraria e corte a plasma',
    ],
    [
      'PNEUM0001',
      'CILINDRO PNEUMÁTICO ISO 15552 Ø 50 MM CURSO 100 MM DUPLA AÇÃO',
      'PNEUMÁTICA',
      'PÇ',
      295.0,
      1.45,
      'Com amortecimento ajustável e êmbolo magnético',
    ],
    [
      '', // Deixado em branco de propósito para demonstrar auto-geração de código
      'GRAXA INDUSTRIAL AZUL DE LÍTIO EP-2 PARA ALTA TEMPERATURA',
      'LUBRIFICANTES',
      'BALDE',
      380.0,
      18.0,
      'Balde de 18kg, com aditivo extrema pressão (Código será auto-gerado se vazio)',
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 16 }, // CÓDIGO
    { wch: 55 }, // DESCRIÇÃO
    { wch: 30 }, // GRUPO
    { wch: 12 }, // UNIDADE
    { wch: 18 }, // CUSTO BASE
    { wch: 16 }, // PESO
    { wch: 45 }, // OBSERVAÇÕES
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Catalogo_Materiais');

  // Second help/instructions tab
  const wsInstData = [
    ['INSTRUÇÕES PARA PREENCHIMENTO DA PLANILHA DE IMPORTAÇÃO'],
    [''],
    ['Coluna', 'Obrigatório?', 'Regras e Recomendações'],
    [
      'CÓDIGO',
      'Opcional',
      'Pode deixar em branco! O sistema criará automaticamente códigos padronizados (ex: PARAF0001) baseado no grupo.',
    ],
    [
      'DESCRIÇÃO',
      'OBRIGATÓRIO',
      'Nome completo e especificações do material ou insumo industrial.',
    ],
    [
      'GRUPO / CATEGORIA',
      'Recomendado',
      'Ex: PARAFUSOS & FIXADORES, ROLAMENTOS, TUBOS. Se o grupo não existir no sistema, ele será cadastrado automaticamente!',
    ],
    [
      'UNIDADE',
      'Recomendado',
      'Ex: PÇ, M, KG, BARRA, UN, CENTO, BALDE, L, CJ. Se não informado, usará "PÇ".',
    ],
    [
      'CUSTO BASE',
      'Opcional',
      'Valor unitário de referência (ex: 45.50 ou 45,50). Pode conter símbolo monetário ou apenas números.',
    ],
    [
      'PESO REF. (KG)',
      'Opcional',
      'Massa unitária ou por barra/peça em quilogramas (ex: 1.25 ou 1,25).',
    ],
    [
      'OBSERVAÇÕES',
      'Opcional',
      'Informações técnicas adicionais, norma, fornecedor preferencial ou tolerância.',
    ],
  ];

  const wsInst = XLSX.utils.aoa_to_sheet(wsInstData);
  wsInst['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucoes');

  XLSX.writeFile(wb, 'Modelo_Importacao_Catalogo_Materiais.xlsx');
}

/**
 * Parses an uploaded Excel (.xlsx, .xls, .csv) file into an array of catalog items.
 * Intelligently scans multiple rows to locate headers and maps variations of column titles.
 */
export async function parseExcelCatalogFile(file: File): Promise<ExcelParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        items: [],
        totalRowsFound: 0,
        validCount: 0,
        invalidCount: 0,
        detectedGroups: [],
        detectedUnits: [],
        sheetName: '',
        headersDetected: [],
        error: 'A planilha selecionada está vazia ou não contém abas válidas.',
      };
    }

    // Select the best sheet (first sheet or one named with catalog keywords)
    let selectedSheetName = wb.SheetNames[0];
    const candidateSheet = wb.SheetNames.find((name) =>
      /cat[aá]logo|mater|insumo|item|dados|base|estoque/i.test(name)
    );
    if (candidateSheet) {
      selectedSheetName = candidateSheet;
    }

    const ws = wb.Sheets[selectedSheetName];
    if (!ws) {
      return {
        success: false,
        items: [],
        totalRowsFound: 0,
        validCount: 0,
        invalidCount: 0,
        detectedGroups: [],
        detectedUnits: [],
        sheetName: selectedSheetName,
        headersDetected: [],
        error: 'Não foi possível ler a aba da planilha.',
      };
    }

    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    });

    if (rawRows.length === 0) {
      return {
        success: false,
        items: [],
        totalRowsFound: 0,
        validCount: 0,
        invalidCount: 0,
        detectedGroups: [],
        detectedUnits: [],
        sheetName: selectedSheetName,
        headersDetected: [],
        error: 'A aba da planilha não contém linhas de dados.',
      };
    }

    // Search within the first 12 rows for the actual header row
    let headerRowIndex = -1;
    let colMap: {
      code: number;
      desc: number;
      group: number;
      unit: number;
      cost: number;
      weight: number;
      notes: number;
    } = {
      code: -1,
      desc: -1,
      group: -1,
      unit: -1,
      cost: -1,
      weight: -1,
      notes: -1,
    };

    const normalizeHeader = (val: unknown) =>
      String(val || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    for (let r = 0; r < Math.min(12, rawRows.length); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const normRow = row.map(normalizeHeader);

      let foundDesc = -1;
      let foundCode = -1;
      let foundGroup = -1;
      let foundUnit = -1;
      let foundCost = -1;
      let foundWeight = -1;
      let foundNotes = -1;

      normRow.forEach((cell, cIdx) => {
        if (!cell) return;

        // Description
        if (
          foundDesc === -1 &&
          (cell.includes('descri') ||
            cell.includes('material') ||
            cell.includes('insumo') ||
            cell.includes('produto') ||
            cell.includes('item desc') ||
            cell.includes('especifica') ||
            cell === 'nome' ||
            cell === 'description')
        ) {
          foundDesc = cIdx;
        }

        // Code
        if (
          foundCode === -1 &&
          (cell.includes('codig') ||
            cell === 'cod' ||
            cell === 'cod.' ||
            cell === 'cód' ||
            cell === 'cód.' ||
            cell === 'codigo' ||
            cell === 'ref' ||
            cell === 'referencia' ||
            cell === 'part number' ||
            cell === 'sku' ||
            cell === 'code')
        ) {
          foundCode = cIdx;
        }

        // Group / Category
        if (
          foundGroup === -1 &&
          (cell.includes('grup') ||
            cell.includes('categ') ||
            cell.includes('famil') ||
            cell.includes('tipo') ||
            cell.includes('classe') ||
            cell === 'group' ||
            cell === 'category')
        ) {
          foundGroup = cIdx;
        }

        // Unit
        if (
          foundUnit === -1 &&
          (cell.includes('unid') ||
            cell === 'un' ||
            cell === 'und' ||
            cell === 'medida' ||
            cell === 'uom' ||
            cell === 'unit')
        ) {
          foundUnit = cIdx;
        }

        // Cost / Price
        if (
          foundCost === -1 &&
          (cell.includes('custo') ||
            cell.includes('preco') ||
            cell.includes('preço') ||
            cell.includes('valor') ||
            cell.includes('price') ||
            cell.includes('cost') ||
            cell.includes('vlr'))
        ) {
          foundCost = cIdx;
        }

        // Weight
        if (
          foundWeight === -1 &&
          (cell.includes('peso') ||
            cell.includes('weight') ||
            cell.includes('kg') ||
            cell.includes('massa'))
        ) {
          foundWeight = cIdx;
        }

        // Notes
        if (
          foundNotes === -1 &&
          (cell.includes('obs') ||
            cell.includes('nota') ||
            cell.includes('detalhe') ||
            cell.includes('comentario') ||
            cell.includes('aplicacao') ||
            cell.includes('note'))
        ) {
          foundNotes = cIdx;
        }
      });

      // A valid header row MUST at least have a description or a code
      if (foundDesc !== -1 || (foundCode !== -1 && row.length >= 2)) {
        headerRowIndex = r;
        colMap = {
          code: foundCode,
          desc: foundDesc,
          group: foundGroup,
          unit: foundUnit,
          cost: foundCost,
          weight: foundWeight,
          notes: foundNotes,
        };
        break;
      }
    }

    // Fallback if no named headers were identified: assume first row or standard columns
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      colMap = {
        code: 0,
        desc: 1,
        group: 2,
        unit: 3,
        cost: 4,
        weight: 5,
        notes: 6,
      };
    } else if (colMap.desc === -1) {
      // If code was found but not explicit desc, try the next column as desc
      colMap.desc = colMap.code === 0 ? 1 : 0;
    }

    const headersDetected: string[] = [];
    const headerRow = rawRows[headerRowIndex] || [];
    if (Array.isArray(headerRow)) {
      headerRow.forEach((c) => {
        if (c !== undefined && c !== null && String(c).trim()) {
          headersDetected.push(String(c).trim());
        }
      });
    }

    const items: ParsedExcelItem[] = [];
    const detectedGroups = new Set<string>();
    const detectedUnits = new Set<string>();
    let invalidCount = 0;

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const getCellVal = (idx: number) => (idx >= 0 && idx < row.length ? row[idx] : '');

      const rawDesc = String(getCellVal(colMap.desc) || '').trim();
      const rawCode = String(getCellVal(colMap.code) || '').trim();
      const rawGroup = String(getCellVal(colMap.group) || '').trim();
      const rawUnit = String(getCellVal(colMap.unit) || '').trim();
      const rawNotes = String(getCellVal(colMap.notes) || '').trim();
      const costVal = parseNumericCell(getCellVal(colMap.cost));
      const weightVal = parseNumericCell(getCellVal(colMap.weight));

      // Skip empty or comment rows
      if (!rawDesc && !rawCode) {
        continue;
      }

      // If desc is too short or looks like a title row
      if (!rawDesc && rawCode) {
        // Use code as description fallback
        continue;
      }

      const cleanDesc = rawDesc.toUpperCase();
      const cleanCode = rawCode.toUpperCase();
      const cleanGroup = (rawGroup || 'INSUMOS GERAIS').toUpperCase();
      const cleanUnit = (rawUnit || 'PÇ').toUpperCase();

      if (cleanGroup) detectedGroups.add(cleanGroup);
      if (cleanUnit) detectedUnits.add(cleanUnit);

      items.push({
        code: cleanCode,
        description: cleanDesc,
        group: cleanGroup,
        unit: cleanUnit,
        cost: costVal,
        weightBar: weightVal,
        notes: rawNotes,
      });
    }

    return {
      success: items.length > 0,
      items,
      totalRowsFound: rawRows.length - (headerRowIndex + 1),
      validCount: items.length,
      invalidCount,
      detectedGroups: Array.from(detectedGroups),
      detectedUnits: Array.from(detectedUnits),
      sheetName: selectedSheetName,
      headersDetected,
      error:
        items.length === 0
          ? 'Nenhum material válido foi encontrado na planilha. Verifique se a coluna de Descrição contém dados.'
          : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar arquivo Excel.';
    return {
      success: false,
      items: [],
      totalRowsFound: 0,
      validCount: 0,
      invalidCount: 0,
      detectedGroups: [],
      detectedUnits: [],
      sheetName: '',
      headersDetected: [],
      error: `Falha na leitura do Excel: ${message}`,
    };
  }
}

/**
 * Merges parsed Excel items with the existing catalog based on the selected mode:
 * - 'merge': Updates existing items (by code or description), adds new ones with auto-assigned codes if needed.
 * - 'append': Only adds items that do not exist yet.
 * - 'replace': Completely replaces the catalog with the imported items.
 */
export function processCatalogImport(
  existingCatalog: CatalogItem[],
  importedItems: ParsedExcelItem[],
  mode: CatalogImportMode
): {
  updatedCatalog: CatalogItem[];
  addedCount: number;
  updatedCount: number;
  totalCount: number;
} {
  let addedCount = 0;
  let updatedCount = 0;

  if (mode === 'replace') {
    // Replaces entire catalog
    const newCatalog: CatalogItem[] = [];
    const usedCodes = new Set<string>();

    importedItems.forEach((it, idx) => {
      let finalCode = it.code.trim().toUpperCase();
      const group = it.group || 'INSUMOS GERAIS';

      if (!finalCode || usedCodes.has(finalCode)) {
        // Generate sequential code
        const prefix = getGroupPrefix(group);
        let num = 1;
        while (usedCodes.has(`${prefix}${String(num).padStart(4, '0')}`)) {
          num++;
        }
        finalCode = `${prefix}${String(num).padStart(4, '0')}`;
      }

      usedCodes.add(finalCode);

      newCatalog.push({
        id: `import-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        code: finalCode,
        description: it.description,
        group,
        unit: it.unit || 'PÇ',
        cost: it.cost || 0,
        weightBar: it.weightBar || 0,
        notes: it.notes || '',
        createdAt: new Date().toISOString(),
      });
      addedCount++;
    });

    return {
      updatedCatalog: newCatalog,
      addedCount,
      updatedCount: 0,
      totalCount: newCatalog.length,
    };
  }

  // Maps for quick lookup by Code and by Normalized Description
  const catalogCopy: CatalogItem[] = [...existingCatalog];
  const codeIndexMap = new Map<string, number>();
  const descIndexMap = new Map<string, number>();

  catalogCopy.forEach((item, idx) => {
    if (item.code) codeIndexMap.set(item.code.toUpperCase(), idx);
    if (item.description) {
      const normDesc = item.description.trim().toUpperCase();
      descIndexMap.set(normDesc, idx);
    }
  });

  importedItems.forEach((it, idx) => {
    const importCode = it.code.trim().toUpperCase();
    const normDesc = it.description.trim().toUpperCase();

    // Check match
    let matchIdx = -1;
    if (importCode && codeIndexMap.has(importCode)) {
      matchIdx = codeIndexMap.get(importCode)!;
    } else if (descIndexMap.has(normDesc)) {
      matchIdx = descIndexMap.get(normDesc)!;
    }

    if (matchIdx !== -1) {
      if (mode === 'merge') {
        // Update existing item
        const existing = catalogCopy[matchIdx];
        catalogCopy[matchIdx] = {
          ...existing,
          description: it.description || existing.description,
          group: it.group || existing.group,
          unit: it.unit || existing.unit,
          cost: it.cost > 0 ? it.cost : existing.cost,
          weightBar: it.weightBar > 0 ? it.weightBar : existing.weightBar,
          notes: it.notes || existing.notes || '',
        };
        updatedCount++;
      }
      // If 'append', ignore matches
    } else {
      // Item does not exist: Add it
      const group = it.group || 'INSUMOS GERAIS';
      let assignedCode = importCode;

      if (!assignedCode || codeIndexMap.has(assignedCode)) {
        assignedCode = getNextCodeForGroup(group, catalogCopy);
      }

      const newItem: CatalogItem = {
        id: `import-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        code: assignedCode,
        description: it.description,
        group,
        unit: it.unit || 'PÇ',
        cost: it.cost || 0,
        weightBar: it.weightBar || 0,
        notes: it.notes || '',
        createdAt: new Date().toISOString(),
      };

      catalogCopy.push(newItem);
      const newIdx = catalogCopy.length - 1;
      codeIndexMap.set(assignedCode.toUpperCase(), newIdx);
      descIndexMap.set(normDesc, newIdx);
      addedCount++;
    }
  });

  return {
    updatedCatalog: catalogCopy,
    addedCount,
    updatedCount,
    totalCount: catalogCopy.length,
  };
}
