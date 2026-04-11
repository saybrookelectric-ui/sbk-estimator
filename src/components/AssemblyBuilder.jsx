import { useState } from 'react';
import { JOB_ASSEMBLIES, CONDUIT_SIZES } from '../data/jobTypes';
import { SectionLabel } from './UI';

const CONDUIT_ASSEMBLY_IDS = new Set([
  'conduit_outdoor', 'conduit_underground', 'conduit_run',
  'conduit_indoor', 'conduit_exposed', 'conduit_surface',
]);

function ConduitSizeSelect({ value, onChange }) {
  return (
    <div className="w-28 flex-shrink-0">
      <label className="block text-xs text-[#444] mb-1">Conduit Size</label>
      <select
        value={value || '3/4"'}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1a1a1a] border border-[#f59e0b]/40 rounded px-2 py-1.5 text-sm text-[#f59e0b] focus:outline-none focus:border-[#f59e0b]"
      >
        {CONDUIT_SIZES.map(s => (
          <option key={s.size} value={s.size}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

function LineItemRow({ item, idx, onChange, onRemove, showAllIn }) {
  const isConduit = item.isConduit || CONDUIT_ASSEMBLY_IDS.has(item.assemblyId);

  const handleConduitSize = (size) => {
    const cs = CONDUIT_SIZES.find(s => s.size === size);
    if (cs) {
      onChange(idx, {
        ...item,
        conduitSize: size,
        material: cs.matPer10ft,
        laborHrs: cs.laborHrsPer10ft,
      });
    }
  };

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
      <div className="flex items-start gap-2 flex-wrap">
        {/* Qty */}
        <div className="w-14 flex-shrink-0">
          <label className="block text-xs text-[#444] mb-1">Qty</label>
          <input
            type="number" min="0"
            value={item.qty ?? 1}
            onChange={e => onChange(idx, { ...item, qty: parseFloat(e.target.value) || 0 })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-center text-white focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0" style={{minWidth: '120px'}}>
          <label className="block text-xs text-[#444] mb-1">Description</label>
          <input
            type="text"
            value={item.name || ''}
            onChange={e => onChange(idx, { ...item, name: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        {/* Conduit size dropdown OR unit */}
        {isConduit ? (
          <ConduitSizeSelect
            value={item.conduitSize}
            onChange={handleConduitSize}
          />
        ) : (
          <div className="w-20 flex-shrink-0">
            <label className="block text-xs text-[#444] mb-1">Unit</label>
            <input
              type="text"
              value={item.unit || 'each'}
              onChange={e => onChange(idx, { ...item, unit: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#f59e0b]"
            />
          </div>
        )}

        {/* Mat cost */}
        <div className="w-20 flex-shrink-0">
          <label className="block text-xs text-[#444] mb-1">Mat $</label>
          <input
            type="number" min="0"
            value={item.material ?? ''}
            onChange={e => onChange(idx, { ...item, material: parseFloat(e.target.value) || 0 })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-right text-white focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        {/* Labor hrs */}
        <div className="w-20 flex-shrink-0">
          <label className="block text-xs text-[#444] mb-1">Labor h</label>
          <input
            type="number" min="0" step="0.25"
            value={item.laborHrs ?? ''}
            onChange={e => onChange(idx, { ...item, laborHrs: parseFloat(e.target.value) || 0 })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-right text-white focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        {/* All-in override */}
        {showAllIn && (
          <div className="w-24 flex-shrink-0">
            <label className="block text-xs text-[#444] mb-1">All-in $</label>
            <input
              type="number" min="0"
              placeholder="auto"
              value={item.allInPrice ?? ''}
              onChange={e => onChange(idx, { ...item, allInPrice: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-right text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b]"
            />
          </div>
        )}

        <button onClick={() => onRemove(idx)} className="text-[#333] hover:text-red-400 text-sm mt-5 flex-shrink-0 transition-colors">✕</button>
      </div>
      {isConduit && (
        <p className="text-xs text-[#444] mt-1.5 ml-1">Mat & labor auto-calculated for selected size per 10ft</p>
      )}
    </div>
  );
}

export default function AssemblyBuilder({ job, onChange, settings }) {
  const [showAdd, setShowAdd] = useState(false);
  const lineItems = job.lineItems || [];
  const assemblies = JOB_ASSEMBLIES[job.jobType] || JOB_ASSEMBLIES.custom;
  const showAllIn = settings?.pricingMode !== 'material_labor';

  const addAssembly = (assembly) => {
    const already = lineItems.find(li => li.assemblyId === assembly.id);
    if (already) return;
    const isConduit = assembly.isConduit || CONDUIT_ASSEMBLY_IDS.has(assembly.id);
    const defaultSize = isConduit ? '3/4"' : null;
    const conduitData = isConduit ? CONDUIT_SIZES.find(s => s.size === '3/4"') : null;
    onChange({
      ...job,
      lineItems: [...lineItems, {
        assemblyId: assembly.id,
        name: assembly.name,
        qty: 1,
        unit: assembly.unit || 'each',
        material: conduitData ? conduitData.matPer10ft : assembly.material,
        laborHrs: conduitData ? conduitData.laborHrsPer10ft : assembly.laborHrs,
        notes: assembly.notes || '',
        isConduit: isConduit || undefined,
        conduitSize: defaultSize,
      }]
    });
  };

  const addBlank = () => {
    onChange({
      ...job,
      lineItems: [...lineItems, { assemblyId: null, name: 'Custom Item', qty: 1, unit: 'each', material: 0, laborHrs: 0 }]
    });
  };

  const updateItem = (idx, updated) => {
    onChange({ ...job, lineItems: lineItems.map((li, i) => i === idx ? updated : li) });
  };

  const removeItem = (idx) => {
    onChange({ ...job, lineItems: lineItems.filter((_, i) => i !== idx) });
  };

  const addedIds = new Set(lineItems.map(li => li.assemblyId).filter(Boolean));

  return (
    <div className="space-y-5">
      {/* Quick-add assembly buttons */}
      <div>
        <SectionLabel>Quick Add — Common Items</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {assemblies.map(a => {
            const added = addedIds.has(a.id);
            return (
              <button
                key={a.id}
                onClick={() => addAssembly(a)}
                disabled={added}
                title={a.notes || ''}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  added
                    ? 'border-[#f59e0b]/30 text-[#f59e0b]/50 cursor-default'
                    : 'border-[#222] text-[#A7A5A6] hover:border-[#f59e0b]/50 hover:text-[#f59e0b] bg-[#0d0d0d]'
                }`}
              >
                {added ? '✓ ' : '+ '}{a.name}
              </button>
            );
          })}
          <button
            onClick={addBlank}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#f59e0b]/30 text-[#f59e0b] hover:border-[#f59e0b] bg-[#0d0d0d] transition-colors"
          >
            + Custom Item
          </button>
        </div>
      </div>

      {/* Line items */}
      <div>
        <SectionLabel>
          Line Items {lineItems.length > 0 && <span className="text-[#f59e0b] ml-1">({lineItems.length})</span>}
        </SectionLabel>

        {lineItems.length === 0 ? (
          <div className="border-2 border-dashed border-[#1a1a1a] rounded-xl py-10 text-center text-[#333]">
            <p className="text-sm">Use the quick-add buttons above to build your estimate</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <LineItemRow
                key={idx}
                item={item}
                idx={idx}
                onChange={updateItem}
                onRemove={removeItem}
                showAllIn={showAllIn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
