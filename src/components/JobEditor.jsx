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

// ─── QB Export Panel ──────────────────────────────────────────────────────────
function QBExportPanel({ job, totals, settings, onUpdate }) {
  const [qbStatus, setQbStatus] = useState('idle');
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
          {qbStatus === 'success' && <p className="text-xs text-green-400 text-center">✓ {qbMessage}</p>}
          {qbStatus === 'error' && <p className="text-xs text-red-400 text-center">✗ {qbMessage}</p>}
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
          onClick={() => exportEstimateCSV(job, totals, settings)}
          className="w-full border border-[#222] hover:border-[#444] text-[#A7A5A6] hover:text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          ⬇ Export CSV (for manual QB import)
        </button>
      </div>
    </div>
  );
}

// ─── Scope Pill Tabs (for multi-scope line items view) ────────────────────────
function ScopeTabs({ scopes, activeIdx, onSelect, onAdd, onRemove }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {scopes.map((s, i) => {
        const jt = JOB_TYPES.find(t => t.id === s.jobType);
        return (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => onSelect(i)}
              className={`text-sm px-3 py-1.5 rounded-l-lg border transition-colors ${
                activeIdx === i
                  ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]'
                  : 'border-[#222] text-[#A7A5A6] hover:border-[#333] bg-[#0d0d0d]'
              }`}
            >
              {jt?.icon} {s.title || jt?.label || 'Scope'}
            </button>
            {scopes.length > 1 && (
              <button
                onClick={() => onRemove(i)}
                className={`text-xs px-2 py-1.5 rounded-r-lg border-t border-r border-b transition-colors ${
                  activeIdx === i
                    ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]/60 hover:text-red-400'
                    : 'border-[#222] text-[#333] hover:text-red-400 bg-[#0d0d0d]'
                }`}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-[#f59e0b]/40 text-[#f59e0b]/60 hover:text-[#f59e0b] hover:border-[#f59e0b]/70 transition-colors"
      >
        + Add Scope
      </button>
    </div>
  );
}

// ─── Add Scope Modal ──────────────────────────────────────────────────────────
function AddScopeModal({ onAdd, onClose }) {
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    if (!selected) return;
    const jt = JOB_TYPES.find(t => t.id === selected);
    onAdd({
      id: `scope_${Date.now()}`,
      jobType: selected,
      title: title.trim() || jt?.label || selected,
      lineItems: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Add Scope to Quote</p>
          <button onClick={onClose} className="text-[#444] hover:text-white text-lg">✕</button>
        </div>

        <div>
          <label className="block text-xs text-[#555] mb-2">Scope type</label>
          <div className="grid grid-cols-2 gap-2">
            {JOB_TYPES.map(jt => (
              <button
                key={jt.id}
                onClick={() => { setSelected(jt.id); if (!title) setTitle(jt.label); }}
                className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selected === jt.id
                    ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]'
                    : 'border-[#1a1a1a] text-[#A7A5A6] hover:border-[#2a2a2a] bg-[#111]'
                }`}
              >
                <span className="mr-1.5">{jt.icon}</span>{jt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#555] mb-1">Scope label (optional)</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Pool Heater & Pump"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!selected}
          className="w-full bg-[#f59e0b] disabled:opacity-30 text-black font-bold py-3 rounded-lg text-sm transition-opacity"
        >
          Add Scope
        </button>
      </div>
    </div>
  );
}

// ─── Multi-Scope Totals Breakdown ─────────────────────────────────────────────
function MultiScopeTotals({ totals, settings }) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 space-y-4">
        {totals.scopeTotals.map((s, i) => {
          const jt = JOB_TYPES.find(t => t.id === s.jobType);
          return (
            <div key={s.id || i}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{jt?.icon}</span>
                <span className="text-sm font-semibold text-white">{s.title || jt?.label}</span>
              </div>
              <div className="pl-6 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#444]">Material</span>
                  <span className="text-[#A7A5A6]">{formatCurrency(s.totalMaterial)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#444]">Labor ({formatHours(s.totalLaborHrs)})</span>
                  <span className="text-[#A7A5A6]">{formatCurrency(s.totalLaborCost)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#1a1a1a] pt-1">
                  <span className="text-[#555] font-semibold">Scope subtotal</span>
                  <span className="text-white font-semibold">{formatCurrency(s.subtotal)}</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="border-t border-[#2a2a2a] pt-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-[#555]">Combined subtotal</span>
            <span className="text-white font-semibold">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#555]">Overhead & Profit ({totals.markupPct}%)</span>
            <span className="text-white font-semibold">{formatCurrency(totals.markupAmt)}</span>
          </div>
        </div>
      </div>
      <div className="bg-[#f59e0b] px-4 py-4 flex justify-between items-center">
        <span className="condensed text-xl font-black text-black">TOTAL ESTIMATE</span>
        <span className="condensed text-3xl font-black text-black">{formatCurrency(totals.grandTotal)}</span>
      </div>
    </div>
  );
}

// ─── Single-Scope Totals (original) ──────────────────────────────────────────
function SingleScopeTotals({ totals, settings }) {
  return (
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
  );
}

// ─── Main JobEditor ───────────────────────────────────────────────────────────
export default function JobEditor({ job, customers, settings, onUpdate, onBack, onCreateCustomer }) {
  const [tab, setTab] = useState('setup');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showAddScope, setShowAddScope] = useState(false);
  const [activeScopeIdx, setActiveScopeIdx] = useState(0);

  const upd = (updates) => {
    const next = { ...job, ...updates };
    const totals = calcJobTotals(next, settings);
    onUpdate(job.id, { ...next, grandTotal: totals.grandTotal });
  };

  // ── Scope helpers ──
  const scopes = job.scopes || null;
  const isMultiScope = !!(scopes && scopes.length > 0);

  const updScope = (idx, updates) => {
    const newScopes = scopes.map((s, i) => i === idx ? { ...s, ...updates } : s);
    upd({ scopes: newScopes });
  };

  const addScope = (newScope) => {
    const existing = scopes || [{
      id: `scope_${Date.now() - 1}`,
      jobType: job.jobType,
      title: JOB_TYPES.find(t => t.id === job.jobType)?.label || 'Scope 1',
      lineItems: job.lineItems || [],
    }];
    const updated = [...existing, newScope];
    upd({ scopes: updated, lineItems: [] });
    setActiveScopeIdx(updated.length - 1);
  };

  const removeScope = (idx) => {
    const updated = scopes.filter((_, i) => i !== idx);
    if (updated.length === 1) {
      // Collapse back to single scope
      upd({ scopes: null, lineItems: updated[0].lineItems, jobType: updated[0].jobType });
      setActiveScopeIdx(0);
    } else {
      upd({ scopes: updated });
      setActiveScopeIdx(Math.min(activeScopeIdx, updated.length - 1));
    }
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

  // Header label: show all scope icons when multi-scope
  const headerLabel = isMultiScope
    ? scopes.map(s => JOB_TYPES.find(t => t.id === s.jobType)?.label).join(' + ')
    : jt?.label;
  const headerIcon = isMultiScope
    ? scopes.map(s => JOB_TYPES.find(t => t.id === s.jobType)?.icon).join('')
    : jt?.icon;

  return (
    <div className="min-h-screen bg-black text-white">
      {showSignature && (
        <SignaturePad
          job={{ ...job, grandTotal: totals.grandTotal }}
          onSign={handleSign}
          onClose={() => setShowSignature(false)}
        />
      )}
      {showAddScope && (
        <AddScopeModal
          onAdd={addScope}
          onClose={() => setShowAddScope(false)}
        />
      )}

      {/* Top bar */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button onClick={onBack} className="text-[#444] hover:text-[#f59e0b] text-sm transition-colors">← Jobs</button>
            <div className="h-4 w-px bg-[#1a1a1a]" />
            <div className="text-xl mr-1">{headerIcon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{job.customerName || 'New Job'}</p>
              <p className="text-xs text-[#444] truncate">{headerLabel}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={job.status || 'draft'} />
              {totals.grandTotal > 0 && (
                <span className="condensed text-lg font-black text-[#f59e0b]">{formatCurrency(totals.grandTotal)}</span>
              )}
            </div>
          </div>
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

        {/* ── SETUP TAB ── */}
        {tab === 'setup' && (
          <div className="space-y-7">
            <section>
              <SectionLabel>Customer</SectionLabel>
              {showCustomerPicker ? (
                <CustomerPicker customers={customers} onSelect={handleCustomerSelect} onBack={() => setShowCustomerPicker(false)} />
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input label="Customer Name" value={job.customerName} onChange={v => upd({ customerName: v })} placeholder="John & Jane Smith" />
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

            <section>
              <SectionLabel>Job Details</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Scope / Title"
                  value={job.scopeTitle}
                  onChange={v => upd({ scopeTitle: v })}
                  placeholder={headerLabel}
                  hint="Appears on quote header"
                  className="col-span-2"
                />
                <Select
                  label="Status"
                  value={job.status || 'draft'}
                  onChange={v => upd({ status: v })}
                  options={['draft','sent','approved','signed','declined','complete'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
                <Input label="Year Built" type="number" value={job.yearBuilt} onChange={v => upd({ yearBuilt: v })} placeholder="1968" />
              </div>
            </section>

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
                      <button key={wt.id}
                        onClick={() => { const am = job.accessMultiplier || 1.0; upd({ wallType: wt.id, wallTypeMultiplier: wt.multiplier, laborMultiplier: wt.multiplier * am }); }}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${job.wallType === wt.id ? 'border-[#f59e0b] bg-[#f59e0b]/5 text-[#f59e0b]' : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#A7A5A6] hover:border-[#2a2a2a]'}`}
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
                      <button key={at.id}
                        onClick={() => { const wm = job.wallTypeMultiplier || 1.0; upd({ accessType: at.id, accessMultiplier: at.multiplier, laborMultiplier: wm * at.multiplier }); }}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${job.accessType === at.id ? 'border-[#f59e0b] bg-[#f59e0b]/5 text-[#f59e0b]' : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#A7A5A6] hover:border-[#2a2a2a]'}`}
                      >
                        <span className="font-medium">{at.label}</span>
                        <span className="text-xs text-[#444] ml-2">{at.multiplier}×</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <Textarea label="Job Notes" value={job.notes} onChange={v => upd({ notes: v })} placeholder="Conditions, customer requests, access notes, subcontractor needs..." rows={4} />
            </section>
          </div>
        )}

        {/* ── LINE ITEMS TAB ── */}
        {tab === 'items' && (
          <div>
            {isMultiScope ? (
              <div>
                <ScopeTabs
                  scopes={scopes}
                  activeIdx={activeScopeIdx}
                  onSelect={setActiveScopeIdx}
                  onAdd={() => setShowAddScope(true)}
                  onRemove={removeScope}
                />
                {/* Scope title editor */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={scopes[activeScopeIdx]?.title || ''}
                    onChange={e => updScope(activeScopeIdx, { title: e.target.value })}
                    placeholder="Scope label..."
                    className="bg-transparent border-b border-[#2a2a2a] focus:border-[#f59e0b] text-white text-sm w-full py-1 focus:outline-none"
                  />
                </div>
                <AssemblyBuilder
                  job={{ ...job, jobType: scopes[activeScopeIdx]?.jobType, lineItems: scopes[activeScopeIdx]?.lineItems || [] }}
                  onChange={(updated) => updScope(activeScopeIdx, { lineItems: updated.lineItems })}
                  settings={settings}
                />
                {/* Per-scope subtotal */}
                {totals.isMultiScope && totals.scopeTotals[activeScopeIdx] && (
                  <div className="mt-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-[#555]">This scope subtotal</span>
                    <span className="text-sm font-bold text-[#f59e0b]">
                      {formatCurrency(totals.scopeTotals[activeScopeIdx].subtotal)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <AssemblyBuilder job={job} onChange={(updated) => upd(updated)} settings={settings} />
                {/* Add scope button */}
                <div className="mt-6 border-t border-[#1a1a1a] pt-5">
                  <button
                    onClick={() => setShowAddScope(true)}
                    className="w-full border border-dashed border-[#f59e0b]/30 hover:border-[#f59e0b]/60 rounded-xl py-3 text-[#f59e0b]/60 hover:text-[#f59e0b] text-sm font-semibold transition-colors"
                  >
                    + Add Another Scope to This Quote
                  </button>
                  <p className="text-xs text-[#333] text-center mt-2">e.g. Service upgrade + pool pump on one quote</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QUOTE TAB ── */}
        {tab === 'quote' && (
          <div className="space-y-5">
            {/* Totals */}
            {totals.isMultiScope
              ? <MultiScopeTotals totals={totals} settings={settings} />
              : <SingleScopeTotals totals={totals} settings={settings} />
            }

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
              <YellowBtn onClick={() => generateQuotePDF(job, settings, displayMode)} className="w-full">
                📄 Print / Save Quote ({displayMode})
              </YellowBtn>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Estimate — ${job.scopeTitle || headerLabel || 'Electrical Work'} — ${job.customerName || ''}`);
                  const company = settings.companyName || 'Saybrook Electric, LLC.';
                  const total = formatCurrency(totals.grandTotal);
                  const body = encodeURIComponent(
`Hi ${job.customerName || 'there'},

Please find attached your estimate for ${job.scopeTitle || headerLabel || 'electrical work'} at ${job.jobAddress || 'your property'}.

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

            {/* QuickBooks + CSV */}
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
                  <button onClick={() => upd({ signature: null, signedAt: null, status: 'sent' })} className="text-xs text-[#444] hover:text-red-400 transition-colors">
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
