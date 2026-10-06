import { calcJobTotals, formatCurrency, formatHours } from './pricing';
import { JOB_TYPES } from '../data/jobTypes';
import { jsPDF } from 'jspdf';

// ---------------------------------------------------------------------------
// buildInvoicePDF — native jsPDF layout, no html2canvas, no screenshots.
// ---------------------------------------------------------------------------
async function buildInvoicePDF(job, settings, invoice, mode, totals) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 40; const MR = 40; const MT = 36; const MB = 36;
  const CW = PW - ML - MR;

  // ── Colours ───────────────────────────────────────────────────────────────
  const RED    = [220, 38,  38 ];
  const GREEN  = [22,  163, 74 ];
  const BLACK  = [17,  17,  17 ];
  const GREY   = [85,  85,  85 ];
  const LTGREY = [230, 230, 230];
  const BGROW  = [250, 250, 250];
  const NOTEBG = [255, 247, 237];
  const NOTEBDR= [254, 215, 170];

  const setFill = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setFont = (size, style = 'normal', rgb = [0,0,0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  let y = MT;
  const BOTTOM_SAFE = PH - MB - 60;

  function checkPage(needed = 20) {
    if (y + needed > BOTTOM_SAFE) { drawFooter(); doc.addPage(); y = MT; }
  }

  function drawFooter() {
    const fy = PH - MB;
    setDraw(LTGREY); doc.setLineWidth(0.5);
    doc.line(ML, fy - 8, PW - MR, fy - 8);
    setFont(8, 'normal', [170,170,170]);
    const cn = settings.companyName || 'Saybrook Electric, LLC.';
    doc.text(cn, ML, fy);
    doc.text('Thank you for your business!', PW / 2, fy, { align: 'center' });
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, PW - MR, fy, { align: 'right' });
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const companyName = settings.companyName || 'Saybrook Electric, LLC.';
  const laborRate   = settings.laborRate || 95;
  const issueDate   = invoice.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const dueDate     = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : new Date(Date.now() + 30*86400000).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  const isMultiScope   = !!(job.scopes && job.scopes.length > 0);
  const allLineDetails = isMultiScope
    ? (calcJobTotals(job, settings).scopeTotals || []).flatMap(s => s.lineDetails || [])
    : (totals.lineDetails || []);

  const deposit     = invoice.deposit || 0;
  const discount    = job.discount || 0;
  const discountAmt = totals.grandTotal * (discount / 100);
  const invoiceTotal = totals.grandTotal - discountAmt;
  const balanceDue  = invoiceTotal - deposit;

  const jobType    = JOB_TYPES.find(t => t.id === job.jobType)?.label || 'Electrical Work';
  const scopeTitle = job.scopeTitle || (isMultiScope
    ? (job.scopes || []).map(s => JOB_TYPES.find(t => t.id === s.jobType)?.label || s.title).join(' + ')
    : jobType);

  // ── LOGO ──────────────────────────────────────────────────────────────────
  let logoRenderedH = 0;
  if (settings.logoBase64) {
    try {
      const maxW = 140; const maxH = 60;
      const fmt = settings.logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
          doc.addImage(settings.logoBase64, fmt, ML, y, img.width * ratio, img.height * ratio);
          logoRenderedH = img.height * ratio;
          resolve();
        };
        img.onerror = resolve;
        img.src = settings.logoBase64;
      });
    } catch(e) {}
  }

  // ── HEADER right: INVOICE label ───────────────────────────────────────────
  const headerRight = ML + CW;
  setFont(28, 'bold', RED);
  doc.text('INVOICE', headerRight, y + 22, { align: 'right' });
  setFont(13, 'bold', BLACK);
  doc.text(invoice.number || '', headerRight, y + 38, { align: 'right' });
  setFont(9, 'normal', GREY);
  doc.text(`Issue Date: ${issueDate}`, headerRight, y + 52, { align: 'right' });
  setFont(9, 'bold', RED);
  doc.text(`Due: ${dueDate}`, headerRight, y + 64, { align: 'right' });
  if (job.qbEstimateNum) {
    setFont(8, 'normal', [136,136,136]);
    doc.text(`Estimate Ref: QB#${job.qbEstimateNum}`, headerRight, y + 76, { align: 'right' });
  }

  // ── Company block left ────────────────────────────────────────────────────
  const logoBottom = y + logoRenderedH + (logoRenderedH > 0 ? 6 : 0);
  let cx = logoBottom + 14;
  setFont(14, 'bold', BLACK);
  doc.text(companyName, ML, cx); cx += 14;
  setFont(9, 'normal', GREY);
  if (settings.companyAddress) { doc.text(settings.companyAddress, ML, cx); cx += 11; }
  if (settings.companyPhone)   { doc.text(settings.companyPhone,   ML, cx); cx += 11; }
  if (settings.companyEmail)   { doc.text(settings.companyEmail,   ML, cx); cx += 11; }
  if (settings.companyLicense) { doc.text(`License #${settings.companyLicense}`, ML, cx); cx += 11; }

  // ── Red rule ──────────────────────────────────────────────────────────────
  y = Math.max(cx, y + 80) + 10;
  setDraw(RED); doc.setLineWidth(3);
  doc.line(ML, y, PW - MR, y);
  y += 14;

  // ── BILLING — two columns ─────────────────────────────────────────────────
  checkPage(70);
  const colW = (CW - 12) / 2;
  function billBox(x, bw, title, lines) {
    setDraw(RED); doc.setLineWidth(3);
    doc.line(x, y, x, y + 56);
    setFont(7, 'bold', [153,153,153]);
    doc.text(title, x + 8, y + 10);
    let by = y + 22;
    lines.forEach((l, i) => {
      if (!l) return;
      setFont(i === 0 ? 10 : 9, i === 0 ? 'bold' : 'normal', i === 0 ? BLACK : GREY);
      doc.text(String(l), x + 8, by); by += 11;
    });
  }
  billBox(ML,              colW, 'BILL TO',      [job.customerName, job.jobAddress, job.customerPhone, job.customerEmail].filter(Boolean));
  billBox(ML + colW + 12,  colW, 'JOB DETAILS',  [scopeTitle, `Job #: ${(job.id||'').slice(-6).toUpperCase()}`, job.jobAddress, job.yearBuilt ? `Built: ${job.yearBuilt}` : ''].filter(Boolean));
  y += 66;

  // ── PAID STAMP — diagonal rubber-stamp watermark ────────────────────────
  if (invoice.paid) {
    checkPage(10);
    // Center the stamp horizontally and place it floating in the gap row
    const stampCX = ML + CW / 2;
    const stampCY = y + 18;

    // Two lines of text rotated 45°, stacked (offset along the rotation axis)
    // "PAID" on top line, "IN FULL" on bottom line — shift along 45° axis
    // Along 45° axis: offset by ~10pt means dx=dy=7 in page coords
    doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('PAID', stampCX - 7, stampCY - 7, { align: 'center', angle: 45 });
    doc.setFontSize(11);
    doc.text('IN FULL', stampCX + 6, stampCY + 6, { align: 'center', angle: 45 });

    // Border rectangle rotated 45° CCW to match jsPDF text angle direction
    const hw = 38; const hh = 20; const ang = -Math.PI / 4;
    const cos45 = Math.cos(ang); const sin45 = Math.sin(ang);
    const rotPt = (dx, dy) => [stampCX + dx*cos45 - dy*sin45, stampCY + dx*sin45 + dy*cos45];
    const corners = [rotPt(-hw,-hh), rotPt(hw,-hh), rotPt(hw,hh), rotPt(-hw,hh)];
    doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.setLineWidth(1.5);
    for (let i = 0; i < 4; i++) {
      const [x1,y1] = corners[i]; const [x2,y2] = corners[(i+1)%4];
      doc.line(x1, y1, x2, y2);
    }

    y += 14;
  }

  // ── SERVICES TABLE ────────────────────────────────────────────────────────
  checkPage(30);
  setFont(7, 'bold', [153,153,153]);
  doc.text('SERVICES RENDERED', ML, y + 8); y += 14;

  function drawTableHeader(cols) {
    setFill(BLACK); doc.rect(ML, y, CW, 16, 'F');
    setFont(7, 'bold', [255,255,255]);
    cols.forEach(c => doc.text(c.label.toUpperCase(), c.x + (c.align==='right' ? c.w : 0), y+11, { align: c.align||'left' }));
    y += 16;
  }
  function drawTableRow(cols, values, rowIndex) {
    const rowH = 18;
    checkPage(rowH + 4);
    if (rowIndex % 2 === 0) { setFill(BGROW); doc.rect(ML, y, CW, rowH, 'F'); }
    setDraw(LTGREY); doc.setLineWidth(0.3);
    doc.line(ML, y+rowH, ML+CW, y+rowH);
    setFont(9, 'normal', BLACK);
    cols.forEach((c, i) => doc.text(String(values[i]??''), c.x+(c.align==='right'?c.w:0), y+13, { align: c.align||'left' }));
    y += rowH;
  }

  if (mode === 'itemized') {
    const cols = [
      { label:'Description', x:ML+4,       w:CW*0.50, align:'left'  },
      { label:'Qty',         x:ML+CW*0.54, w:40,      align:'left'  },
      { label:'Unit',        x:ML+CW*0.66, w:50,      align:'left'  },
      { label:'Amount',      x:ML,         w:CW-4,    align:'right' },
    ];
    drawTableHeader(cols);
    allLineDetails.filter(li=>(li.qty||0)>0).forEach((li,i) =>
      drawTableRow(cols, [li.name, li.qty, li.unit||'each', formatCurrency(li.subtotal)], i));
  } else {
    const cols = [
      { label:'Description', x:ML+4, w:CW*0.75, align:'left'  },
      { label:'Qty',         x:ML+4, w:CW-8,    align:'right' },
    ];
    drawTableHeader(cols);
    allLineDetails.filter(li=>(li.qty||0)>0).forEach((li,i) =>
      drawTableRow(cols, [li.name, `${li.qty} ${li.unit||'each'}`], i));
  }
  y += 10;

  // ── TOTALS ────────────────────────────────────────────────────────────────
  const totW = 220; const totX = PW - MR - totW;
  function totRow(label, value, bold=false, rgb=null) {
    checkPage(18);
    setFont(9, bold?'bold':'normal', rgb||(bold?BLACK:GREY));
    doc.text(label, totX, y+12);
    doc.text(value, PW-MR, y+12, { align:'right' });
    setDraw(LTGREY); doc.setLineWidth(0.3);
    doc.line(totX, y+16, PW-MR, y+16);
    y += 17;
  }

  if (mode === 'itemized') {
    totRow('Material', formatCurrency(totals.totalMaterial));
    totRow(`Labor (${formatHours(totals.totalLaborHrs)} hrs @ $${laborRate}/hr)`, formatCurrency(totals.totalLaborCost));
    if (totals.totalAllIn > 0) totRow('Other Items', formatCurrency(totals.totalAllIn));
    totRow('Subtotal', formatCurrency(totals.subtotal));
    totRow(`Overhead & Profit (${totals.markupPct}%)`, formatCurrency(totals.markupAmt));
  }
  totRow('Invoice Total', formatCurrency(totals.grandTotal), true);
  if (discount > 0) {
    totRow(`Discount (${discount}%)`, `-${formatCurrency(discountAmt)}`, false, [220,38,38]);
    totRow('After Discount', formatCurrency(invoiceTotal), true);
  }
  if (deposit > 0) {
    totRow('Deposit Received', `-${formatCurrency(deposit)}`, false, GREEN);
  }

  // ── Balance due bar ───────────────────────────────────────────────────────
  checkPage(28);
  const barColor = invoice.paid ? GREEN : RED;
  setFill(barColor);
  const barX = totX - 4;
  const barW = (PW - MR) - barX;
  doc.rect(barX, y, barW, 24, 'F');
  setFont(11, 'bold', [255,255,255]);
  doc.text(invoice.paid ? 'PAID IN FULL' : 'BALANCE DUE', totX, y+16);
  doc.text(formatCurrency(invoice.paid ? 0 : balanceDue), PW-MR, y+16, { align:'right' });
  y += 34;

  // ── Paid confirmation ─────────────────────────────────────────────────────
  if (invoice.paid && invoice.paidAt) {
    checkPage(16);
    setFont(9, 'bold', GREEN);
    const paidStr = `Paid on ${new Date(invoice.paidAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`;
    doc.text(paidStr, ML, y+10);
    y += 18;
  }

  // ── Payment info box (unpaid only) ────────────────────────────────────────
  if (!invoice.paid) {
    checkPage(50);
    setFill(NOTEBG); setDraw(NOTEBDR); doc.setLineWidth(0.5);
    const payLines = [];
    if (settings.companyPhone) payLines.push(`Call: ${settings.companyPhone}`);
    if (settings.companyEmail) payLines.push(`Email: ${settings.companyEmail}`);
    const payH = 24 + payLines.length * 12;
    doc.roundedRect(ML, y, CW, payH, 3, 3, 'FD');
    setFont(9, 'bold', [146,64,14]);
    doc.text(`Payment due by ${dueDate}`, ML+8, y+14);
    payLines.forEach((l, i) => {
      setFont(8, 'normal', [146,64,14]);
      doc.text(l, ML+8, y+26 + i*12);
    });
    y += payH + 12;
  }

  // ── NOTES ─────────────────────────────────────────────────────────────────
  if (job.notes) {
    checkPage(40);
    const noteLines = doc.splitTextToSize(job.notes, CW - 24);
    const noteH = noteLines.length * 12 + 22;
    setFill(NOTEBG); setDraw(NOTEBDR); doc.setLineWidth(0.5);
    doc.roundedRect(ML, y, CW, noteH, 3, 3, 'FD');
    setFont(9, 'bold', [146,64,14]);
    doc.text('Notes:', ML+8, y+14);
    setFont(9, 'normal', [146,64,14]);
    doc.text(noteLines, ML+8, y+26);
    y += noteH + 10;
  }

  drawFooter();
  return doc;
}

// ---------------------------------------------------------------------------
// generateInvoicePDF — entry point called from InvoicePage / JobDetail
// ---------------------------------------------------------------------------
export function generateInvoicePDF(job, settings, invoice, mode = 'summary') {
  const totals = calcJobTotals(job, settings);

  const customerName = (job.customerName || 'Customer')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .replace(/\s+/g, '-');
  const fileName = `Invoice-${invoice.number || customerName}.pdf`;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  // Remove any stale overlay
  let overlay = document.getElementById('sbk-pdf-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'sbk-pdf-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9998',
    'background:#111', 'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center', 'gap:20px', 'padding:32px',
  ].join(';');

  // ── iOS / PWA standalone — show share sheet ───────────────────────────────
  if (isIOS || isStandalone) {
    overlay.innerHTML = `
      <div style="color:#dc2626;font-size:48px;">🧾</div>
      <p style="color:#fff;font-size:18px;font-weight:900;text-align:center;">Invoice Ready</p>
      <p style="color:#888;font-size:14px;text-align:center;">${job.customerName || 'Customer'}</p>
    `;
    document.body.appendChild(overlay);

    const toolbar = document.createElement('div');
    toolbar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
      'background:#111', 'padding:12px 16px', 'display:flex', 'gap:12px',
      'box-shadow:0 -2px 12px rgba(0,0,0,0.5)',
    ].join(';');

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = 'flex:1;background:#333;color:#fff;font-weight:700;font-size:15px;border:none;border-radius:10px;padding:14px;cursor:pointer;';
    backBtn.onclick = () => { overlay.remove(); toolbar.remove(); };

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '⬆ Save / Share PDF';
    saveBtn.style.cssText = 'flex:2;background:#dc2626;color:#fff;font-weight:900;font-size:15px;border:none;border-radius:10px;padding:14px;cursor:pointer;';

    saveBtn.onclick = async () => {
      saveBtn.textContent = 'Generating PDF…';
      saveBtn.disabled = true;
      try {
        const doc = await buildInvoicePDF(job, settings, invoice, mode, totals);
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({ files: [pdfFile] });
        } else {
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url; a.download = fileName; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
      } catch (err) {
        console.error('Invoice PDF error:', err);
        alert('Could not generate PDF: ' + err.message);
      }
      saveBtn.textContent = '⬆ Save / Share PDF';
      saveBtn.disabled = false;
    };

    toolbar.appendChild(backBtn);
    toolbar.appendChild(saveBtn);
    document.body.appendChild(toolbar);

  // ── Desktop — direct download ──────────────────────────────────────────────
  } else {
    overlay.innerHTML = `
      <div style="color:#dc2626;font-size:40px;">🧾</div>
      <p style="color:#fff;font-size:17px;font-weight:700;">Generating PDF…</p>
    `;
    document.body.appendChild(overlay);

    (async () => {
      try {
        const doc = await buildInvoicePDF(job, settings, invoice, mode, totals);
        doc.save(fileName);
      } catch (err) {
        console.error('Invoice PDF error:', err);
        alert('Could not generate PDF: ' + err.message);
      }
      overlay.remove();
    })();
  }
}
