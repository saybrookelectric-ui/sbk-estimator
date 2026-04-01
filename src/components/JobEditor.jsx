import { useState } from 'react';
import { JOB_TYPES, WALL_TYPES, ACCESS_TYPES } from '../data/jobTypes';
import { calcJobTotals, formatCurrency, formatHours } from '../utils/pricing';
import { generateQuotePDF } from '../utils/pdfExport';
import { pushEstimateToQB, exportEstimateCSV, isQBConnected, hasRefreshToken } from '../utils/quickbooks';
import { CustomerPicker } from './CustomerDB';
import AssemblyBuilder from './AssemblyBuilder';
import SignaturePad from './SignaturePad';
import { Input, Select, Textarea, SectionLabel, YellowBtn, GhostBtn, StatusBadge, Card } from './UI';

const TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'items', label: 'Line Items' },
  { id: 'quote', label: 'Quote' },
];

function QBExportPanel({ job, totals, settings, onUpdate }) {
  const [qbStatus, setQbStatus] = useState('idle'); // idle | pushing | success | error
  const [qbMessage, setQbMessage] = useState('');
  const connected = isQBConnected() || hasRefreshToken();

  const handlePushToQB = async () => {
    setQbStatus('pushing');
    setQbMessage('');
    try {
      const { estimateNum } = await pushEstimateToQB(job, totals, settings);
      setQbStatus('success');
      setQbMessage(`Estimate #${estimateNum || '—'} created in QuickBooks`);
      onUpdate({ qbEstimateNum: estimateNum, qbSyncedAt: new Date().toISOString() });
    } catch (e) {
      setQbStatus('error');
      setQbMessage(e.message);
    }
  };

  const handleCSV = () => exportEstimateCSV(job, totals, settings);

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
      <SectionLabel>Export to QuickBooks</SectionLabel>

      {connected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            Connected to QuickBooks Online
          </div>
          {job.qbEstimateNum && (
            <p className="text-xs text-[#555]">Last synced: QB Estimate #{job.qbEstimateNum} · {job.qbSyncedAt ? new Date(job.qbSyncedAt).toLocaleDateString() : ''}</p>
          )}
          <button
            onClick={handlePushToQB}
            disabled={qbStatus === 'pushing'}
            className="w-full bg-[#2CA01C] hover:bg-[#25881a] disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {qbStatus === 'pushing' ? (
              <><span className="animate-spin">⟳</span> Pushing to QuickBooks...</>
            ) : (
              <><span>📊</span> {job.qbEstimateNum ? 'Re-push to QuickBooks' : 'Push Estimate to QuickBooks'}</>
            )}
          </button>
          {qbStatus === 'success' && (
            <p className="text-xs text-green-400 text-center">✓ {qbMessage}</p>
          )}
          {qbStatus === 'error' && (
            <p className="text-xs text-red-400 text-center">✗ {qbMessage}</p>
          )}
        </div>
      ) : (
        <div className="text-center py-3">
          <p className="text-xs text-[#444] mb-2">QuickBooks not connected — go to Settings → QuickBooks to connect.</p>
          <div className="w-full border border-dashed border-[#1a1a1a] rounded-lg py-3 text-[#333] text-xs">
            📊 Push to QuickBooks (requires connection)
          </div>
        </div>
      )}

      <div className="border-t border-[#1a1a1a] pt-3">
        <button
          onClick={handleCSV}
          className="w-full border border-[#222] hover:border-[#444] text-[#A7A5A6] hover:text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          ⬇ Export CSV (for manual QB import)
        </button>
      </div>
    </div>
  );
}

export default function JobEditor({ job, customers, settings, onUpdate, onBack, onCreateCustomer }) {
  const [tab, setTab] = useState('setup');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const upd = (updates) => {
    const next = { ...job, ...updates };
    const totals = calcJobTotals(next, settings);
    onUpdate(job.id, { ...next, grandTotal: totals.grandTotal });
  };

  const jt = JOB_TYPES.find(t => t.id === job.jobType);
  const totals = calcJobTotals(job, settings);
  const displayMode = job.quoteDisplayMode || 'summary';

  const handleCustomerSelect = (customer) => {
    if (customer.isNew) onCreateCustomer(customer);
    upd({
      customerId: customer.id,
      customerName: customer.name,
      jobAddress: customer.address || job.jobAddress,
      customerPhone: customer.phone || job.customerPhone,
      customerEmail: customer.email || job.customerEmail,
    });
    setShowCustomerPicker(false);
  };

  const handleSign = (dataUrl) => {
    upd({ signature: dataUrl, signedAt: new Date().toISOString(), status: 'signed' });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {showSignature && (
        <SignaturePad
          job={{ ...job, grandTotal: totals.grandTotal }}
          onSign={handleSign}
          onClose={() => setShowSignature(false)}
        />
      )}

      {/* Top bar */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button onClick={onBack} className="text-[#444] hover:text-[#f59e0b] text-sm transition-colors">← Jobs</button>
            <div className="h-4 w-px bg-[#1a1a1a]" />
            <div className="text-xl mr-1">{jt?.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{job.customerName || 'New Job'}</p>
              <p className="text-xs text-[#444] truncate">{jt?.label}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={job.status || 'draft'} />
              {totals.grandTotal > 0 && (
                <span className="condensed text-lg font-black text-[#f59e0b]">{formatCurrency(totals.grandTotal)}</span>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.id ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-transparent text-[#444] hover:text-[#A7A5A6]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* SETUP TAB */}
        {tab === 'setup' && (
          <div className="space-y-7">
            {/* Customer */}
            <section>
              <SectionLabel>Customer</SectionLabel>
              {showCustomerPicker ? (
                <CustomerPicker
                  customers={customers}
                  onSelect={handleCustomerSelect}
                  onBack={() => setShowCustomerPicker(false)}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        label="Customer Name"
                        value={job.customerName}
                        onChange={v => upd({ customerName: v })}
                        placeholder="John & Jane Smith"
                      />
                    </div>
                    <div className="pt-6">
                      <button
                        onClick={() => setShowCustomerPicker(true)}
                        className="text-xs text-[#f59e0b] border border-[#f59e0b]/30 px-3 py-2.5 rounded-lg hover:bg-[#f59e0b]/10 whitespace-nowrap transition-colors"
                      >
                        From DB
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Address" value={job.jobAddress} onChange={v => upd({ jobAddress: v })} placeholder="123 Main St" className="col-span-2" />
                    <Input label="Phone" value={job.customerPhone} onChange={v => upd({ customerPhone: v })} placeholder="(440) 555-0100" />
                    <Input label="Email" value={job.customerEmail} onChange={v => upd({ customerEmail: v })} placeholder="customer@email.com" />
                  </div>
                </div>
              )}
            </section>

            {/* Job details */}
            <section>
              <SectionLabel>Job Details</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Scope / Title"
                  value={job.scopeTitle}
                  onChange={v => upd({ scopeTitle: v })}
                  placeholder={jt?.label}
                  hint="Appears on quote header"
                  className="col-span-2"
                />
                <Select
                  label="Status"
                  value={job.status || 'draft'}
                  onChange={v => upd({ status: v })}
                  options={['draft','sent','approved','signed','declined','complete'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
                <Input
                  label="Year Built"
                  type="number"
                  value={job.yearBuilt}
                  onChange={v => upd({ yearBuilt: v })}
                  placeholder="1968"
                />
              </div>
            </section>

            {/* Labor variables — only relevant for complex jobs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Labor Difficulty</SectionLabel>
                <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-1.5">
                  <span className="text-xs text-[#555]">Multiplier:</span>
                  <span className={`text-sm font-black ${(job.laborMultiplier||1) > 1.3 ? 'text-red-400' : (job.laborMultiplier||1) > 1.1 ? 'text-[#f59e0b]' : 'text-green-400'}`}>
                    {(job.laborMultiplier || 1.0).toFixed(2)}×
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A7A5A6] uppercase tracking-wider mb-2">Wall Construction</label>
                  <div className="space-y-1">
                    {WALL_TYPES.map(wt => (
                      <button
                        key={wt.id}
                        onClick={() => { const am = job.accessMultiplier || 1.0; upd({ wallType: wt.id, wallTypeMultiplier: wt.multiplier, laborMultiplier: wt.multiplier * am }); }}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                          job.wallType === wt.id ? 'border-[#f59e0b] bg-[#f59e0b]/5 text-[#f59e0b]' : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#A7A5A6] hover:border-[#2a2a2a]'
                        }`}
                      >
                        <span className="font-medium">{wt.label}</span>
                        <span className="text-xs text-[#444] ml-2">{wt.multiplier}×</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A7A5A6] uppercase tracking-wider mb-2">Access</label>
                  <div className="space-y-1">
                    {ACCESS_TYPES.map(at => (
                      <button
                        key={at.id}
                        onClick={() => { const wm = job.wallTypeMultiplier || 1.0; upd({ accessType: at.id, accessMultiplier: at.multiplier, laborMultiplier: wm * at.multiplier }); }}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                          job.accessType === at.id ? 'border-[#f59e0b] bg-[#f59e0b]/5 text-[#f59e0b]' : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#A7A5A6] hover:border-[#2a2a2a]'
                        }`}
                      >
                        <span className="font-medium">{at.label}</span>
                        <span className="text-xs text-[#444] ml-2">{at.multiplier}×</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <Textarea
                label="Job Notes"
                value={job.notes}
                onChange={v => upd({ notes: v })}
                placeholder="Conditions, customer requests, access notes, subcontractor needs..."
                rows={4}
              />
            </section>
          </div>
        )}

        {/* LINE ITEMS TAB */}
        {tab === 'items' && (
          <AssemblyBuilder job={job} onChange={(updated) => upd(updated)} settings={settings} />
        )}

        {/* QUOTE TAB */}
        {tab === 'quote' && (
          <div className="space-y-5">
            {/* Totals breakdown */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Material</span>
                  <span className="text-white font-semibold">{formatCurrency(totals.totalMaterial)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Labor ({formatHours(totals.totalLaborHrs)} @ ${settings.laborRate || 95}/hr)</span>
                  <span className="text-white font-semibold">{formatCurrency(totals.totalLaborCost)}</span>
                </div>
                {totals.totalAllIn > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#555]">All-In Items</span>
                    <span className="text-white font-semibold">{formatCurrency(totals.totalAllIn)}</span>
                  </div>
                )}
                {totals.multiplier > 1.01 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#444]">Labor multiplier active ({totals.multiplier.toFixed(2)}×)</span>
                  </div>
                )}
                <div className="border-t border-[#1a1a1a] pt-2.5 flex justify-between text-sm">
                  <span className="text-[#555]">Subtotal</span>
                  <span className="text-white font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Overhead & Profit ({totals.markupPct}%)</span>
                  <span className="text-white font-semibold">{formatCurrency(totals.markupAmt)}</span>
                </div>
              </div>
              <div className="bg-[#f59e0b] px-4 py-4 flex justify-between items-center">
                <span className="condensed text-xl font-black text-black">TOTAL ESTIMATE</span>
                <span className="condensed text-3xl font-black text-black">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            {/* Internal numbers */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
              <SectionLabel>Internal — Your Numbers</SectionLabel>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-[#444]">Total labor hours</span><span className="font-mono text-[#A7A5A6]">{formatHours(totals.totalLaborHrs)}</span></div>
                <div className="flex justify-between"><span className="text-[#444]">Material cost</span><span className="font-mono text-[#A7A5A6]">{formatCurrency(totals.totalMaterial)}</span></div>
                <div className="flex justify-between border-t border-[#1a1a1a] pt-1.5"><span className="text-[#444]">Markup earned</span><span className="font-mono text-green-400 font-bold">{formatCurrency(totals.markupAmt)}</span></div>
              </div>
            </div>

            {/* Quote format & export */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
              <SectionLabel>Quote Format</SectionLabel>
              <div className="flex gap-2">
                {[{ id: 'summary', label: 'Summary' }, { id: 'itemized', label: 'Itemized' }].map(m => (
                  <button
                    key={m.id}
                    onClick={() => upd({ quoteDisplayMode: m.id })}
                    className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                      displayMode === m.id ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]' : 'border-[#222] text-[#555] hover:border-[#333]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <YellowBtn
                onClick={() => generateQuotePDF(job, settings, displayMode)}
                className="w-full"
              >
                📄 Print / Save Quote ({displayMode})
              </YellowBtn>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Estimate — ${job.scopeTitle || job.jobType || 'Electrical Work'} — ${job.customerName || ''}`);
                  const company = settings.companyName || 'Saybrook Electric, LLC.';
                  const total = formatCurrency(totals.grandTotal);
                  const body = encodeURIComponent(
`Hi ${job.customerName || 'there'},

Please find attached your estimate for ${job.scopeTitle || job.jobType || 'electrical work'} at ${job.jobAddress || 'your property'}.

Estimate Total: ${total}
Valid for 30 days from today.

To approve this estimate, please sign and return or reply to this email.

Thank you for choosing ${company}. Please don't hesitate to reach out with any questions.

${settings.companyPhone ? `Phone: ${settings.companyPhone}` : ''}
${settings.companyEmail ? `Email: ${settings.companyEmail}` : ''}
${settings.companyLicense ? `License #${settings.companyLicense}` : ''}
`);
                  const to = job.customerEmail ? encodeURIComponent(job.customerEmail) : '';
                  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
                }}
                className="w-full border border-[#333] hover:border-[#f59e0b]/50 text-[#A7A5A6] hover:text-[#f59e0b] font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                ✉ Send Quote via Email
              </button>
              <p className="text-xs text-[#444] text-center">Opens your mail app pre-filled — attach the saved PDF before sending</p>
            </div>

            {/* QuickBooks + CSV export */}
            <QBExportPanel job={job} totals={totals} settings={settings} onUpdate={upd} />

            {/* Digital signature */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
              <SectionLabel>Digital Signature</SectionLabel>
              {job.signature ? (
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-3 inline-block">
                    <img src={job.signature} alt="Signature" className="max-h-16" />
                  </div>
                  <p className="text-xs text-green-400">✓ Signed {job.signedAt ? new Date(job.signedAt).toLocaleString() : ''}</p>
                  <button
                    onClick={() => upd({ signature: null, signedAt: null, status: 'sent' })}
                    className="text-xs text-[#444] hover:text-red-400 transition-colors"
                  >
                    Clear signature
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#555] mb-3">Have the customer sign right on the iPad to approve the estimate on the spot.</p>
                  <button
                    onClick={() => setShowSignature(true)}
                    className="w-full border-2 border-dashed border-[#f59e0b]/30 hover:border-[#f59e0b]/60 rounded-xl py-4 text-[#f59e0b]/60 hover:text-[#f59e0b] text-sm font-semibold transition-colors"
                  >
                    ✍ Collect Signature
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
