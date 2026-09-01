import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialList, AppSettings, PDFTemplateType, ExcelTemplateType, PDFThemeColor } from './types';

// Format currency
export function formatCurrency(value: number, symbol = 'R$'): string {
  return `${symbol} ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

// Theme color palettes for PDF
const THEME_COLORS: Record<
  PDFThemeColor,
  {
    primary: [number, number, number];
    accent: [number, number, number];
    badgeBg: [number, number, number];
    badgeText: [number, number, number];
  }
> = {
  navy: {
    primary: [15, 23, 42],      // Slate 900
    accent: [2, 132, 199],       // Sky 600
    badgeBg: [224, 242, 254],
    badgeText: [3, 105, 161],
  },
  cyan: {
    primary: [8, 51, 68],        // Cyan 950
    accent: [6, 182, 212],       // Cyan 500
    badgeBg: [207, 250, 254],
    badgeText: [14, 116, 144],
  },
  emerald: {
    primary: [6, 78, 59],        // Emerald 900
    accent: [16, 185, 129],      // Emerald 500
    badgeBg: [209, 250, 229],
    badgeText: [4, 120, 87],
  },
  slate: {
    primary: [39, 39, 42],       // Zinc 800
    accent: [113, 113, 122],     // Zinc 500
    badgeBg: [244, 244, 245],
    badgeText: [63, 63, 70],
  },
  crimson: {
    primary: [136, 19, 55],      // Rose 900
    accent: [225, 29, 72],       // Rose 600
    badgeBg: [255, 228, 230],
    badgeText: [190, 18, 60],
  },
};

export interface ExportOverrideOptions {
  pdfTemplate?: PDFTemplateType;
  pdfThemeColor?: PDFThemeColor;
  pdfShowLogo?: boolean;
  pdfShowPrices?: boolean;
  pdfShowWeights?: boolean;
  pdfShowSignatures?: boolean;
  excelTemplate?: ExcelTemplateType;
  excelShowPrices?: boolean;
  excelShowWeights?: boolean;
}

// EXCEL EXPORT WITH TEMPLATES
export function exportListToExcel(
  list: MaterialList,
  settings: AppSettings,
  overrides?: ExportOverrideOptions
): void {
  const wb = XLSX.utils.book_new();

  const excelTemplate: ExcelTemplateType =
    overrides?.excelTemplate || settings.excelTemplate || 'complete';
  const showPrices = overrides?.excelShowPrices ?? settings.excelShowPrices ?? true;
  const showWeights = overrides?.excelShowWeights ?? settings.excelShowWeights ?? true;
  const includeHeader = settings.excelIncludeHeader ?? true;
  const includeSummary = settings.excelIncludeSummary ?? true;

  const totalItemsCount = list.items.length;
  const totalQty = list.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const totalCost = list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
  const totalWeight = list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);

  const rows: (string | number)[][] = [];

  // TEMPLATE 1: Tabela Industrial Completa
  if (excelTemplate === 'complete') {
    if (includeHeader) {
      rows.push([settings.companyName || 'GESTOR INDUSTRIAL DE MATERIAIS']);
      rows.push(['LISTA DE MATERIAIS & INSUMOS']);
      if (settings.companyCnpj || settings.companyPhone) {
        rows.push([
          `CNPJ: ${settings.companyCnpj || '-'} | Tel: ${settings.companyPhone || '-'} | E-mail: ${settings.companyEmail || '-'}`,
        ]);
      }
      rows.push([]);
      rows.push(['INFORMAÇÕES DO PROJETO']);
      rows.push(['Nome da Lista / Projeto:', list.name]);
      rows.push(['Máquina / Equipamento:', list.machine]);
      rows.push(['Cliente / Empresa:', list.client || 'Interno']);
      rows.push(['Responsável Técnico:', list.responsible || '-']);
      rows.push(['Data de Emissão:', formatDate(list.date)]);
      rows.push(['Status da Lista:', list.status]);
      if (list.notes) {
        rows.push(['Observações Gerais:', list.notes]);
      }
      rows.push([]);
    }

    // Table Header
    const tableHeader: (string | number)[] = [
      'ITEM',
      'CÓDIGO',
      'DESCRIÇÃO DO MATERIAL / INSUMO',
      'GRUPO / CATEGORIA',
      'UNID.',
      'QUANTIDADE',
    ];
    if (showWeights) {
      tableHeader.push('PESO UNIT. (KG)', 'PESO TOTAL (KG)');
    }
    if (showPrices) {
      tableHeader.push(`VALOR UNIT. (${settings.currencySymbol})`, `TOTAL (${settings.currencySymbol})`);
    }
    tableHeader.push('OBSERVAÇÕES');
    rows.push(tableHeader);

    list.items.forEach((item, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        item.code,
        item.description,
        item.group,
        item.unit,
        item.quantity,
      ];
      if (showWeights) {
        row.push(item.weightBar || 0, item.totalWeight || 0);
      }
      if (showPrices) {
        row.push(item.unitCost || 0, item.totalCost || 0);
      }
      row.push(item.notes || '');
      rows.push(row);
    });

    if (includeSummary) {
      rows.push([]);
      rows.push(['RESUMO GERAL']);
      rows.push(['Total de Itens Distintos:', totalItemsCount]);
      rows.push(['Soma de Quantidades / Volumes:', totalQty]);
      if (showWeights) {
        rows.push(['Peso Total Estimado (kg):', totalWeight]);
      }
      if (showPrices) {
        rows.push([`Custo Total Estimado (${settings.currencySymbol}):`, totalCost]);
      }
    }
  }

  // TEMPLATE 2: Engenharia & PCP (Foco em fabricação e peso)
  else if (excelTemplate === 'engineering') {
    rows.push([settings.companyName || 'ENGENHARIA INDUSTRIAL']);
    rows.push(['ORDEM TÉCNICA DE PRODUÇÃO / ENGENHARIA (PCP)']);
    rows.push([`Projeto: ${list.name} | Equipamento: ${list.machine} | Emissão: ${formatDate(list.date)}`]);
    rows.push([]);

    rows.push([
      'POS.',
      'CÓDIGO TÉCNICO',
      'DESCRIÇÃO DO COMPONENTE',
      'GRUPO / FAMÍLIA',
      'UNID.',
      'QTD. NECESSÁRIA',
      'PESO REF. (KG)',
      'PESO TOTAL (KG)',
      'ESPECIFICAÇÃO / TOLERÂNCIA / NOTAS',
    ]);

    list.items.forEach((item, idx) => {
      rows.push([
        idx + 1,
        item.code,
        item.description,
        item.group,
        item.unit,
        item.quantity,
        item.weightBar || 0,
        item.totalWeight || 0,
        item.notes || '',
      ]);
    });

    if (includeSummary) {
      rows.push([]);
      rows.push(['TOTALIZAÇÃO DE ENGENHARIA']);
      rows.push(['Total de Componentes Distintos:', totalItemsCount]);
      rows.push(['Volume Total de Peças:', totalQty]);
      rows.push(['Massa Total Estimada (kg):', totalWeight]);
    }
  }

  // TEMPLATE 3: Compras & Suprimentos (Foco em cotação de fornecedores)
  else if (excelTemplate === 'procurement') {
    rows.push([settings.companyName || 'DEPARTAMENTO DE COMPRAS & SUPRIMENTOS']);
    rows.push(['MAPA DE COTAÇÃO & SOLICITAÇÃO DE COMPRAS']);
    rows.push([`Referência: ${list.name} | Máquina: ${list.machine} | Responsável: ${list.responsible || '-'}`]);
    rows.push([]);

    rows.push([
      'ITEM',
      'CÓDIGO',
      'DESCRIÇÃO DO INSUMO',
      'GRUPO',
      'QTD.',
      'UNID.',
      `PREÇO ESTIMADO (${settings.currencySymbol})`,
      `TOTAL ESTIMADO (${settings.currencySymbol})`,
      'FORNECEDOR COTADO',
      'PRAZO DE ENTREGA',
      'STATUS DA COMPRA',
    ]);

    list.items.forEach((item, idx) => {
      rows.push([
        idx + 1,
        item.code,
        item.description,
        item.group,
        item.quantity,
        item.unit,
        item.unitCost || 0,
        item.totalCost || 0,
        '', // Fornecedor a preencher
        '', // Prazo a preencher
        'Pendente', // Status
      ]);
    });

    if (includeSummary) {
      rows.push([]);
      rows.push(['RESUMO FINANCEIRO DE COMPRAS']);
      rows.push(['Total de Itens Solicitados:', totalItemsCount]);
      rows.push([`Orçamento Estimado (${settings.currencySymbol}):`, totalCost]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set intelligent column widths
  ws['!cols'] = [
    { wch: 6 },  // ITEM / POS
    { wch: 15 }, // CÓDIGO
    { wch: 48 }, // DESCRIÇÃO
    { wch: 25 }, // GRUPO
    { wch: 8 },  // UNID
    { wch: 14 }, // QTD
    { wch: 16 }, // PESO UNIT
    { wch: 16 }, // PESO TOTAL
    { wch: 18 }, // VALOR UNIT
    { wch: 18 }, // TOTAL
    { wch: 32 }, // OBS
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lista_Materiais');

  const sanitizeName = (list.name || 'Lista_Materiais').replace(/[^a-z0-9_-]/gi, '_');
  const filename = `${sanitizeName}_${list.machine ? list.machine.replace(/[^a-z0-9_-]/gi, '_') : 'Geral'}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// EXPORT CATALOG TO EXCEL
export function exportCatalogToExcel(
  items: { code: string; description: string; group: string; unit: string; cost: number; weightBar: number }[],
  settings: AppSettings
): void {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    [settings.companyName || 'BANCO DE DADOS DE MATERIAIS & INSUMOS'],
    ['CATÁLOGO GERAL DE MATERIAIS & INSUMOS CADASTRADOS'],
    [],
    ['CÓDIGO', 'DESCRIÇÃO DO MATERIAL', 'GRUPO / CATEGORIA', 'UNIDADE', 'PESO REF. (KG)', `CUSTO BASE (${settings.currencySymbol})`],
  ];

  items.forEach((item) => {
    rows.push([
      item.code,
      item.description,
      item.group,
      item.unit,
      item.weightBar || 0,
      item.cost || 0,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 52 },
    { wch: 28 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Catalogo_Itens');
  XLSX.writeFile(wb, `Catalogo_Materiais_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// PDF EXPORT WITH TEMPLATES & LOGO SUPPORT
export function exportListToPDF(
  list: MaterialList,
  settings: AppSettings,
  overrides?: ExportOverrideOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const template: PDFTemplateType =
    overrides?.pdfTemplate || settings.pdfTemplate || 'modern';
  const themeKey: PDFThemeColor =
    overrides?.pdfThemeColor || settings.pdfThemeColor || 'navy';
  const theme = THEME_COLORS[themeKey] || THEME_COLORS.navy;

  const showLogo = overrides?.pdfShowLogo ?? settings.pdfShowLogo ?? true;
  const showPrices = overrides?.pdfShowPrices ?? settings.pdfShowPrices ?? true;
  const showWeights = overrides?.pdfShowWeights ?? settings.pdfShowWeights ?? true;
  const showSignatures = overrides?.pdfShowSignatures ?? settings.pdfShowSignatures ?? true;
  const showNotes = settings.pdfShowNotes ?? true;

  const hasLogo = Boolean(settings.companyLogo && showLogo);

  // Helper to add company logo safely
  const renderLogo = (x: number, y: number, maxW: number, maxH: number) => {
    if (!hasLogo || !settings.companyLogo) return false;
    try {
      let format = 'PNG';
      if (settings.companyLogo.includes('image/jpeg') || settings.companyLogo.includes('image/jpg')) {
        format = 'JPEG';
      } else if (settings.companyLogo.includes('image/webp')) {
        format = 'WEBP';
      }
      doc.addImage(settings.companyLogo, format, x, y, maxW, maxH, undefined, 'FAST');
      return true;
    } catch (err) {
      console.warn('Could not render logo in PDF:', err);
      return false;
    }
  };

  let startTableY = 62;

  // -------------------------------------------------------------
  // TEMPLATE 1: MODERNO INDUSTRIAL (Padrão)
  // -------------------------------------------------------------
  if (template === 'modern') {
    // Top banner
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.rect(0, 0, 210, 26, 'F');

    let textStartX = 14;
    if (hasLogo) {
      const rendered = renderLogo(14, 3, 20, 20);
      if (rendered) textStartX = 38;
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || 'LISTA DE MATERIAIS & INSUMOS', textStartX, 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const companySub = [
      settings.companyCnpj ? `CNPJ: ${settings.companyCnpj}` : '',
      settings.companyPhone ? `Tel: ${settings.companyPhone}` : '',
      settings.companyEmail ? `E-mail: ${settings.companyEmail}` : '',
    ]
      .filter(Boolean)
      .join('  |  ');
    doc.text(companySub || 'Documento Técnico de Separação e Compras', textStartX, 18);

    // List Info Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 30, 182, 26, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Lista: ${list.name}`, 18, 37);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Máquina / Equipamento:`, 18, 43);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(list.machine || 'Geral', 55, 43);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Cliente:`, 18, 49);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(list.client || 'Interno', 32, 49);

    // Right Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Data:`, 120, 37);
    doc.setTextColor(30, 41, 59);
    doc.text(formatDate(list.date), 132, 37);

    doc.setTextColor(100, 116, 139);
    doc.text(`Responsável:`, 120, 43);
    doc.setTextColor(30, 41, 59);
    doc.text(list.responsible || '-', 142, 43);

    doc.setTextColor(100, 116, 139);
    doc.text(`Status:`, 120, 49);
    doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(list.status.toUpperCase(), 133, 49);

    startTableY = 60;
  }

  // -------------------------------------------------------------
  // TEMPLATE 2: CORPORATIVO EXECUTIVO (Clean / Formal)
  // -------------------------------------------------------------
  else if (template === 'corporate') {
    let textStartX = 14;
    if (hasLogo) {
      const rendered = renderLogo(14, 10, 28, 20);
      if (rendered) textStartX = 46;
    }

    doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || 'RELATÓRIO CORPORATIVO DE MATERIAIS', textStartX, 16);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (settings.companyAddress) {
      doc.text(settings.companyAddress, textStartX, 22);
    }
    const sub = [settings.companyCnpj ? `CNPJ: ${settings.companyCnpj}` : '', settings.companyPhone, settings.companyEmail]
      .filter(Boolean)
      .join(' • ');
    doc.text(sub || 'Gestão e Controle de Suprimentos Industriais', textStartX, 27);

    // Colored divider line
    doc.setDrawColor(theme.accent[0], theme.accent[1], theme.accent[2]);
    doc.setLineWidth(0.8);
    doc.line(14, 32, 196, 32);

    // Corporate meta table
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`DOCUMENTO: ${list.name}`, 14, 40);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Equipamento: ${list.machine || '-'}  |  Cliente: ${list.client || 'Interno'}`, 14, 46);
    doc.text(`Emissão: ${formatDate(list.date)}  |  Resp.: ${list.responsible || '-'}  |  Status: ${list.status}`, 14, 51);

    startTableY = 56;
  }

  // -------------------------------------------------------------
  // TEMPLATE 3: OFICINA & SEPARAÇÃO (Almoxarifado & Chão de Fábrica)
  // -------------------------------------------------------------
  else if (template === 'workshop') {
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.rect(0, 0, 210, 22, 'F');

    let textStartX = 14;
    if (hasLogo) {
      const rendered = renderLogo(14, 2, 18, 18);
      if (rendered) textStartX = 36;
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEM DE SEPARAÇÃO & ALMOXARIFADO', textStartX, 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${settings.companyName || 'Oficina / Almoxarifado'}`, textStartX, 17);

    // Big project identifier bar
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 26, 182, 20, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORDEM: ${list.name}`, 18, 33);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Máquina: ${list.machine}   |   Cliente: ${list.client || 'Interno'}   |   Data: ${formatDate(list.date)}`, 18, 40);

    startTableY = 50;
  }

  // -------------------------------------------------------------
  // TEMPLATE 4: PROPOSTA COMERCIAL & ESTIMATIVA (Orçamento)
  // -------------------------------------------------------------
  else if (template === 'quote') {
    let textStartX = 14;
    if (hasLogo) {
      const rendered = renderLogo(14, 8, 26, 20);
      if (rendered) textStartX = 44;
    }

    doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || 'PROPOSTA COMERCIAL & ORÇAMENTO', textStartX, 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text([settings.companyCnpj ? `CNPJ: ${settings.companyCnpj}` : '', settings.companyPhone, settings.companyEmail].filter(Boolean).join(' | '), textStartX, 19);
    if (settings.companyAddress) {
      doc.text(settings.companyAddress, textStartX, 24);
    }

    // Commercial Title Card
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.roundedRect(14, 28, 182, 10, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROPOSTA / ESTIMATIVA DE FORNECIMENTO: ${list.name}`, 18, 34.5);

    // Client box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 40, 182, 16, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(`CLIENTE: ${list.client || 'A/C Departamento de Compras'}`, 18, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(`Equipamento de Referência: ${list.machine || '-'}   |   Data da Proposta: ${formatDate(list.date)}`, 18, 51);

    startTableY = 60;
  }

  // If notes exist and showNotes is true
  if (list.notes && showNotes) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    const splitNotes = doc.splitTextToSize(`Observações Gerais: ${list.notes}`, 180);
    doc.text(splitNotes, 14, startTableY);
    startTableY += splitNotes.length * 3.8 + 2;
  }

  // -------------------------------------------------------------
  // BUILD TABLE COLUMNS & DATA
  // -------------------------------------------------------------
  const isWorkshop = template === 'workshop';

  const tableHead: string[][] = [[]];
  tableHead[0].push('#', 'Código', 'Descrição do Material', 'Grupo', 'Unid.', 'Qtd.');

  if (isWorkshop) {
    if (showWeights) tableHead[0].push('Peso Unit.', 'Peso Tot.');
    tableHead[0].push('Conf. [  ]');
  } else {
    if (showWeights) tableHead[0].push('Peso Tot.');
    if (showPrices) tableHead[0].push('Unitário', 'Total');
  }

  const tableBody = list.items.map((item, idx) => {
    const row: (string | number)[] = [
      idx + 1,
      item.code,
      item.description + (item.notes ? `\nObs: ${item.notes}` : ''),
      item.group,
      item.unit,
      item.quantity,
    ];

    if (isWorkshop) {
      if (showWeights) {
        row.push(
          item.weightBar > 0 ? `${item.weightBar.toFixed(2)} kg` : '-',
          item.totalWeight > 0 ? `${item.totalWeight.toFixed(2)} kg` : '-'
        );
      }
      row.push('[   ]');
    } else {
      if (showWeights) {
        row.push(item.totalWeight > 0 ? `${item.totalWeight.toFixed(2)} kg` : '-');
      }
      if (showPrices) {
        row.push(
          item.unitCost > 0 ? formatCurrency(item.unitCost, settings.currencySymbol) : '-',
          item.totalCost > 0 ? formatCurrency(item.totalCost, settings.currencySymbol) : '-'
        );
      }
    }

    return row;
  });

  autoTable(doc, {
    startY: startTableY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [theme.primary[0], theme.primary[1], theme.primary[2]],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 23, fontStyle: 'bold' },
      2: { cellWidth: isWorkshop ? 68 : showPrices ? 62 : 85 },
      3: { cellWidth: 26 },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page number & custom footer
      const pageStr = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(pageStr, 196, 290, { align: 'right' });
      const footerMsg = settings.pdfFooterText || `Gerado em ${new Date().toLocaleString('pt-BR')}`;
      doc.text(footerMsg, 14, 290);
    },
  });

  // Calculate totals
  const totalCost = list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
  const totalWeight = list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
  const totalQty = list.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  // Summary box after table
  const lastAutoTable = (doc as any).lastAutoTable;
  const finalY = (lastAutoTable ? lastAutoTable.finalY : 120) + 6;

  if (finalY < 260) {
    // Summary Card
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(120, finalY, 76, 24, 1.5, 1.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`Total de Itens:`, 124, finalY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${list.items.length} itens (${totalQty} un)`, 192, finalY + 6, { align: 'right' });

    if (showWeights && totalWeight > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Peso Total Estimado:`, 124, finalY + 12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalWeight.toFixed(2)} kg`, 192, finalY + 12, { align: 'right' });
    }

    if (showPrices && totalCost > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Valor Total Estimado:`, 124, finalY + 18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
      doc.text(formatCurrency(totalCost, settings.currencySymbol), 192, finalY + 18, { align: 'right' });
    }

    // Signatures
    if (showSignatures) {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      if (isWorkshop) {
        doc.line(14, finalY + 18, 62, finalY + 18);
        doc.text('Separado por (Almoxarifado)', 14, finalY + 22);

        doc.line(68, finalY + 18, 114, finalY + 18);
        doc.text('Recebido por (Montagem/Oficina)', 68, finalY + 22);
      } else if (template === 'quote') {
        doc.line(14, finalY + 18, 62, finalY + 18);
        doc.text('Vendedor / Engenharia', 14, finalY + 22);

        doc.line(68, finalY + 18, 114, finalY + 18);
        doc.text('De Acordo do Cliente', 68, finalY + 22);
      } else {
        doc.line(14, finalY + 18, 62, finalY + 18);
        doc.text('Assinatura do Solicitante', 14, finalY + 22);

        doc.line(68, finalY + 18, 114, finalY + 18);
        doc.text('Aprovação / Almoxarifado', 68, finalY + 22);
      }
    }
  }

  const sanitizeName = (list.name || 'Lista_Materiais').replace(/[^a-z0-9_-]/gi, '_');
  const filename = `${sanitizeName}_${list.machine ? list.machine.replace(/[^a-z0-9_-]/gi, '_') : 'Geral'}.pdf`;
  doc.save(filename);
}

// GENERATE SAMPLE PDF FOR LIVE PREVIEW TESTING IN SETTINGS
export function generateSamplePDF(settings: AppSettings): void {
  const sampleList: MaterialList = {
    id: 'sample-pdf-demo',
    name: 'Demonstração de Layout e Cabeçalho PDF',
    machine: 'Torno CNC / Centro de Usinagem 01',
    client: 'Cliente Exemplo Indústria SA',
    responsible: settings.defaultResponsible || 'Engenharia / PCM',
    date: new Date().toISOString().split('T')[0],
    status: 'Aprovada',
    notes: 'Layout de teste configurado nas opções de template do sistema.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'sample-1',
        code: 'ROLAM0001',
        description: 'ROLAMENTO RIGIDO DE ESFERAS 6204 2RS D=20 D=47 B=14',
        group: 'ROLAMENTOS & GUIAS',
        unit: 'PÇ',
        quantity: 4,
        unitCost: 28.5,
        totalCost: 114.0,
        weightBar: 0.12,
        totalWeight: 0.48,
        notes: 'Folga C3',
      },
      {
        id: 'sample-2',
        code: 'PERFI0001',
        description: 'TUBO QUADRADO ESTRUTURAL 50X50X3,00MM ACO CARBONO',
        group: 'PERFIS ESTRUTURAIS',
        unit: 'BR',
        quantity: 2,
        unitCost: 195.0,
        totalCost: 390.0,
        weightBar: 26.5,
        totalWeight: 53.0,
        notes: 'Barra com 6 metros',
      },
      {
        id: 'sample-3',
        code: 'FIXAD0001',
        description: 'PARAFUSO SEXTAVADO M10 X 40MM CLASSE 8.8 ZINCADO',
        group: 'FIXADORES & PARAFUSOS',
        unit: 'CT',
        quantity: 50,
        unitCost: 1.85,
        totalCost: 92.5,
        weightBar: 0.04,
        totalWeight: 2.0,
        notes: 'Acompanha arruela de pressão',
      },
    ],
  };

  exportListToPDF(sampleList, settings);
}

// GENERATE SAMPLE EXCEL FOR LIVE PREVIEW TESTING IN SETTINGS
export function generateSampleExcel(settings: AppSettings): void {
  const sampleList: MaterialList = {
    id: 'sample-excel-demo',
    name: 'Demonstração de Template Excel',
    machine: 'Linha de Montagem 03',
    client: 'Cliente Demonstração',
    responsible: settings.defaultResponsible || 'Engenharia',
    date: new Date().toISOString().split('T')[0],
    status: 'Aprovada',
    notes: 'Exemplo de exportação para teste de colunas e formatação.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'sample-1',
        code: 'ROLAM0001',
        description: 'ROLAMENTO RIGIDO DE ESFERAS 6204 2RS',
        group: 'ROLAMENTOS & GUIAS',
        unit: 'PÇ',
        quantity: 4,
        unitCost: 28.5,
        totalCost: 114.0,
        weightBar: 0.12,
        totalWeight: 0.48,
      },
      {
        id: 'sample-2',
        code: 'PERFI0001',
        description: 'TUBO QUADRADO 50X50X3,00MM',
        group: 'PERFIS ESTRUTURAIS',
        unit: 'BR',
        quantity: 2,
        unitCost: 195.0,
        totalCost: 390.0,
        weightBar: 26.5,
        totalWeight: 53.0,
      },
    ],
  };

  exportListToExcel(sampleList, settings);
}

// WHATSAPP TEXT GENERATION
export function buildWhatsAppMessage(list: MaterialList, settings: AppSettings): string {
  const totalCost = list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
  const totalWeight = list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
  const totalQty = list.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  const groupedItems: { [group: string]: typeof list.items } = {};
  list.items.forEach((item) => {
    const grp = item.group || 'OUTROS';
    if (!groupedItems[grp]) groupedItems[grp] = [];
    groupedItems[grp].push(item);
  });

  const formattedItemsList = Object.entries(groupedItems)
    .map(([groupName, items]) => {
      const header = `🔹 *${groupName}*`;
      const rows = items
        .map((i, idx) => {
          let line = `  ${idx + 1}. *${i.quantity} ${i.unit}* - ${i.description} _(Cód: ${i.code})_`;
          if (i.unitCost > 0) {
            line += ` | ${formatCurrency(i.unitCost, settings.currencySymbol)} un = *${formatCurrency(i.totalCost, settings.currencySymbol)}*`;
          }
          if (i.notes) {
            line += `\n     ↳ Obs: ${i.notes}`;
          }
          return line;
        })
        .join('\n');
      return `${header}\n${rows}`;
    })
    .join('\n\n');

  let financialSummary = `💰 *Total Estimado:* ${formatCurrency(totalCost, settings.currencySymbol)}`;
  if (totalWeight > 0) {
    financialSummary += `\n⚖️ *Peso Total:* ${totalWeight.toFixed(2)} kg`;
  }
  financialSummary += `\n📊 *Total de Peças/Volumes:* ${totalQty}`;

  let message = settings.whatsAppTemplate || '';

  if (!message.trim()) {
    message = `📋 *LISTA DE MATERIAIS / ORÇAMENTO*\n🏭 *Empresa:* {empresa}\n📄 *Lista:* {nome_lista}\n⚙️ *Máquina:* {maquina}\n🏢 *Cliente:* {cliente}\n👤 *Responsável:* {responsavel}\n📅 *Data:* {data}\n━━━━━━━━━━━━━━━━━━━\n📦 *ITENS DA LISTA ({total_itens} itens):*\n{itens}\n━━━━━━━━━━━━━━━━━━━\n{resumo_financeiro}\n📝 *Observações:* {observacoes}`;
  }

  return message
    .replace(/{empresa}/g, settings.companyName || 'Metalúrgica Industrial')
    .replace(/{nome_lista}/g, list.name || '-')
    .replace(/{maquina}/g, list.machine || '-')
    .replace(/{cliente}/g, list.client || '-')
    .replace(/{responsavel}/g, list.responsible || '-')
    .replace(/{data}/g, formatDate(list.date))
    .replace(/{status}/g, list.status || '-')
    .replace(/{total_itens}/g, String(list.items.length))
    .replace(/{itens}/g, formattedItemsList)
    .replace(/{resumo_financeiro}/g, financialSummary)
    .replace(/{observacoes}/g, list.notes || 'Nenhuma');
}

export function shareViaWhatsApp(list: MaterialList, settings: AppSettings, customPhone?: string): void {
  const text = buildWhatsAppMessage(list, settings);
  const encodedText = encodeURIComponent(text);
  const cleanPhone = customPhone ? customPhone.replace(/\D/g, '') : '';

  let url = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (cleanPhone) {
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
