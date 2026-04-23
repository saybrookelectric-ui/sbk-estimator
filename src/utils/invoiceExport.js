import { calcJobTotals, formatCurrency, formatHours } from './pricing';
import { JOB_TYPES } from '../data/jobTypes';

export function generateInvoicePDF(job, settings, invoice) {
  const totals = calcJobTotals(job, settings);
  const companyName = settings.companyName || 'Saybrook Electric, LLC.';
  const laborRate = settings.laborRate || 95;
  const issueDate = invoice.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const isMultiScope = !!(job.scopes && job.scopes.length > 0);
  const allLineDetails = isMultiScope
    ? (calcJobTotals(job, settings).scopeTotals || []).flatMap(s => s.lineDetails || [])
    : (totals.lineDetails || []);

  const deposit = invoice.deposit || 0;
  const balanceDue = totals.grandTotal - deposit;

  const jobType = JOB_TYPES.find(t => t.id === job.jobType)?.label || 'Electrical Work';
  const scopeTitle = job.scopeTitle || (isMultiScope
    ? (job.scopes || []).map(s => JOB_TYPES.find(t => t.id === s.jobType)?.label || s.title).join(' + ')
    : jobType);

  const lineRows = allLineDetails.filter(li => (li.qty || 0) > 0).map((li, i) => `
    <tr style="background:${i % 2 === 0 ? '#fafafa' : 'white'}">
      <td style="padding:8px 10px;border-bottom:1px solid #eee;">${li.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${li.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${li.unit || 'each'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(li.subtotal)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${invoice.number} — ${job.customerName || 'Customer'}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1a1a1a; padding:40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; border-bottom:4px solid #dc2626; padding-bottom:20px; }
  .co h1 { font-size:22px; font-weight:900; color:#000; letter-spacing:-0.5px; }
  .co p { color:#555; font-size:12px; margin-top:2px; }
  .meta { text-align:right; }
  .meta h2 { font-size:36px; font-weight:900; color:#dc2626; letter-spacing:-1px; }
  .meta .inv-num { font-size:16px; font-weight:700; color:#333; margin-top:2px; }
  .meta p { font-size:12px; color:#555; margin-top:2px; }
  .meta .due { font-size:13px; font-weight:700; color:#dc2626; margin-top:4px; }
  .billing { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:22px; }
  .bill-box { background:#f9f9f9; border-left:4px solid #dc2626; padding:12px 16px; }
  .bill-box h3 { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#999; margin-bottom:6px; }
  .bill-box p { font-size:13px; font-weight:600; }
  .bill-box .sub { font-weight:400; color:#555; font-size:12px; margin-top:1px; }
  .section-title { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#999; margin:20px 0 8px; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  th { background:#111; color:white; padding:7px 10px; text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.06em; }
  .totals { margin-left:auto; width:320px; }
  .totals td { padding:6px 10px; font-size:13px; border-bottom:1px solid #f0f0f0; }
  .totals td:last-child { text-align:right; }
  .deposit-row td { color:#16a34a; }
  .balance { background:#dc2626; }
  .balance td { color:white !important; font-size:18px; font-weight:900; padding:12px 10px; border:none; }
  .paid-stamp { text-align:center; margin:20px 0; }
  .paid-stamp span { display:inline-block; border:4px solid #16a34a; color:#16a34a; font-size:32px; font-weight:900; padding:8px 24px; border-radius:4px; transform:rotate(-5deg); opacity:0.6; letter-spacing:4px; }
  .notes-box { background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; padding:10px 14px; font-size:11px; color:#92400e; margin-top:12px; }
  .footer-note { margin-top:20px; font-size:11px; color:#888; text-align:center; border-top:1px solid #eee; padding-top:12px; }
  .back-btn { display:none; }
  @media print { body { padding:20px; } .back-btn,.print-btn { display:none !important; } }
  @media screen {
    .back-btn { display:block; position:fixed; top:12px; left:12px; background:#dc2626; color:white; font-weight:900; font-size:13px; border:none; border-radius:8px; padding:8px 16px; cursor:pointer; z-index:999; box-shadow:0 2px 8px rgba(0,0,0,0.3); }
    .print-btn { display:block; position:fixed; top:12px; right:12px; background:#111; color:white; font-weight:900; font-size:13px; border:1px solid #444; border-radius:8px; padding:8px 16px; cursor:pointer; z-index:999; }
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
    <h2>INVOICE</h2>
    <p class="inv-num">${invoice.number}</p>
    <p>Issue Date: ${issueDate}</p>
    <p class="due">Due: ${dueDate}</p>
    ${job.qbEstimateNum ? `<p style="margin-top:4px;font-size:11px;color:#888;">Estimate Ref: QB#${job.qbEstimateNum}</p>` : ''}
  </div>
</div>

<div class="billing">
  <div class="bill-box">
    <h3>Bill To</h3>
    <p>${job.customerName || '—'}</p>
    <p class="sub">${job.jobAddress || ''}</p>
    ${job.customerPhone ? `<p class="sub">${job.customerPhone}</p>` : ''}
    ${job.customerEmail ? `<p class="sub">${job.customerEmail}</p>` : ''}
  </div>
  <div class="bill-box">
    <h3>Job Details</h3>
    <p>${scopeTitle}</p>
    <p class="sub">Job #: ${job.id?.slice(-6).toUpperCase() || '—'}</p>
    ${job.jobAddress ? `<p class="sub">${job.jobAddress}</p>` : ''}
    ${job.yearBuilt ? `<p class="sub">Built: ${job.yearBuilt}</p>` : ''}
  </div>
</div>

${invoice.paid ? '<div class="paid-stamp"><span>PAID</span></div>' : ''}

<div class="section-title">Services Rendered</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:center">Unit</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${lineRows}</tbody>
</table>

<table class="totals">
  <tbody>
    <tr><td>Material</td><td>${formatCurrency(totals.totalMaterial)}</td></tr>
    <tr><td>Labor (${formatHours(totals.totalLaborHrs)} @ $${laborRate}/hr)</td><td>${formatCurrency(totals.totalLaborCost)}</td></tr>
    ${totals.totalAllIn > 0 ? `<tr><td>Other Items</td><td>${formatCurrency(totals.totalAllIn)}</td></tr>` : ''}
    <tr><td style="border-top:2px solid #eee;padding-top:10px">Subtotal</td><td style="border-top:2px solid #eee;padding-top:10px">${formatCurrency(totals.subtotal)}</td></tr>
    <tr><td>Overhead & Profit (${totals.markupPct}%)</td><td>${formatCurrency(totals.markupAmt)}</td></tr>
    <tr style="font-weight:700"><td>Invoice Total</td><td>${formatCurrency(totals.grandTotal)}</td></tr>
    ${deposit > 0 ? `<tr class="deposit-row"><td>Deposit Received</td><td>-${formatCurrency(deposit)}</td></tr>` : ''}
    <tr class="balance"><td>BALANCE DUE</td><td>${formatCurrency(balanceDue)}</td></tr>
  </tbody>
</table>

${invoice.paid ? `
<div style="text-align:right;margin-top:8px;">
  <span style="color:#16a34a;font-weight:700;font-size:13px;">✓ Paid ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : ''}</span>
</div>` : `
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:12px 16px;margin-top:12px;">
  <p style="font-size:12px;font-weight:700;color:#92400e;">Payment Due: ${dueDate}</p>
  ${settings.companyPhone ? `<p style="font-size:11px;color:#92400e;margin-top:2px;">Questions? Call us at ${settings.companyPhone}</p>` : ''}
  ${settings.companyEmail ? `<p style="font-size:11px;color:#92400e;">or email ${settings.companyEmail}</p>` : ''}
</div>`}

${job.notes ? `<div class="notes-box"><strong>Notes:</strong> ${job.notes}</div>` : ''}

<p class="footer-note">${companyName} · Thank you for your business!</p>
</body>
</html>`;

  // iOS/standalone: overlay iframe; desktop: new tab
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS || isStandalone) {
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
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back to Estimator';
    backBtn.style.cssText = `position:fixed;top:12px;left:12px;z-index:10000;background:#dc2626;color:white;font-weight:900;font-size:13px;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.4);`;
    backBtn.onclick = () => { overlay.remove(); backBtn.remove(); };
    document.body.appendChild(backBtn);
  } else {
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
  }
}
