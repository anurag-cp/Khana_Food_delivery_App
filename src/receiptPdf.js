const PAGE_WIDTH = 226.77;
const PAGE_PADDING = 22;
const INK = '0.11 0.10 0.09';
const CHILLI = '0.78 0.20 0.12';

function toAscii(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[₹]/g, 'Rs ')
    .replace(/[×]/g, 'x')
    .replace(/[·•]/g, '-')
    .replace(/[−–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(value) {
  return toAscii(value).replace(/([\\()])/g, '\\$1');
}

function wrapText(value, maxLength) {
  const words = toAscii(value).split(' ').filter(Boolean);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function amount(value) {
  return `Rs ${Math.round(value ?? 0).toLocaleString('en-IN')}`;
}

function buildReceiptPdf(order) {
  const lines = [];
  const rules = [];
  let top = 26;
  const addLine = (text, options = {}) => {
    lines.push({ top, text: toAscii(text), ...options });
    top += options.gap ?? 14;
  };
  const addRule = () => {
    rules.push(top + 2);
    top += 12;
  };

  addLine('KHANA', { size: 17, bold: true, color: CHILLI, align: 'center', gap: 19 });
  addLine('NEIGHBORHOOD FOOD - BENGALURU', { size: 7, align: 'center', gap: 16 });
  addLine('CUSTOMER COPY  /  ORDER BILL', { size: 8, bold: true, align: 'center', gap: 16 });
  addRule();

  addLine(`ORDER  ${order.number}`, { size: 9, bold: true, color: CHILLI, gap: 13 });
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateText = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(orderDate);
  const timeText = order.time || new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(orderDate);
  addLine(`DATE  ${dateText}   TIME  ${timeText}`, { size: 7.5, gap: 15 });
  addLine(`CUSTOMER  ${order.customerName || 'Guest'}`, { size: 7.5, gap: 14 });
  addLine('KITCHEN', { size: 7, bold: true, color: CHILLI, gap: 11 });
  wrapText(order.kitchen, 32).forEach((line) => addLine(line, { size: 8.5, gap: 12 }));
  addRule();

  addLine('QTY / ITEM', { size: 7, bold: true, gap: 12 });
  (order.items || []).forEach((item) => {
    const itemLines = wrapText(`${item.qty} x ${item.name}`, 23);
    itemLines.forEach((line, index) => addLine(line, {
      size: 8,
      gap: 12,
      ...(index === 0 ? { right: amount(item.price * item.qty) } : {}),
    }));
  });
  addRule();

  const totals = order.totals || {};
  const addTotal = (label, value) => addLine(label, { size: 8, right: value, gap: 13 });
  addTotal('Subtotal', amount(totals.subtotal));
  if (totals.discount > 0) addTotal(`Coupon ${order.coupon || ''}`.trim(), `- ${amount(totals.discount)}`);
  addTotal('Delivery fee', totals.delivery ? amount(totals.delivery) : 'ON US');
  addTotal('GST (5%)', amount(totals.tax));
  addRule();
  addLine('TOTAL PAID / DUE', { size: 8, bold: true, color: CHILLI, right: amount(totals.total), gap: 17 });
  addLine(`PAYMENT  ${order.payment || 'UPI'}`, { size: 7.5, gap: 16 });
  addRule();
  addLine('GOOD FOOD. GOOD PEOPLE. GOOD CALL.', { size: 7, align: 'center', gap: 11 });
  addLine('Thank you for ordering close to home.', { size: 7, align: 'center', color: CHILLI, gap: 10 });

  const pageHeight = top + 22;
  const commands = [];
  const drawText = (entry) => {
    const size = entry.size ?? 9;
    const textWidth = entry.text.length * size * 0.6;
    const x = entry.align === 'center'
      ? (PAGE_WIDTH - textWidth) / 2
      : PAGE_PADDING;
    const y = pageHeight - entry.top - size;
    const font = entry.bold ? 'F2' : 'F1';
    const color = entry.color || INK;
    commands.push(`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(entry.text)}) Tj ET`);
    if (entry.right) {
      const rightText = toAscii(entry.right);
      const rightWidth = rightText.length * size * 0.6;
      const rightX = PAGE_WIDTH - PAGE_PADDING - rightWidth;
      commands.push(`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${rightX.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(rightText)}) Tj ET`);
    }
  };

  rules.forEach((ruleTop) => {
    const y = pageHeight - ruleTop;
    commands.push(`${INK} RG 0.45 w [1 2] 0 d ${PAGE_PADDING} ${y.toFixed(2)} m ${PAGE_WIDTH - PAGE_PADDING} ${y.toFixed(2)} l S [] 0 d`);
  });
  lines.forEach(drawText);

  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n% KHANA RECEIPT\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export function downloadOrderReceipt(order) {
  const blob = new Blob([buildReceiptPdf(order)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `khana-${toAscii(order.number).toLowerCase()}-bill.pdf`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
