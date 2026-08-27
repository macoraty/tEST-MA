import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialList, AppSettings } from './types';

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

// EXCEL EXPORT
export function exportListToExcel(list: MaterialList, settings: AppSettings): void {
  const wb = XLSX.utils.book_new();

  const totalItemsCount = list.items.length;
  const totalQty = list.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const totalCost = list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
  const totalWeight = list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);

  const rows: (string | number)[][] = [
    [settings.companyName || 'GESTOR INDUSTRIAL DE MATERIAIS'],
    ['LISTA DE MATERIAIS & INSUMOS'],
    [],
    ['INFORMAÇÕES GERAIS DA LISTA'],
    ['Nome da Lista / Projeto:', list.name],
    ['Máquina / Equipamento:', list.machine],
    ['Cliente / Empresa:', list.client],
    ['Responsável Técnico:', list.responsible || '-'],
    ['Data de Emissão:', formatDate(list.date)],
    ['Status:', list.status],
    ['Observações Gerais:', list.notes || '-'],
    [],
    [
      'ITEM',
      'CÓDIGO',
      'DESCRIÇÃO DO MATERIAL / INSUMO',
      'GRUPO / CATEGORIA',
      'UNID.',
      'QUANTIDADE',
      'PESO UNIT. (KG)',
      'PESO TOTAL (KG)',
      `VALOR UNIT. (${settings.currencySymbol})`,
      `TOTAL (${settings.currencySymbol})`,
      'OBSERVAÇÕES',
    ],
  ];

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
      item.unitCost || 0,
      item.totalCost || 0,
      item.notes || '',
    ]);
  });

  rows.push([]);
  rows.push(['RESUMO GERAL']);
  rows.push(['Total de Itens Distintos:', totalItemsCount]);
  rows.push(['Soma de Quantidades:', totalQty]);
  rows.push(['Peso Total Estimado (kg):', totalWeight]);
  rows.push([`Custo Total Estimado (${settings.currencySymbol}):`, totalCost]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // ITEM
    { wch: 14 }, // CÓDIGO
    { wch: 45 }, // DESCRIÇÃO
    { wch: 25 }, // GRUPO
    { wch: 8 },  // UNID
    { wch: 14 }, // QTD
    { wch: 16 }, // PESO UNIT
    { wch: 16 }, // PESO TOTAL
    { wch: 18 }, // VALOR UNIT
    { wch: 18 }, // TOTAL
    { wch: 30 }, // OBS
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lista de Materiais');

  const sanitizeName = (list.name || 'Lista_Materiais').replace(/[^a-z0-9_-]/gi, '_');
  const filename = `${sanitizeName}_${list.machine ? list.machine.replace(/[^a-z0-9_-]/gi, '_') : 'Geral'}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// EXPORT CATALOG TO EXCEL
export function exportCatalogToExcel(items: { code: string; description: string; group: string; unit: string; cost: number; weightBar: number }[], settings: AppSettings): void {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    [settings.companyName || 'BANCO DE DADOS DE MATERIAIS & INSUMOS'],
    ['CATÁLOGO GERAL DE ITENS'],
    [],
    ['CÓDIGO', 'DESCRIÇÃO', 'GRUPO / CATEGORIA', 'UNIDADE', 'PESO BARRA (KG)', `CUSTO BASE (${settings.currencySymbol})`],
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
    { wch: 14 },
    { wch: 50 },
    { wch: 28 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Catalogo_Itens');
  XLSX.writeFile(wb, `Catalogo_Materiais_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// PDF EXPORT
export function exportListToPDF(list: MaterialList, settings: AppSettings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [18, 24, 38]; // Dark Obsidian
  const accentColor = [37, 99, 235]; // Indigo Blue
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  // Header background bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 24, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName || 'LISTA DE MATERIAIS & INSUMOS', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const companySub = [
    settings.companyCnpj ? `CNPJ: ${settings.companyCnpj}` : '',
    settings.companyPhone ? `Tel/WhatsApp: ${settings.companyPhone}` : '',
    settings.companyEmail ? `E-mail: ${settings.companyEmail}` : '',
  ]
    .filter(Boolean)
    .join('  |  ');
  doc.text(companySub || 'Documento Técnico de Separação e Compras', 14, 18);

  // List Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, 182, 28, 2, 2, 'FD');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Lista: ${list.name}`, 18, 35);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

  doc.text(`Máquina / Equipamento:`, 18, 41);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(list.machine || 'Geral', 55, 41);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Cliente:`, 18, 47);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(list.client || 'Não informado', 32, 47);

  // Right column inside info box
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Data:`, 120, 35);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formatDate(list.date), 132, 35);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Responsável:`, 120, 41);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(list.responsible || '-', 142, 41);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Status:`, 120, 47);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(list.status.toUpperCase(), 133, 47);

  // If notes exist, add note bar
  let startTableY = 60;
  if (list.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const splitNotes = doc.splitTextToSize(`Observações: ${list.notes}`, 180);
    doc.text(splitNotes, 14, 59);
    startTableY = 59 + splitNotes.length * 4 + 2;
  }

  // Build items table
  const tableHead = [
    [
      '#',
      'Código',
      'Descrição do Item',
      'Grupo',
      'Unid.',
      'Qtd.',
      'Unitário',
      'Total',
    ],
  ];

  const tableBody = list.items.map((item, idx) => [
    idx + 1,
    item.code,
    item.description + (item.notes ? `\nObs: ${item.notes}` : ''),
    item.group,
    item.unit,
    item.quantity,
    item.unitCost > 0 ? formatCurrency(item.unitCost, settings.currencySymbol) : '-',
    item.totalCost > 0 ? formatCurrency(item.totalCost, settings.currencySymbol) : '-',
  ]);

  autoTable(doc, {
    startY: startTableY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 32 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page number
      const pageStr = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text(pageStr, 196, 290, { align: 'right' });
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 290);
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
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(120, finalY, 76, 24, 1.5, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Total de Itens:`, 124, finalY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${list.items.length} itens (${totalQty} un)`, 192, finalY + 6, { align: 'right' });

    if (totalWeight > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Peso Total Estimado:`, 124, finalY + 12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalWeight.toFixed(2)} kg`, 192, finalY + 12, { align: 'right' });
    }

    doc.setFont('helvetica', 'normal');
    doc.text(`Valor Total Estimado:`, 124, finalY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(formatCurrency(totalCost, settings.currencySymbol), 192, finalY + 18, { align: 'right' });

    // Signatures
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7.5);
    doc.line(14, finalY + 22, 65, finalY + 22);
    doc.text('Assinatura do Solicitante', 14, finalY + 26);

    doc.line(70, finalY + 22, 115, finalY + 22);
    doc.text('Aprovação / Almoxarifado', 70, finalY + 26);
  }

  const sanitizeName = (list.name || 'Lista_Materiais').replace(/[^a-z0-9_-]/gi, '_');
  const filename = `${sanitizeName}_${list.machine ? list.machine.replace(/[^a-z0-9_-]/gi, '_') : 'Geral'}.pdf`;
  doc.save(filename);
}

// WHATSAPP TEXT GENERATION
export function buildWhatsAppMessage(list: MaterialList, settings: AppSettings): string {
  const totalCost = list.items.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
  const totalWeight = list.items.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);
  const totalQty = list.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  // Group items by category for cleaner WhatsApp reading
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

  // Open in new window/tab
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
