import { useState } from 'react';
import { Input, YellowBtn, GhostBtn, Card, SectionLabel } from './UI';

function CustomerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', address: '', phone: '', email: '', notes: '' });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="bg-[#111] border border-[#f59e0b]/30 rounded-xl p-5 space-y-3">
      <p className="condensed text-lg font-bold text-[#f59e0b]">{initial ? 'Edit Customer' : 'New Customer'}</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Name *" value={form.name} onChange={v => upd('name', v)} placeholder="John & Jane Smith" className="col-span-2" />
        <Input label="Address" value={form.address} onChange={v => upd('address', v)} placeholder="123 Main St, Ashtabula, OH" className="col-span-2" />
        <Input label="Phone" value={form.phone} onChange={v => upd('phone', v)} placeholder="(440) 555-0100" />
        <Input label="Email" value={form.email} onChange={v => upd('email', v)} placeholder="customer@email.com" />
        <Input label="Notes" value={form.notes} onChange={v => upd('notes', v)} placeholder="Repeat customer, referral, etc." className="col-span-2" />
      </div>
      <div className="flex gap-2 pt-1">
        <YellowBtn onClick={() => form.name && onSave(form)} disabled={!form.name} size="sm">Save</YellowBtn>
        <GhostBtn onClick={onCancel} size="sm">Cancel</GhostBtn>
      </div>
    </div>
  );
}

export function CustomerPicker({ customers, onSelect, onBack }) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const filtered = customers.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <p className="condensed text-lg font-bold text-white">SELECT CUSTOMER</p>
        <div className="flex gap-2">
          <button onClick={() => setAdding(true)} className="text-xs text-[#f59e0b] border border-[#f59e0b]/30 px-3 py-1.5 rounded-lg hover:bg-[#f59e0b]/10 transition-colors">
            + New
          </button>
          <button onClick={onBack} className="text-xs text-[#555] border border-[#222] px-3 py-1.5 rounded-lg hover:border-[#444]">
            Skip
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {adding && (
          <CustomerForm
            onSave={(data) => { onSelect({ ...data, isNew: true }); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#f59e0b]"
        />
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-[#444] text-center py-6">No customers yet — add one above</p>
          )}
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full text-left bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#f59e0b]/30 rounded-lg px-4 py-3 transition-all"
            >
              <p className="text-sm font-semibold text-white">{c.name}</p>
              <p className="text-xs text-[#555]">{c.address}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CustomerDatabase({ customers, onCreateCustomer, onUpdateCustomer, onDeleteCustomer, onBack }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-5 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-[#555] hover:text-[#f59e0b] text-sm">← Back</button>
        <div className="h-4 w-px bg-[#222]" />
        <h2 className="condensed text-xl font-black">CUSTOMERS</h2>
        <div className="ml-auto">
          <YellowBtn onClick={() => setAdding(true)} size="sm">+ Add Customer</YellowBtn>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6 space-y-4">
        {adding && (
          <CustomerForm
            onSave={(data) => { onCreateCustomer(data); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )}

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#f59e0b]"
        />

        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#333]">
            <p className="condensed text-2xl font-black">NO CUSTOMERS</p>
            <p className="text-sm mt-1">Add your first customer above</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id}>
              {editing === c.id ? (
                <CustomerForm
                  initial={c}
                  onSave={(data) => { onUpdateCustomer(c.id, data); setEditing(null); }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{c.name}</p>
                    <p className="text-xs text-[#555]">{c.address}</p>
                    {c.phone && <p className="text-xs text-[#555]">{c.phone}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(c.id)} className="text-xs text-[#A7A5A6] hover:text-white border border-[#222] px-3 py-1.5 rounded-lg">Edit</button>
                    <button onClick={() => { if (confirm('Delete customer?')) onDeleteCustomer(c.id); }} className="text-xs text-red-400 hover:text-red-300 border border-[#222] px-3 py-1.5 rounded-lg">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
