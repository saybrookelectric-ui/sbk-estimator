import { useState } from 'react';

const ROOM_TYPES = [
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'living', label: 'Living Room', icon: '🛋️' },
  { id: 'dining', label: 'Dining Room', icon: '🪑' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'basement', label: 'Basement', icon: '⬇️' },
  { id: 'office', label: 'Office', icon: '💼' },
  { id: 'laundry', label: 'Laundry', icon: '👕' },
  { id: 'hallway', label: 'Hallway', icon: '🚶' },
  { id: 'other', label: 'Other', icon: '📐' },
];

// NEC outlet spacing requirements per room type
const NEC_OUTLETS = {
  bedroom:  { spacing: 12, gfci: 0, notes: 'NEC 210.52(A) — no point along wall more than 6ft from outlet' },
  bathroom: { spacing: 0,  gfci: 1, notes: 'NEC 210.52(D) — min 1 GFCI outlet, within 36" of sink' },
  kitchen:  { spacing: 0,  gfci: 2, notes: 'NEC 210.52(B) — GFCI on countertop circuits, small appliance circuits' },
  living:   { spacing: 12, gfci: 0, notes: 'NEC 210.52(A) — no point along wall more than 6ft from outlet' },
  dining:   { spacing: 12, gfci: 0, notes: 'NEC 210.52(A) — no point along wall more than 6ft from outlet' },
  garage:   { spacing: 0,  gfci: 1, notes: 'NEC 210.52(G) — min 1 GFCI outlet, vehicle door areas' },
  basement: { spacing: 0,  gfci: 1, notes: 'NEC 210.52(G) — unfinished basement requires GFCI' },
  office:   { spacing: 12, gfci: 0, notes: 'NEC 210.52(A) — no point along wall more than 6ft from outlet' },
  laundry:  { spacing: 0,  gfci: 1, notes: 'NEC 210.52(F) — laundry receptacle required within 6ft of appliance' },
  hallway:  { spacing: 0,  gfci: 0, notes: 'NEC 210.52(H) — hallways 10ft+ require at least 1 outlet' },
  other:    { spacing: 12, gfci: 0, notes: 'Standard NEC spacing' },
};

function calcRoom(room) {
  const { length, width, height = 8 } = room;
  if (!length || !width) return null;

  const sqft = length * width;
  const perimeterFt = 2 * (length + width);
  const wallSqft = perimeterFt * height;
  const ceilingSqft = sqft;

  // NEC outlet count estimate
  const nec = NEC_OUTLETS[room.type] || NEC_OUTLETS.other;
  let minOutlets = 0;
  if (nec.spacing > 0) {
    // Wall spacing rule: every 12ft of wall = 1 outlet (6ft reach each side)
    minOutlets = Math.ceil(perimeterFt / nec.spacing);
  } else {
    minOutlets = Math.max(nec.gfci, 1);
  }
  const minGFCI = nec.gfci;

  // Wire estimate: rough rule of thumb 1.5x perimeter per circuit
  const wirePerCircuit = perimeterFt * 1.5;

  // Light fixture: 1 per 50 sqft rough guideline
  const suggestedLights = Math.max(1, Math.ceil(sqft / 50));

  return {
    sqft: Math.round(sqft * 10) / 10,
    perimeterFt: Math.round(perimeterFt * 10) / 10,
    wallSqft: Math.round(wallSqft),
    ceilingSqft: Math.round(ceilingSqft),
    minOutlets,
    minGFCI,
    wirePerCircuit: Math.round(wirePerCircuit),
    suggestedLights,
    necNote: nec.notes,
  };
}

function RoomCard({ room, idx, onChange, onRemove }) {
  const calc = calcRoom(room);
  const roomType = ROOM_TYPES.find(r => r.id === room.type) || ROOM_TYPES[0];

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
      {/* Room header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <span>{roomType.icon}</span>
          <select
            value={room.type}
            onChange={e => onChange(idx, { ...room, type: e.target.value })}
            className="bg-transparent text-white text-sm font-semibold focus:outline-none"
          >
            {ROOM_TYPES.map(rt => (
              <option key={rt.id} value={rt.id} className="bg-[#1a1a1a]">{rt.label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => onRemove(idx)} className="text-[#333] hover:text-red-400 text-sm transition-colors">✕</button>
      </div>

      {/* Dimensions */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'length', label: 'Length (ft)' },
            { key: 'width',  label: 'Width (ft)' },
            { key: 'height', label: 'Height (ft)' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-[#444] mb-1">{f.label}</label>
              <input
                type="number" min="0" step="0.5"
                value={room[f.key] || ''}
                placeholder={f.key === 'height' ? '8' : '0'}
                onChange={e => onChange(idx, { ...room, [f.key]: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-2 text-sm text-white text-right focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs text-[#444] mb-1">Room Name (optional)</label>
          <input
            type="text"
            value={room.name || ''}
            onChange={e => onChange(idx, { ...room, name: e.target.value })}
            placeholder={`${roomType.label} ${idx + 1}`}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b]"
          />
        </div>

        {/* Results */}
        {calc && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#444]">Floor area</span>
                <span className="text-white font-semibold">{calc.sqft} sq ft</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#444]">Perimeter</span>
                <span className="text-white font-semibold">{calc.perimeterFt} ft</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#444]">Wall area</span>
                <span className="text-white font-semibold">{calc.wallSqft} sq ft</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#444]">Wire est.</span>
                <span className="text-white font-semibold">~{calc.wirePerCircuit} ft</span>
              </div>
            </div>
            <div className="border-t border-[#1a1a1a] pt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#f59e0b]">Min outlets (NEC)</span>
                <span className="text-[#f59e0b] font-bold">{calc.minOutlets}</span>
              </div>
              {calc.minGFCI > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#f59e0b]">Min GFCI</span>
                  <span className="text-[#f59e0b] font-bold">{calc.minGFCI}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-[#444]">Suggested lights</span>
                <span className="text-[#A7A5A6] font-semibold">{calc.suggestedLights}</span>
              </div>
            </div>
            <p className="text-xs text-[#333] leading-relaxed">{calc.necNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomCalculator() {
  const [rooms, setRooms] = useState([
    { type: 'bedroom', length: 12, width: 10, height: 8, name: '' },
    { type: 'bathroom', length: 8, width: 6, height: 8, name: '' },
    { type: 'kitchen', length: 14, width: 12, height: 8, name: '' },
    { type: 'living', length: 18, width: 14, height: 8, name: '' },
  ]);

  const addRoom = () => {
    setRooms(prev => [...prev, { type: 'bedroom', length: 0, width: 0, height: 8, name: '' }]);
  };

  const updateRoom = (idx, updated) => {
    setRooms(prev => prev.map((r, i) => i === idx ? updated : r));
  };

  const removeRoom = (idx) => {
    setRooms(prev => prev.filter((_, i) => i !== idx));
  };

  // Totals
  const totals = rooms.reduce((acc, room) => {
    const calc = calcRoom(room);
    if (!calc) return acc;
    return {
      sqft: acc.sqft + calc.sqft,
      wallSqft: acc.wallSqft + calc.wallSqft,
      outlets: acc.outlets + calc.minOutlets,
      gfci: acc.gfci + calc.minGFCI,
      lights: acc.lights + calc.suggestedLights,
      wire: acc.wire + calc.wirePerCircuit,
    };
  }, { sqft: 0, wallSqft: 0, outlets: 0, gfci: 0, lights: 0, wire: 0 });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">📐 Room Calculator</h2>
            <p className="text-xs text-[#444]">NEC device counts · Wire estimates · Square footage</p>
          </div>
          <button
            onClick={addRoom}
            className="text-xs px-3 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            + Add Room
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Summary totals */}
        {rooms.length > 1 && (
          <div className="bg-[#0d0d0d] border border-[#f59e0b]/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
              All Rooms — {rooms.length} rooms
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total sq ft', value: Math.round(totals.sqft), unit: 'ft²' },
                { label: 'Total outlets', value: totals.outlets, unit: 'min' },
                { label: 'Total GFCI', value: totals.gfci, unit: 'min' },
                { label: 'Wall area', value: Math.round(totals.wallSqft), unit: 'ft²' },
                { label: 'Lights', value: totals.lights, unit: 'est' },
                { label: 'Wire est.', value: Math.round(totals.wire), unit: 'ft' },
              ].map(t => (
                <div key={t.label} className="bg-[#111] rounded-lg p-2.5 text-center">
                  <p className="text-lg font-black text-[#f59e0b]">{t.value.toLocaleString()}</p>
                  <p className="text-xs text-[#333]">{t.label}</p>
                  <p className="text-xs text-[#222]">{t.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room cards */}
        {rooms.map((room, idx) => (
          <RoomCard
            key={idx}
            room={room}
            idx={idx}
            onChange={updateRoom}
            onRemove={removeRoom}
          />
        ))}

        <button
          onClick={addRoom}
          className="w-full border-2 border-dashed border-[#1a1a1a] hover:border-[#f59e0b]/40 rounded-xl py-4 text-[#444] hover:text-[#f59e0b] text-sm font-semibold transition-colors"
        >
          + Add Another Room
        </button>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs text-[#333] leading-relaxed">
            <span className="text-[#555] font-semibold">About LiDAR measurements</span> — Apple's LiDAR room scanning (RoomPlan) is only available in native iOS apps. For accurate room dimensions, apps like <span className="text-[#A7A5A6]">Magicplan</span>, <span className="text-[#A7A5A6]">Canvas</span>, or <span className="text-[#A7A5A6]">RoomScan Pro</span> can scan rooms using your iPhone Pro's LiDAR sensor and export dimensions you can enter here.
          </p>
        </div>
      </div>
    </div>
  );
}
