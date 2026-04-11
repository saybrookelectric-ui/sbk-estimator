import { calcJobTotals, formatCurrency, formatHours } from './pricing';
import { JOB_TYPES } from '../data/jobTypes';

function buildHTML(job, settings, mode, totals) {
  const companyName = settings.companyName || 'Saybrook Electric, LLC.';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isMultiScope = totals.isMultiScope;

  // Collect all line items — flattened across scopes if multi-scope
  const allLineDetails = isMultiScope
    ? totals.scopeTotals.flatMap(s => s.lineDetails || [])
    : (totals.lineDetails || []);

  const jobType = JOB_TYPES.find(t => t.id === job.jobType)?.label || job.jobType || 'Electrical Work';
  const scopeTitle = job.scopeTitle || (isMultiScope
    ? (job.scopes || []).map(s => JOB_TYPES.find(t => t.id === s.jobType)?.label || s.title).join(' + ')
    : jobType);

  const laborRate = settings.laborRate || 95;

  // ── Scope sections for itemized multi-scope ──
  const scopeSections = isMultiScope && mode === 'itemized'
    ? totals.scopeTotals.map(s => {
        const jt = JOB_TYPES.find(t => t.id === s.jobType);
        const rows = (s.lineDetails || []).filter(li => (li.qty || 0) > 0).map((li, i) => `
          <tr style="background:${i % 2 === 0 ? '#fafafa' : 'white'}">
            <td style="padding:7px 10px;border-bottom:1px solid #eee;">${li.name}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;">${li.qty}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;">${li.unit || 'each'}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(li.subtotal)}</td>
          </tr>`).join('');
        return `
          <div class="section-title">${jt?.icon || ''} ${s.title || jt?.label || 'Scope'}</div>
          <table>
            <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:center">Unit</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <table class="totals" style="margin-bottom:24px;">
            <tbody>
              <tr><td style="color:#555">Scope subtotal</td><td style="text-align:right;font-weight:700">${formatCurrency(s.subtotal)}</td></tr>
            </tbody>
          </table>`;
      }).join('')
    : '';

  // ── Single scope itemized rows ──
  const singleItemizedRows = !isMultiScope && mode === 'itemized'
    ? allLineDetails.filter(li => (li.qty || 0) > 0).map((li, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafafa' : 'white'}">
        <td style="padding:7px 10px;border-bottom:1px solid #eee;">${li.name}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;">${li.qty}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;">${li.unit || 'each'}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(li.subtotal)}</td>
      </tr>`).join('')
    : '';

  // ── Summary rows (names + qty, no prices) ──
  const summaryRows = allLineDetails.filter(li => (li.qty || 0) > 0).map((li, i) => `
    <tr style="background:${i % 2 === 0 ? '#fafafa' : 'white'}">
      <td style="padding:7px 10px;border-bottom:1px solid #eee;">${li.name}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;">${li.qty} ${li.unit || 'each'}</td>
    </tr>`).join('');

  const signatureBlock = job.signature ? `
    <div style="margin-top:32px;border-top:2px solid #f59e0b;padding-top:20px;">
      <p style="font-size:11px;color:#888;margin-bottom:8px;">Customer Approval Signature</p>
      <img src="${job.signature}" style="max-height:80px;border:1px solid #ddd;border-radius:4px;padding:4px;background:white;">
      <p style="font-size:11px;color:#555;margin-top:6px;">Signed: ${job.signedAt ? new Date(job.signedAt).toLocaleString() : ''}</p>
    </div>` : `
    <div style="margin-top:32px;border-top:1px solid #eee;padding-top:16px;display:flex;justify-content:space-between;">
      <span style="font-size:11px;color:#888;">Customer Signature: _______________________________</span>
      <span style="font-size:11px;color:#888;">Date: ___________</span>
    </div>`;

  // ── Totals table ──
  const totalsTable = `
    <table class="totals">
      <tbody>
        ${mode === 'itemized' ? `
        <tr><td style="color:#555">Material</td><td style="text-align:right">${formatCurrency(totals.totalMaterial)}</td></tr>
        <tr><td style="color:#555">Labor (${formatHours(totals.totalLaborHrs)} @ $${laborRate}/hr)</td><td style="text-align:right">${formatCurrency(totals.totalLaborCost)}</td></tr>
        ${totals.totalAllIn > 0 ? `<tr><td style="color:#555">Other Items</td><td style="text-align:right">${formatCurrency(totals.totalAllIn)}</td></tr>` : ''}
        <tr><td style="color:#555;border-top:1px solid #eee;padding-top:8px">Subtotal</td><td style="text-align:right;border-top:1px solid #eee;padding-top:8px">${formatCurrency(totals.subtotal)}</td></tr>
        <tr><td style="color:#555">Overhead & Profit (${totals.markupPct}%)</td><td style="text-align:right">${formatCurrency(totals.markupAmt)}</td></tr>
        ` : ''}
        <tr class="grand"><td>TOTAL ESTIMATE</td><td style="text-align:right">${formatCurrency(totals.grandTotal)}</td></tr>
      </tbody>
    </table>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Estimate — ${job.customerName || 'Customer'}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1a1a1a; padding:40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; border-bottom:4px solid #f59e0b; padding-bottom:20px; }
  .co h1 { font-size:22px; font-weight:900; color:#000; letter-spacing:-0.5px; }
  .co p { color:#555; font-size:12px; margin-top:2px; }
  .meta { text-align:right; }
  .meta h2 { font-size:30px; font-weight:900; color:#f59e0b; letter-spacing:-1px; }
  .meta p { font-size:12px; color:#555; }
  .customer { background:#f9f9f9; border-left:4px solid #f59e0b; padding:12px 16px; margin-bottom:22px; }
  .customer h3 { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#999; margin-bottom:4px; }
  .customer p { font-size:13px; font-weight:600; }
  .customer .sub { font-weight:400; color:#555; font-size:12px; }
  .section-title { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#999; margin:20px 0 8px; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  th { background:#111; color:#f59e0b; padding:7px 10px; text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.06em; }
  .totals { margin-left:auto; width:300px; }
  .totals td { padding:5px 10px; font-size:13px; }
  .grand { background:#111; }
  .grand td { color:#f59e0b !important; font-size:16px; font-weight:900; padding:10px; }
  .validity { font-size:11px; color:#888; margin-top:12px; }
  .notes-box { background:#fffbeb; border:1px solid #fde68a; border-radius:4px; padding:10px 14px; font-size:11px; color:#78350f; margin-top:16px; }
  .back-btn { display:none; }
  @media print {
    body { padding:20px; }
    .back-btn { display:none !important; }
  }
  @media screen {
    .back-btn {
      display:block;
      position:fixed;
      top:12px;
      left:12px;
      background:#f59e0b;
      color:#000;
      font-weight:900;
      font-size:13px;
      border:none;
      border-radius:8px;
      padding:8px 16px;
      cursor:pointer;
      z-index:999;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    }
    .print-btn {
      display:block;
      position:fixed;
      top:12px;
      right:12px;
      background:#111;
      color:#f59e0b;
      font-weight:900;
      font-size:13px;
      border:1px solid #f59e0b;
      border-radius:8px;
      padding:8px 16px;
      cursor:pointer;
      z-index:999;
    }
    body { padding-top:56px; }
  }
</style>
</head>
<body>
<button class="back-btn" onclick="window.close()">← Back</button>
<button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>

<div class="header">
  <div class="co">
    ${settings.logoBase64 ? `<img src="${settings.logoBase64}" style="max-height:60px;max-width:200px;object-fit:contain;margin-bottom:6px;display:block;">` : ''}
    <h1>${companyName}</h1>
    ${settings.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
    ${settings.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
    ${settings.companyEmail ? `<p>${settings.companyEmail}</p>` : ''}
    ${settings.companyLicense ? `<p>License #${settings.companyLicense}</p>` : ''}
  </div>
  <div class="meta">
    <h2>ESTIMATE</h2>
    <p>Date: ${date}</p>
    <p>Job #: ${job.id?.slice(-6).toUpperCase()}</p>
    <p style="margin-top:4px;font-weight:700;color:#333">${scopeTitle}</p>
  </div>
</div>

<div class="customer">
  <h3>Prepared For</h3>
  <p>${job.customerName || '—'}</p>
  <p class="sub">${job.jobAddress || ''}</p>
  ${job.customerPhone ? `<p class="sub">${job.customerPhone}</p>` : ''}
  ${job.customerEmail ? `<p class="sub">${job.customerEmail}</p>` : ''}
</div>

${isMultiScope && mode === 'itemized'
  ? scopeSections
  : mode === 'itemized'
    ? `<div class="section-title">Line Items</div>
       <table>
         <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:center">Unit</th><th style="text-align:right">Amount</th></tr></thead>
         <tbody>${singleItemizedRows}</tbody>
       </table>`
    : `<div class="section-title">Scope of Work — ${scopeTitle}</div>
       <table>
         <thead><tr><th>Item</th><th>Qty</th></tr></thead>
         <tbody>${summaryRows}</tbody>
       </table>`
}

${totalsTable}

<p class="validity">This estimate is valid for 30 days from the date above. All work performed to NEC 2023 standards and applicable local codes. Permit fees included where noted.</p>

${job.notes ? `<div class="notes-box"><strong>Notes:</strong> ${job.notes}</div>` : ''}

${signatureBlock}

<div style="margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#aaa;display:flex;justify-content:space-between;">
  <span>${companyName}</span>
  <span>Generated by SBK Estimator</span>
</div>
</body>
</html>`;
}

export function generateQuotePDF(job, settings, mode = 'summary') {
  const totals = calcJobTotals(job, settings);
  const html = buildHTML(job, settings, mode, totals);

  // iOS Safari doesn't support window.open reliably in PWA/standalone mode.
  // Write into a full-screen overlay instead, with a back button to close it.
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS || isStandalone) {
    // Inject an iframe overlay into the current page
    let overlay = document.getElementById('sbk-pdf-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'sbk-pdf-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:white;';

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.srcdoc = html;

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    // The "← Back" button inside the iframe calls window.close() which won't work
    // in an iframe — so we listen for a message from inside, or just add our own
    // back button outside the iframe as a fallback
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back to Estimator';
    backBtn.style.cssText = `
      position:fixed;top:12px;left:12px;z-index:10000;
      background:#f59e0b;color:#000;font-weight:900;font-size:13px;
      border:none;border-radius:8px;padding:8px 16px;cursor:pointer;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);`;
    backBtn.onclick = () => { overlay.remove(); backBtn.remove(); };
    document.body.appendChild(backBtn);
  } else {
    // Desktop / Android: open new tab as before
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  }
}
