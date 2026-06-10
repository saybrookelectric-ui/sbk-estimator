import { useState } from 'react';

// ── Wizard configuration ─────────────────────────────────────────────────────

const STEPS = [
  { id: 'house',   title: 'House Profile',      icon: '🏠' },
  { id: 'rooms',   title: 'Room Count',          icon: '🚪' },
  { id: 'service', title: 'Service & Panel',     icon: '⚡' },
  { id: 'extras',  title: 'Special Items',       icon: '✨' },
  { id: 'review',  title: 'Review Estimate',     icon: '📋' },
];

// Device counts per room type
const ROOM_DEVICES = {
  bedroom: {
    outlets: 4, switches: 1, lights: 1, gfci: 0, smokeDetectors: 1,
    label: 'Bedroom', laborHrs: 3.5,
  },
  bathroom: {
    outlets: 0, switches: 1, lights: 1, gfci: 2, smokeDetectors: 0,
    exhaustFan: 1, label: 'Bathroom', laborHrs: 3.0,
  },
  kitchen: {
    outlets: 4, switches: 3, lights: 2, gfci: 4, smokeDetectors: 1,
    dedicated: ['Dishwasher 20A', 'Disposal 20A', 'Microwave 20A', 'Refrigerator 20A'],
    label: 'Kitchen', laborHrs: 8.0,
  },
  livingRoom: {
    outlets: 6, switches: 2, lights: 1, gfci: 0, smokeDetectors: 0,
    label: 'Living/Dining Room', laborHrs: 3.5,
  },
  laundry: {
    outlets: 2, switches: 1, lights: 1, gfci: 1, smokeDetectors: 0,
    dedicated: ['Dryer 30A', 'Washer 20A'],
    label: 'Laundry Room', laborHrs: 4.0,
  },
  garage: {
    outlets: 4, switches: 2, lights: 2, gfci: 4, smokeDetectors: 0,
    label: 'Garage', laborHrs: 4.5,
  },
  office: {
    outlets: 6, switches: 1, lights: 1, gfci: 0, smokeDetectors: 0,
    label: 'Home Office', laborHrs: 3.0,
  },
  basement: {
    outlets: 4, switches: 2, lights: 3, gfci: 2, smokeDetectors: 1,
    label: 'Finished Basement', laborHrs: 5.0,
  },
};

// Labor multipliers by wiring type
const WIRING_MULTIPLIERS = {
  knob_tube: 1.6,
  aluminum: 1.3,
  romex: 1.0,
  unknown: 1.25,
};

// Sqft labor add-on hours
const SQFT_LABOR = {
  under1000: 8,
  '1000_1500': 12,
  '1500_2000': 16,
  '2000_2500': 20,
  over2500: 26,
};

// Material cost per outlet/switch/light
const UNIT_COSTS = {
  outlet: { mat: 8, labor: 0.35 },
  gfci: { mat: 22, labor: 0.40 },
  switch: { mat: 6, labor: 0.25 },
  light: { mat: 0, labor: 0.30 }, // owner-furnished fixtures
  smokeDetector: { mat: 28, labor: 0.30 },
  exhaustFan: { mat: 65, labor: 0.75 },
  cable12_2: { mat: 0.68, labor: 0.008 }, // per foot
  cable14_2: { mat: 0.68, labor: 0.008 },
};

// ── Generate line items from wizard answers ───────────────────────────────────
function generateLineItems(answers, settings) {
  const laborRate = settings?.laborRate || 95;
  const wiringMult = WIRING_MULTIPLIERS[answers.wiringType] || 1.25;
  const sqftLabor = SQFT_LABOR[answers.sqft] || 16;
  const items = [];
  let totalOutlets = 0, totalGFCI = 0, totalSwitches = 0, totalLights = 0;
  let totalSmoke = 0, totalFans = 0, totalLaborHrs = 0;
  const dedicatedCircuits = [];

  // Build room list
  const roomList = [];
  if (answers.bedrooms > 0) for (let i = 0; i < answers.bedrooms; i++) roomList.push('bedroom');
  if (answers.bathrooms > 0) for (let i = 0; i < answers.bathrooms; i++) roomList.push('bathroom');
  if (answers.hasKitchen) roomList.push('kitchen');
  if (answers.livingRooms > 0) for (let i = 0; i < answers.livingRooms; i++) roomList.push('livingRoom');
  if (answers.hasLaundry) roomList.push('laundry');
  if (answers.garageType !== 'none') roomList.push('garage');
  if (answers.hasOffice) roomList.push('office');
  if (answers.basementType === 'finished') roomList.push('basement');

  // Count devices
  roomList.forEach(room => {
    const d = ROOM_DEVICES[room];
    totalOutlets += d.outlets || 0;
    totalGFCI += d.gfci || 0;
    totalSwitches += d.switches || 0;
    totalLights += d.lights || 0;
    totalSmoke += d.smokeDetectors || 0;
    totalFans += d.exhaustFan || 0;
    totalLaborHrs += (d.laborHrs || 0) * wiringMult;
    if (d.dedicated) dedicatedCircuits.push(...d.dedicated);
  });

  // Add sqft-based labor
  totalLaborHrs += sqftLabor * wiringMult;

  // Add ceiling fans
  if (answers.ceilingFans > 0) {
    items.push({
      assemblyId: 'wiz_ceiling_fan',
      name: 'Ceiling Fan Rough-In & Connection',
      qty: answers.ceilingFans,
      unit: 'each',
      material: 18,
      laborHrs: 0.75,
    });
  }

  // Exterior outlets
  if (answers.exteriorOutlets > 0) {
    totalGFCI += answers.exteriorOutlets;
    items.push({
      assemblyId: 'wiz_ext_outlet',
      name: 'Exterior WP/GFCI Outlet',
      qty: answers.exteriorOutlets,
      unit: 'each',
      material: 28,
      laborHrs: 0.5,
    });
  }

  // Panel upgrade
  if (answers.panelUpgrade === 'yes') {
    items.push({
      assemblyId: 'wiz_panel_200a',
      name: '200A Main Panel Upgrade (labor + materials)',
      qty: 1,
      unit: 'job',
      material: 650,
      laborHrs: 12,
    });
  }

  // EV charger
  if (answers.evCharger) {
    items.push({
      assemblyId: 'wiz_ev',
      name: 'EV Charger Circuit (50A, 240V)',
      qty: 1,
      unit: 'each',
      material: 185,
      laborHrs: 4,
    });
  }

  // Generator hookup
  if (answers.generatorHookup) {
    items.push({
      assemblyId: 'wiz_gen',
      name: 'Generator Transfer Switch & Hookup',
      qty: 1,
      unit: 'job',
      material: 450,
      laborHrs: 6,
    });
  }

  // Smoke/CO detectors
  const smokeCount = answers.smokeDetectors === 'full'
    ? Math.max(totalSmoke, answers.bedrooms + 2)
    : totalSmoke;
  if (smokeCount > 0) {
    items.push({
      assemblyId: 'wiz_smoke',
      name: 'Hardwired Smoke/CO Detector (interconnected)',
      qty: smokeCount,
      unit: 'each',
      material: 38,
      laborHrs: 0.35,
    });
  }

  // Dedicated circuits
  const uniqueDedicated = [...new Set(dedicatedCircuits)];
  uniqueDedicated.forEach(circuit => {
    items.push({
      assemblyId: `wiz_ded_${circuit.replace(/\s/g, '_')}`,
      name: `Dedicated Circuit — ${circuit}`,
      qty: 1,
      unit: 'each',
      material: circuit.includes('30A') ? 85 : 55,
      laborHrs: circuit.includes('30A') ? 3.0 : 2.5,
    });
  });

  // Exhaust fans
  if (totalFans > 0) {
    items.push({
      assemblyId: 'wiz_exhaust',
      name: 'Exhaust Fan w/ Light',
      qty: totalFans,
      unit: 'each',
      material: 65,
      laborHrs: 0.75,
    });
  }

  // Main device line items
  if (totalOutlets > 0) items.unshift({
    assemblyId: 'wiz_outlets',
    name: '120V Duplex Receptacles',
    qty: totalOutlets,
    unit: 'each',
    material: UNIT_COSTS.outlet.mat,
    laborHrs: UNIT_COSTS.outlet.labor,
  });

  if (totalGFCI > 0) items.unshift({
    assemblyId: 'wiz_gfci',
    name: 'GFCI Receptacles (kitchen, baths, exterior)',
    qty: totalGFCI,
    unit: 'each',
    material: UNIT_COSTS.gfci.mat,
    laborHrs: UNIT_COSTS.gfci.labor,
  });

  if (totalSwitches > 0) items.unshift({
    assemblyId: 'wiz_switches',
    name: 'Light Switches',
    qty: totalSwitches,
    unit: 'each',
    material: UNIT_COSTS.switch.mat,
    laborHrs: UNIT_COSTS.switch.labor,
  });

  if (totalLights > 0) items.unshift({
    assemblyId: 'wiz_lights',
    name: 'Lighting Circuit Connections (fixtures owner-furnished)',
    qty: totalLights,
    unit: 'each',
    material: 0,
    laborHrs: UNIT_COSTS.light.labor,
  });

  // Wire estimate (rough)
  const wireFeet = (answers.sqft === 'under1000' ? 800 : answers.sqft === '1000_1500' ? 1200 :
    answers.sqft === '1500_2000' ? 1600 : answers.sqft === '2000_2500' ? 2000 : 2600);
  items.unshift({
    assemblyId: 'wiz_wire',
    name: '12-2 NM-B Cable (estimated)',
    qty: wireFeet,
    unit: 'ft',
    material: 0.68,
    laborHrs: 0.008,
  });

  // Main labor block
  items.unshift({
    assemblyId: 'wiz_labor',
    name: `Rough-In Labor (${answers.wiringType === 'knob_tube' ? 'Knob & Tube removal included' : 'full rewire'})`,
    qty: Math.round(totalLaborHrs),
    unit: 'hour',
    material: 0,
    laborHrs: 1,
  });

  // Permit
  items.push({
    assemblyId: 'wiz_permit',
    name: 'Electrical Permit (verify local AHJ)',
    qty: 1,
    unit: 'job',
    material: 450,
    laborHrs: 2,
  });

  return items;
}

// ── Option button component ───────────────────────────────────────────────────
function OptionBtn({ selected, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
        selected
          ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]'
          : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#A7A5A6] hover:border-[#2a2a2a]'
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ── Counter component ─────────────────────────────────────────────────────────
function Counter({ value, onChange, min = 0, max = 10, label }) {
  return (
    <div className="flex items-center justify-between bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-3">
      <span className="text-sm text-[#A7A5A6]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-[#2a2a2a] text-[#A7A5A6] hover:border-[#f59e0b] hover:text-[#f59e0b] transition-colors flex items-center justify-center text-lg"
        >−</button>
        <span className="text-white font-bold w-6 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full border border-[#2a2a2a] text-[#A7A5A6] hover:border-[#f59e0b] hover:text-[#f59e0b] transition-colors flex items-center justify-center text-lg"
        >+</button>
      </div>
    </div>
  );
}

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, hint }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
        value ? 'border-[#f59e0b] bg-[#f59e0b]/10' : 'border-[#1a1a1a] bg-[#0d0d0d]'
      }`}
    >
      <div className="text-left">
        <p className={`text-sm font-medium ${value ? 'text-[#f59e0b]' : 'text-[#A7A5A6]'}`}>{label}</p>
        {hint && <p className="text-xs text-[#444] mt-0.5">{hint}</p>}
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${value ? 'bg-[#f59e0b]' : 'bg-[#2a2a2a]'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}

// ── Main Wizard Component ─────────────────────────────────────────────────────
export default function RewireWizard({ onComplete, onSkip, settings }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    // House profile
    sqft: '1500_2000',
    stories: '2',
    basementType: 'unfinished',
    yearBuilt: '1950_1980',
    wiringType: 'unknown',
    // Rooms
    bedrooms: 3,
    bathrooms: 2,
    hasKitchen: true,
    livingRooms: 1,
    hasLaundry: true,
    garageType: 'attached',
    hasOffice: false,
    // Service
    currentPanel: '100a',
    panelUpgrade: 'yes',
    evCharger: false,
    generatorHookup: false,
    // Extras
    smokeDetectors: 'full',
    ceilingFans: 0,
    exteriorOutlets: 2,
  });

  const set = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const lineItems = generateLineItems(answers, settings);
  const laborRate = settings?.laborRate || 95;
  const markup = (settings?.defaultMarkup || 20) / 100;

  const subtotal = lineItems.reduce((sum, li) => {
    return sum + (li.material * li.qty) + (li.laborHrs * li.qty * laborRate);
  }, 0);
  const total = subtotal * (1 + markup);

  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  // ── Step renderers ────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'house':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Square Footage</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'under1000', label: 'Under 1,000 sq ft' },
                  { val: '1000_1500', label: '1,000–1,500 sq ft' },
                  { val: '1500_2000', label: '1,500–2,000 sq ft' },
                  { val: '2000_2500', label: '2,000–2,500 sq ft' },
                  { val: 'over2500', label: 'Over 2,500 sq ft' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.sqft === o.val} onClick={() => set('sqft', o.val)}>
                    {o.label}
                  </OptionBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Stories</p>
              <div className="grid grid-cols-4 gap-2">
                {['1', '1.5', '2', '3+'].map(s => (
                  <OptionBtn key={s} selected={answers.stories === s} onClick={() => set('stories', s)}>
                    {s} {s === '1' ? 'Story' : 'Stories'}
                  </OptionBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Basement</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'none', label: 'No Basement' },
                  { val: 'unfinished', label: 'Unfinished' },
                  { val: 'finished', label: 'Finished' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.basementType === o.val} onClick={() => set('basementType', o.val)}>
                    {o.label}
                  </OptionBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Year Built</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'pre1950', label: 'Pre-1950', hint: 'Likely K&T' },
                  { val: '1950_1980', label: '1950–1980', hint: 'May have aluminum' },
                  { val: '1980_2000', label: '1980–2000', hint: 'Romex era' },
                  { val: 'post2000', label: '2000+', hint: 'Modern wiring' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.yearBuilt === o.val} onClick={() => set('yearBuilt', o.val)}>
                    <span className="block">{o.label}</span>
                    <span className="text-xs text-[#444]">{o.hint}</span>
                  </OptionBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Existing Wiring Type</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'knob_tube', label: '🔴 Knob & Tube', hint: '+60% labor' },
                  { val: 'aluminum', label: '🟡 Aluminum', hint: '+30% labor' },
                  { val: 'romex', label: '🟢 Romex/NM-B', hint: 'Standard labor' },
                  { val: 'unknown', label: '❓ Unknown', hint: '+25% labor' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.wiringType === o.val} onClick={() => set('wiringType', o.val)}>
                    <span className="block">{o.label}</span>
                    <span className="text-xs text-[#444]">{o.hint}</span>
                  </OptionBtn>
                ))}
              </div>
            </div>
          </div>
        );

      case 'rooms':
        return (
          <div className="space-y-3">
            <Counter label="Bedrooms" value={answers.bedrooms} onChange={v => set('bedrooms', v)} min={1} max={8} />
            <Counter label="Bathrooms" value={answers.bathrooms} onChange={v => set('bathrooms', v)} min={1} max={6} />
            <Counter label="Living / Dining Rooms" value={answers.livingRooms} onChange={v => set('livingRooms', v)} min={0} max={4} />
            <Toggle label="Kitchen" value={answers.hasKitchen} onChange={v => set('hasKitchen', v)} hint="8+ circuits, GFCI, dedicated appliances" />
            <Toggle label="Laundry Room" value={answers.hasLaundry} onChange={v => set('hasLaundry', v)} hint="Dryer & washer dedicated circuits" />
            <Toggle label="Home Office" value={answers.hasOffice} onChange={v => set('hasOffice', v)} hint="Extra outlets, dedicated circuit" />
            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Garage</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'none', label: 'No Garage' },
                  { val: 'attached', label: 'Attached' },
                  { val: 'detached', label: 'Detached' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.garageType === o.val} onClick={() => set('garageType', o.val)}>
                    {o.label}
                  </OptionBtn>
                ))}
              </div>
            </div>
          </div>
        );

      case 'service':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Current Panel Size</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: '60a', label: '60A', hint: 'Needs upgrade' },
                  { val: '100a', label: '100A', hint: 'May be OK' },
                  { val: '150a', label: '150A', hint: 'Usually fine' },
                  { val: '200a', label: '200A', hint: 'Full size' },
                  { val: 'unknown', label: 'Unknown', hint: '' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.currentPanel === o.val} onClick={() => set('currentPanel', o.val)}>
                    <span className="block font-bold">{o.label}</span>
                    {o.hint && <span className="text-xs text-[#444]">{o.hint}</span>}
                  </OptionBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Panel Upgrade to 200A?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'yes', label: '✅ Yes' },
                  { val: 'no', label: '❌ No' },
                  { val: 'maybe', label: '❓ TBD' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.panelUpgrade === o.val} onClick={() => set('panelUpgrade', o.val)}>
                    {o.label}
                  </OptionBtn>
                ))}
              </div>
            </div>

            <Toggle
              label="EV Charger Circuit"
              value={answers.evCharger}
              onChange={v => set('evCharger', v)}
              hint="50A / 240V dedicated circuit"
            />
            <Toggle
              label="Generator Transfer Switch"
              value={answers.generatorHookup}
              onChange={v => set('generatorHookup', v)}
              hint="Manual transfer switch + interlock"
            />
          </div>
        );

      case 'extras':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Smoke / CO Detectors</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'code_min', label: 'Code Minimum', hint: 'Per room per code' },
                  { val: 'full', label: 'Full Replacement', hint: 'Every bedroom + common areas' },
                  { val: 'none', label: 'Not Included', hint: 'Customer to supply' },
                ].map(o => (
                  <OptionBtn key={o.val} selected={answers.smokeDetectors === o.val} onClick={() => set('smokeDetectors', o.val)}>
                    <span className="block">{o.label}</span>
                    <span className="text-xs text-[#444]">{o.hint}</span>
                  </OptionBtn>
                ))}
              </div>
            </div>

            <Counter
              label="Ceiling Fans (rough-in + connection)"
              value={answers.ceilingFans}
              onChange={v => set('ceilingFans', v)}
              min={0} max={12}
            />
            <Counter
              label="Exterior Outlets (WP/GFCI)"
              value={answers.exteriorOutlets}
              onChange={v => set('exteriorOutlets', v)}
              min={0} max={8}
            />

            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 mt-2">
              <p className="text-xs text-[#444] font-semibold uppercase tracking-wider mb-2">Running Total</p>
              <p className="text-2xl font-black text-[#f59e0b]">{fmt(total)}</p>
              <p className="text-xs text-[#333] mt-1">Preliminary estimate — site visit required to confirm</p>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-xs text-[#444] mb-1">Subtotal</p>
                <p className="text-lg font-bold text-white">{fmt(subtotal)}</p>
              </div>
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-xs text-[#444] mb-1">O&P ({Math.round(markup * 100)}%)</p>
                <p className="text-lg font-bold text-white">{fmt(subtotal * markup)}</p>
              </div>
            </div>

            <div className="bg-[#f59e0b] rounded-xl p-4 flex justify-between items-center">
              <span className="font-black text-black text-lg">ESTIMATE TOTAL</span>
              <span className="font-black text-black text-2xl">{fmt(total)}</span>
            </div>

            {/* Line item preview */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider px-4 py-3 border-b border-[#1a1a1a]">
                Generated Line Items ({lineItems.length})
              </p>
              <div className="divide-y divide-[#1a1a1a] max-h-64 overflow-y-auto">
                {lineItems.map((li, i) => {
                  const lineTotal = (li.material * li.qty) + (li.laborHrs * li.qty * laborRate);
                  return (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5">
                      <div>
                        <p className="text-xs text-white">{li.name}</p>
                        <p className="text-xs text-[#444]">Qty: {li.qty} {li.unit}</p>
                      </div>
                      <p className="text-xs text-[#A7A5A6] font-semibold">{fmt(lineTotal)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-semibold mb-1">⚠ Preliminary Estimate</p>
              <p className="text-xs text-yellow-400/70">
                Based on typical device counts for {answers.bedrooms}BR/{answers.bathrooms}BA home.
                Actual scope may vary. Site visit required before final quote.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-t-2xl sm:rounded-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1a1a] flex-shrink-0">
          <div>
            <p className="text-xs text-[#444] mb-0.5">House Rewire Wizard</p>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span>{STEPS[step].icon}</span> {STEPS[step].title}
            </h2>
          </div>
          <button onClick={onSkip} className="text-[#333] hover:text-[#555] text-sm transition-colors">
            Skip wizard
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-5 py-3 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-[#f59e0b]' : 'bg-[#1a1a1a]'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#1a1a1a] flex-shrink-0">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-[#222] text-[#A7A5A6] font-semibold py-3 rounded-lg text-sm hover:border-[#444] transition-colors"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-[#f59e0b] text-black font-black py-3 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => onComplete(lineItems, answers)}
              className="flex-1 bg-[#f59e0b] text-black font-black py-3 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Build Estimate ⚡
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
