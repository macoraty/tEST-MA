import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SupplyRequisition, AppSettings } from './types';
import { formatCurrency, formatDate } from './exportUtils';

/**
 * Generates and downloads an official industrial Supply Requisition PDF
 */
export function exportRequisitionPDF(
  requisition: SupplyRequisition,
  settings: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // Primary palette: Industrial Deep Navy & Cyan
  const colorPrimary = [15, 23, 42]; // Slate 900
  const colorAccent = [2, 132, 199]; // Sky 600
  const colorDark = [30, 41, 59];
  const colorMuted = [100, 116, 139];

  // 1. Company Header
  doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Cyan top accent bar
  doc.setFillColor(colorAccent[0], colorAccent[1], colorAccent[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const companyName = settings.companyName || 'SISTEMA INDUSTRIAL';
  doc.text(companyName.toUpperCase(), margin, 12);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  const contactParts: string[] = [];
  if (settings.companyCnpj) contactParts.push(`CNPJ: ${settings.companyCnpj}`);
  if (settings.companyPhone) contactParts.push(`Tel: ${settings.companyPhone}`);
  if (settings.companyEmail) contactParts.push(settings.companyEmail);
  doc.text(
    contactParts.length > 0 ? contactParts.join(' | ') : 'Gestão de Materiais e Insumos',
    margin,
    18
  );

  // Requisition Title / Protocol Tag on Header Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(56, 189, 248);
  doc.text(requisition.protocol || 'REQUISIÇÃO DE INSUMOS', pageWidth - margin, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Data: ${formatDate(requisition.requestDate)}`, pageWidth - margin, 18, { align: 'right' });

  currentY = 32;

  // 2. Document Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text('REQUISIÇÃO INTERNA DE INSUMOS & MATERIAIS', margin, currentY);

  // Status & Priority Badges on the right
  currentY += 4;

  // Metadata Card Box
  const cardY = currentY;
  const cardHeight = 32;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, cardY, pageWidth - margin * 2, cardHeight, 2, 2, 'FD');

  doc.setFontSize(8.5);

  // Column 1: Solicitante & Setor
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('SOLICITANTE:', margin + 4, cardY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(requisition.requesterName || 'Não informado', margin + 30, cardY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('SETOR:', margin + 4, cardY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(requisition.sector || 'Geral', margin + 30, cardY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('MÁQUINA/DESTINO:', margin + 4, cardY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(requisition.destinationMachine || 'Geral / Estoque', margin + 38, cardY + 21);

  // Column 2: Prioridade, Data Limite, Status
  const col2X = margin + 110;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('PRIORIDADE:', col2X, cardY + 7);
  doc.setFont('helvetica', 'bold');
  const priColor = requisition.priority === 'Urgente' ? [225, 29, 72] : [2, 132, 199];
  doc.setTextColor(priColor[0], priColor[1], priColor[2]);
  doc.text(requisition.priority.toUpperCase(), col2X + 26, cardY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('NECESSIDADE:', col2X, cardY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(formatDate(requisition.neededByDate) || 'Imediata', col2X + 26, cardY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('STATUS:', col2X, cardY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(requisition.status.toUpperCase(), col2X + 26, cardY + 21);

  // Justification row inside box
  if (requisition.justification) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
    doc.text('JUSTIFICATIVA:', margin + 4, cardY + 28);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    const justText = doc.splitTextToSize(requisition.justification, pageWidth - margin * 2 - 38);
    doc.text(justText[0] || '', margin + 32, cardY + 28);
  }

  currentY = cardY + cardHeight + 6;

  // 3. Items Table
  const tableRows = (requisition.items || []).map((item, idx) => [
    String(idx + 1).padStart(2, '0'),
    item.code || '-',
    item.description || '-',
    item.group || '-',
    Number(item.quantity || 0).toLocaleString('pt-BR'),
    item.unit || 'PÇ',
    formatCurrency(item.estimatedCost || 0, settings.currencySymbol),
    formatCurrency(item.totalEstimatedCost || 0, settings.currencySymbol),
    item.destinationMachine || item.notes || '-',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      '#',
      'CÓDIGO',
      'DESCRIÇÃO DO INSUMO',
      'GRUPO',
      'QTD',
      'UN',
      'VALOR EST.',
      'SUBTOTAL',
      'APLICAÇÃO / OBS',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26, fontSize: 7 },
      4: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 28, fontSize: 7 },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // Calculate position after table
  const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  const lastTable = docWithTable.lastAutoTable;
  let finalY = lastTable ? lastTable.finalY + 5 : currentY + 30;

  // 4. Totals Block
  const totalCost = requisition.items.reduce((acc, i) => acc + (Number(i.totalEstimatedCost) || 0), 0);
  const totalItemsCount = requisition.items.length;

  if (finalY + 35 > pageHeight) {
    doc.addPage();
    finalY = 20;
  }

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - margin - 80, finalY, 80, 16, 1.5, 1.5, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('TOTAL DE ITENS:', pageWidth - margin - 76, finalY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(String(totalItemsCount), pageWidth - margin - 4, finalY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('CUSTO ESTIMADO:', pageWidth - margin - 76, finalY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(
    formatCurrency(totalCost, settings.currencySymbol),
    pageWidth - margin - 4,
    finalY + 12,
    { align: 'right' }
  );

  finalY += 24;

  // 5. Signature Boxes (Solicitante / Aprovação Técnica / Almoxarifado)
  if (finalY + 30 > pageHeight) {
    doc.addPage();
    finalY = 25;
  }

  const signWidth = (pageWidth - margin * 2 - 16) / 3;
  const signLabels = [
    'Solicitante / Operador',
    'Aprovação / Gerência',
    'Almoxarifado / Compras',
  ];

  signLabels.forEach((lbl, i) => {
    const sX = margin + i * (signWidth + 8);
    doc.setDrawColor(148, 163, 184); // Slate 400
    doc.line(sX, finalY + 14, sX + signWidth, finalY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.text(lbl, sX + signWidth / 2, finalY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
    doc.text('Data: ____/____/______', sX + signWidth / 2, finalY + 22, { align: 'center' });
  });

  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text(
    `Documento emitido pelo sistema ${settings.appName || 'ListaPro Industrial'} em ${new Date().toLocaleString('pt-BR')}`,
    margin,
    pageHeight - 8
  );

  // Trigger download
  const safeFilename = `${requisition.protocol || 'requisicao'}_insumos.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  doc.save(safeFilename);
}

/**
 * Builds formatted text and a direct URL to share requisition via WhatsApp
 */
export function generateRequisitionWhatsAppUrl(
  requisition: SupplyRequisition,
  settings: AppSettings,
  targetPhone?: string
): string {
  const company = settings.companyName ? `*${settings.companyName}*\n` : '';
  const header = `📦 *SOLICITAÇÃO DE INSUMOS & COMPRAS*\n${company}` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 *Protocolo:* ${requisition.protocol}\n` +
    `🏷️ *Título:* ${requisition.title}\n` +
    `👤 *Solicitante:* ${requisition.requesterName || 'Não informado'}\n` +
    `🏢 *Setor:* ${requisition.sector || 'Geral'}\n` +
    (requisition.destinationMachine ? `⚙️ *Máquina/Destino:* ${requisition.destinationMachine}\n` : '') +
    `⚡ *Prioridade:* ${requisition.priority.toUpperCase()}\n` +
    `📅 *Data:* ${formatDate(requisition.requestDate)}\n` +
    (requisition.neededByDate ? `⏳ *Necessidade Limite:* ${formatDate(requisition.neededByDate)}\n` : '') +
    (requisition.justification ? `💬 *Justificativa:* ${requisition.justification}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 *ITENS REQUISITADOS (${requisition.items.length}):*\n`;

  const itemsList = requisition.items
    .map((item, idx) => {
      const subtotal = item.totalEstimatedCost
        ? ` - ${formatCurrency(item.totalEstimatedCost, settings.currencySymbol)}`
        : '';
      const notes = item.destinationMachine || item.notes ? ` _(${item.destinationMachine || item.notes})_` : '';
      return `${idx + 1}. *[${item.code}]* ${item.description}\n   ↳ *Qtd:* ${item.quantity} ${item.unit}${subtotal}${notes}`;
    })
    .join('\n\n');

  const totalCost = requisition.items.reduce((acc, i) => acc + (Number(i.totalEstimatedCost) || 0), 0);
  const footer = `\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Valor Total Estimado:* ${formatCurrency(totalCost, settings.currencySymbol)}\n` +
    `📊 *Status:* ${requisition.status}\n` +
    `_Favor confirmar recebimento e previsão de cotação/entrega._`;

  const fullMessage = `${header}\n${itemsList}\n${footer}`;
  const encodedText = encodeURIComponent(fullMessage);

  const phone = (targetPhone || settings.companyPhone || '').replace(/\D/g, '');
  return phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
}
