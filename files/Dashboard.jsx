import { useState, useRef } from 'react';
import { JOB_TYPES } from '../data/jobTypes';
import { calcJobTotals, formatCurrency } from '../utils/pricing';
import { StatusBadge, GhostBtn, YellowBtn } from './UI';
import { exportBackup, importBackup } from '../utils/backup';

export default function Dashboard({ jobs, customers, settings, onNewJob, onSelectJob, onDeleteJob, onDuplicateJob, onCustomers, onSettings, syncStatus, syncError, onRestoreBackup }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [backupMsg, setBackupMsg] = useState('');
  const restoreRef = useRef(null);

  const handleExport = () => {
    const result = exportBackup(jobs, customers, settings);
    setBackupMsg(`✓ Exported ${result.jobCount} jobs`);
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importBackup(file);
      const confirm = window.confirm(
        `Restore backup from ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString() : 'unknown date'}?\n\n${data.jobs.length} jobs, ${data.customers.length} customers.\n\nThis will MERGE with your existing data (no data will be deleted).`
      );
      if (confirm) {
        onRestoreBackup(data);
        setBackupMsg(`✓ Restored ${data.jobs.length} jobs`);
        setTimeout(() => setBackupMsg(''), 3000);
      }
    } catch (err) {
      setBackupMsg(`✗ ${err.message}`);
      setTimeout(() => setBackupMsg(''), 4000);
    }
    e.target.value = '';
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (j.customerName || '').toLowerCase().includes(q) ||
      (j.jobAddress || '').toLowerCase().includes(q) ||
      (j.scopeTitle || '').toLowerCase().includes(q);
    const matchType = filterType === 'all' || j.jobType === filterType;
    const matchStatus = filterStatus === 'all' || j.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalRevenue = jobs.filter(j => j.status === 'approved' || j.status === 'signed' || j.status === 'complete')
    .reduce((s, j) => s + (j.grandTotal || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="condensed text-3xl font-black tracking-tight">
                <span className="text-[#f59e0b]">SBK</span>
                <span className="text-white ml-2">ESTIMATOR</span>
              </h1>
              <p className="text-[#A7A5A6] text-xs mt-0.5">Saybrook Electric, LLC. · NEC 2023</p>
              <div className="flex items-center gap-1.5 mt-1">
                {syncStatus === 'syncing' && <><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block"/><span className="text-xs text-yellow-400">Syncing...</span></>}
                {syncStatus === 'synced'  && <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"/><span className="text-xs text-green-400">Cloud synced</span></>}
                {syncStatus === 'error'   && <><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"/><span className="text-xs text-red-400" title={syncError}>Sync error</span></>}
                {backupMsg && <span className={`text-xs ml-2 ${backupMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{backupMsg}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onCustomers} className="text-[#A7A5A6] hover:text-white text-xs px-3 py-1.5 rounded-lg border border-[#222] hover:border-[#444] transition-colors">
                👤 Customers
              </button>
              <button onClick={onSettings} className="text-[#A7A5A6] hover:text-white text-xs px-3 py-1.5 rounded-lg border border-[#222] hover:border-[#444] transition-colors">
                ⚙ Settings
              </button>
              {/* Backup / Restore */}
              <div className="relative">
                <button
                  onClick={handleExport}
                  className="text-[#A7A5A6] hover:text-white text-xs px-3 py-1.5 rounded-lg border border-[#222] hover:border-[#444] transition-colors"
                  title="Export backup JSON"
                >
                  ⬇ Backup
                </button>
              </div>
              <div className="relative">
                <label className="text-[#A7A5A6] hover:text-white text-xs px-3 py-1.5 rounded-lg border border-[#222] hover:border-[#444] transition-colors cursor-pointer" title="Restore from backup">
                  ⬆ Restore
                  <input ref={restoreRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
              </div>
              <YellowBtn onClick={onNewJob} size="sm">+ New Job</YellowBtn>
            </div>
          </div>

          {/* Stats bar */}
          {jobs.length > 0 && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-[#1a1a1a]">
              <div>
                <p className="text-xs text-[#555]">Total Jobs</p>
                <p className="text-lg font-black text-white">{jobs.length}</p>
              </div>
              <div>
                <p className="text-xs text-[#555]">Approved Revenue</p>
                <p className="text-lg font-black text-[#f59e0b]">{formatCurrency(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-[#555]">Pending</p>
                <p className="text-lg font-black text-white">{jobs.filter(j => j.status === 'sent').length}</p>
              </div>
              <div>
                <p className="text-xs text-[#555]">Customers</p>
                <p className="text-lg font-black text-white">{customers.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="flex-1 min-w-48 bg-[#111] border border-[#222] rounded-lg px-4 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#f59e0b]"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-[#A7A5A6] focus:outline-none focus:border-[#f59e0b]"
          >
            <option value="all">All Types</option>
            {JOB_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-[#A7A5A6] focus:outline-none focus:border-[#f59e0b]"
          >
            <option value="all">All Status</option>
            {['draft','sent','approved','signed','declined','complete'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Job cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">⚡</div>
            <p className="condensed text-2xl font-black text-[#333]">NO JOBS YET</p>
            <p className="text-[#555] text-sm mt-2">Create your first estimate to get started</p>
            <YellowBtn onClick={onNewJob} className="mt-6">+ New Job</YellowBtn>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(job => (
              <JobCard
                key={job.id}
                job={job}
                settings={settings}
                onSelect={() => onSelectJob(job.id)}
                onDelete={() => { if (confirm('Delete this job?')) onDeleteJob(job.id); }}
                onDuplicate={() => onDuplicateJob(job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, settings, onSelect, onDelete, onDuplicate }) {
  const [menu, setMenu] = useState(false);
  const jt = JOB_TYPES.find(t => t.id === job.jobType);
  const totals = calcJobTotals(job, settings);
  const date = new Date(job.updatedAt).toLocaleDateString();

  return (
    <div
      onClick={onSelect}
      className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b]/30 rounded-xl p-4 cursor-pointer transition-all group flex items-center gap-4"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-xl flex-shrink-0">
        {jt?.icon || '📋'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-white truncate">{job.customerName || 'Unnamed'}</span>
          <StatusBadge status={job.status || 'draft'} />
          {job.signature && <span className="text-xs text-green-400">✍ Signed</span>}
        </div>
        <p className="text-xs text-[#555] truncate">{job.scopeTitle || jt?.label || job.jobType} · {job.jobAddress || 'No address'}</p>
        <p className="text-xs text-[#444] mt-0.5">Updated {date}</p>
      </div>

      {/* Total */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="condensed text-xl font-black text-[#f59e0b]">
          {totals.grandTotal > 0 ? formatCurrency(totals.grandTotal) : <span className="text-[#333]">—</span>}
        </span>
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenu(!menu); }}
            className="text-[#444] hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-lg leading-none"
          >⋮</button>
          {menu && (
            <div className="absolute right-0 top-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-20 py-1 min-w-[130px]">
              <button onClick={e => { e.stopPropagation(); onDuplicate(); setMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-[#A7A5A6] hover:text-white hover:bg-[#222]">
                Duplicate
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(); setMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#222]">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
