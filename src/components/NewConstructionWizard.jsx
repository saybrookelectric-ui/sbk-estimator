import { useState } from 'react';

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'project',   title: 'Project Info',       icon: '🏗️' },
  { id: 'service',   title: 'Service Entrance',   icon: '⚡' },
  { id: 'temp',      title: 'Temporary Power',    icon: '🔌' },
  { id: 'roughin',   title: 'Rough-In Phase',     icon: '🔨' },
  { id: 'lowvoltage',title: 'Low Voltage',        icon: '📡' },
  { id: 'trimout',   title: 'Trim-Out Phase',     icon: '✨' },
  { id: 'review',    title: 'Review & Phases',    icon: '📋' },
];

// ── Pricing tables ────────────────────────────────────────────────────────────
const SERVICE_COSTS = {
  underground: {
    '100a': { mat: 850,  labor: 12 },
    '150a': { mat: 1100, labor: 14 },
    '200a': { mat: 1350, labor: 16 },
    '400a': { mat: 2200, labor: 22 },
  },
  overhead: {
    '100a': { mat: 650,  labor: 8  },
    '150a': { mat: 850,  labor: 10 },
    '200a': { mat: 1050, labor: 12 },
    '400a': { mat: 1800, labor: 18 },
  },
};

const DISTANCE_ADDER = {
  '0_50':   { mat: 0,   labor: 0   },
  '50_100': { mat: 350, labor: 4   },
  '100_200':{ mat: 750, labor: 8   },
  'over200':{ mat: 1400, labor: 14 },
};

const TEMP_PANEL = {
  '30a':  { mat: 280, labor: 4  },
  '60a':  { mat: 380, labor: 5  },
  '100a': { mat: 520, labor: 7  },
};

const SQFT_WIRE = {
  under1500:  1400,
  '1500_2500': 2200,
  '2500_3500': 3000,
  '3500_5000': 4200,
  over5000:   5800,
};

const SQFT_ROUGHIN_LABOR = {
  under1500:  28,
  '1500_2500': 42,
  '2500_3500': 56,
  '3500_5000': 72,
  over5000:   95,
};

const DEVICE_GRADE = {
  builder:  { outlet: 4,  gfci: 18, switch: 5,  dimmer: 22 },
  standard: { outlet: 7,  gfci: 22, switch: 8,  dimmer: 32 },
  premium:  { outlet: 14, gfci: 35, switch: 18, dimmer: 55 },
};

const ROOM_ROUGHIN = {
  bedroom:    { outlets: 4, switches: 1, lights: 1, laborHrs: 2.5 },
  bathroom:   { outlets: 0, gfci: 2, switches: 1, lights: 1, exhaustFan: 1, laborHrs: 2.5 },
  kitchen:    { outlets: 4, gfci: 4, switches: 3, lights: 2, dedicated: ['Dishwasher 20A','Disposal 20A','Microwave 20A','Refrigerator 20A'], laborHrs: 6.0 },
  livingRoom: { outlets: 6, switches: 2, lights: 1, laborHrs: 2.5 },
  laundry:    { outlets: 2, gfci: 1, switches: 1, lights: 1, dedicated: ['Dryer 30A','Washer 20A'], laborHrs: 3.0 },
  garage:     { outlets: 4, gfci: 4, switches: 2, lights: 2, laborHrs: 3.5 },
  office:     { outlets: 6, switches: 1, lights: 1, laborHrs: 2.5 },
  basement:   { outlets: 4, gfci: 2, switches: 2, lights: 3, laborHrs: 4.0 },
  masterBath: { outlets: 0, gfci: 3, switches: 2, lights: 2, exhaustFan: 1, laborHrs: 3.0 },
};

const LV_COSTS = {
  dataEthernet: { mat: 28, labor: 0.75 },
  coax:         { mat: 18, labor: 0.50 },
  doorbell:     { mat: 45, labor: 1.00 },
  securityRough:{ mat: 12, labor: 0.50 },
  speakerRough: { mat: 15, labor: 0.50 },
  intercom:     { mat: 85, labor: 2.00 },
};

// ── Generate line items ───────────────────────────────────────────────────────
function generateNewConstructionItems(a, settings) {
  const laborRate = settings?.laborRate || 95;
  const phase1 = []; // Rough-in
  const phase2 = []; // Trim-out
  const tempItems = [];

  // ── TEMP POWER ──
  if (a.tempPower) {
    const tc = TEMP_PANEL[a.tempPanelSize] || TEMP_PANEL['60a'];
    tempItems.push({
      assemblyId: 'nc_temp_panel',
      name: `Temporary Power Panel (${a.tempPanelSize?.toUpperCase()})`,
      qty: 1, unit: 'job',
      material: tc.mat, laborHrs: tc.labor,
    });
    tempItems.push({
      assemblyId: 'nc_temp_disconnect',
      name: 'Temp Power Disconnect & Weatherhead',
      qty: 1, unit: 'job',
      material: 185, laborHrs: 2,
    });
  }

  // ── SERVICE ENTRANCE ──
  const svc = SERVICE_COSTS[a.serviceType]?.[a.serviceSize] || { mat: 1350, labor: 16 };
  const dist = DISTANCE_ADDER[a.serviceDistance] || { mat: 0, labor: 0 };

  phase1.push({
    assemblyId: 'nc_service',
    name: `Service Entrance — ${a.serviceSize?.toUpperCase()} ${a.serviceType === 'underground' ? 'Underground' : 'Overhead'}`,
    qty: 1, unit: 'job',
    material: svc.mat + dist.mat,
    laborHrs: svc.labor + dist.labor,
  });

  if (a.serviceType === 'underground' && a.trenchingBy === 'ec') {
    phase1.push({
      assemblyId: 'nc_trenching',
      name: 'Underground Trenching (EC scope)',
      qty: 1, unit: 'job',
      material: 0, laborHrs: 8,
    });
  } else if (a.serviceType === 'underground' && a.trenchingBy === 'sub') {
    phase1.push({
      assemblyId: 'nc_trenching_sub',
      name: 'Underground Trenching (subcontractor allowance)',
      qty: 1, unit: 'job',
      material: 850, laborHrs: 0,
    });
  }

  // ── PANEL ──
  const panelCosts = {
    '100a': { mat: 280, labor: 4 },
    '150a': { mat: 360, labor: 5 },
    '200a': { mat: 480, labor: 6 },
    '400a': { mat: 850, labor: 9 },
  };
  const panel = panelCosts[a.serviceSize] || panelCosts['200a'];
  phase1.push({
    assemblyId: 'nc_panel',
    name: `Main Electrical Panel — ${a.serviceSize?.toUpperCase()}, ${a.panelCircuits || 40}-space`,
    qty: 1, unit: 'each',
    material: panel.mat, laborHrs: panel.labor,
  });

  // ── ROUGH-IN WIRE ──
  const wireFt = SQFT_WIRE[a.sqft] || 2200;
  phase1.push({
    assemblyId: 'nc_wire',
    name: '12-2 NM-B Cable (estimated)',
    qty: wireFt, unit: 'ft',
    material: 0.68, laborHrs: 0.008,
  });
  if (a.has3Way) {
    phase1.push({
      assemblyId: 'nc_wire_3way',
      name: '12-3 NM-B Cable — 3-way switch loops',
      qty: Math.round(wireFt * 0.15), unit: 'ft',
      material: 1.05, laborHrs: 0.010,
    });
  }

  // ── ROUGH-IN LABOR ──
  const roughLabor = SQFT_ROUGHIN_LABOR[a.sqft] || 42;
  phase1.push({
    assemblyId: 'nc_roughin_labor',
    name: 'Rough-In Labor (bore, drill, staple, home run to panel)',
    qty: roughLabor, unit: 'hour',
    material: 0, laborHrs: 1,
  });

  // ── ROOM ROUGH-IN ──
  const roomList = [];
  for (let i = 0; i < (a.bedrooms || 3); i++) roomList.push('bedroom');
  for (let i = 0; i < (a.bathrooms || 2); i++) roomList.push('bathroom');
  if (a.masterBath) roomList.push('masterBath');
  if (a.hasKitchen !== false) roomList.push('kitchen');
  for (let i = 0; i < (a.livingRooms || 1); i++) roomList.push('livingRoom');
  if (a.hasLaundry !== false) roomList.push('laundry');
  if (a.garageType !== 'none') roomList.push('garage');
  if (a.hasOffice) roomList.push('office');
  if (a.basementType === 'finished') roomList.push('basement');

  let totalOutlets = 0, totalGFCI = 0, totalSwitches = 0, totalLights = 0, totalFans = 0;
  const dedicated = [];
  roomList.forEach(r => {
    const d = ROOM_ROUGHIN[r] || {};
    totalOutlets += d.outlets || 0;
    totalGFCI += (d.gfci || 0);
    totalSwitches += d.switches || 0;
    totalLights += d.lights || 0;
    totalFans += d.exhaustFan || 0;
    if (d.dedicated) dedicated.push(...d.dedicated);
  });

  // Rough-in boxes (phase 1)
  if (totalOutlets > 0) phase1.push({ assemblyId: 'nc_outlet_boxes', name: 'Outlet Boxes (new work)', qty: totalOutlets, unit: 'ea', material: 0.90, laborHrs: 0.10 });
  if (totalGFCI > 0) phase1.push({ assemblyId: 'nc_gfci_boxes', name: 'GFCI Location Boxes', qty: totalGFCI, unit: 'ea', material: 0.90, laborHrs: 0.10 });
  if (totalSwitches > 0) phase1.push({ assemblyId: 'nc_switch_boxes', name: 'Switch Boxes', qty: totalSwitches, unit: 'ea', material: 0.90, laborHrs: 0.10 });
  if (totalLights > 0) phase1.push({ assemblyId: 'nc_light_boxes', name: 'Ceiling Electrical Boxes', qty: totalLights, unit: 'ea', material: 1.20, laborHrs: 0.10 });

  // Dedicated circuits (phase 1)
  const uniqueDed = [...new Set(dedicated)];
  uniqueDed.forEach(circ => {
    phase1.push({
      assemblyId: `nc_ded_${circ.replace(/\s/g,'_')}`,
      name: `Dedicated Circuit — ${circ}`,
      qty: 1, unit: 'each',
      material: circ.includes('30A') ? 75 : 45,
      laborHrs: circ.includes('30A') ? 2.5 : 2.0,
    });
  });

  // Exhaust fans rough-in (phase 1) — devices in phase 2
  if (totalFans > 0) {
    phase1.push({ assemblyId: 'nc_fan_rough', name: 'Exhaust Fan Rough-In', qty: totalFans, unit: 'ea', material: 5, laborHrs: 0.25 });
  }

  // Smoke/CO detectors rough-in
  const smokeCount = Math.max((a.bedrooms || 3) + 2, 4);
  phase1.push({ assemblyId: 'nc_smoke_rough', name: 'Smoke/CO Detector Rough-In', qty: smokeCount, unit: 'ea', material: 5, laborHrs: 0.20 });

  // HVAC circuits
  if (a.hvacCircuits > 0) {
    phase1.push({
      assemblyId: 'nc_hvac',
      name: 'HVAC/AC Disconnect & Circuit',
      qty: a.hvacCircuits, unit: 'each',
      material: 95, laborHrs: 3.5,
    });
  }

  // EV charger rough-in
  if (a.evCharger) {
    phase1.push({ assemblyId: 'nc_ev_rough', name: 'EV Charger Circuit Rough-In (50A)', qty: 1, unit: 'each', material: 145, laborHrs: 3.5 });
  }

  // Generator hookup
  if (a.generatorHookup) {
    phase1.push({ assemblyId: 'nc_gen', name: 'Generator Transfer Switch Rough-In', qty: 1, unit: 'job', material: 380, laborHrs: 5 });
  }

  // Permit
  phase1.push({ assemblyId: 'nc_permit', name: 'Electrical Permit (verify AHJ)', qty: 1, unit: 'job', material: 550, laborHrs: 2 });

  // ── LOW VOLTAGE (phase 1 rough-in) ──
  if (a.dataDrops > 0) phase1.push({ assemblyId: 'nc_data', name: 'Ethernet/Data Drop Rough-In (Cat6)', qty: a.dataDrops, unit: 'each', material: LV_COSTS.dataEthernet.mat, laborHrs: LV_COSTS.dataEthernet.labor });
  if (a.coaxDrops > 0) phase1.push({ assemblyId: 'nc_coax', name: 'Coax/Cable TV Drop Rough-In', qty: a.coaxDrops, unit: 'each', material: LV_COSTS.coax.mat, laborHrs: LV_COSTS.coax.labor });
  if (a.hasDoorbell) phase1.push({ assemblyId: 'nc_doorbell', name: 'Doorbell / Video Doorbell Rough-In', qty: 1, unit: 'each', material: LV_COSTS.doorbell.mat, laborHrs: LV_COSTS.doorbell.labor });
  if (a.securityDrops > 0) phase1.push({ assemblyId: 'nc_security', name: 'Security System Rough-In (per zone)', qty: a.securityDrops, unit: 'each', material: LV_COSTS.securityRough.mat, laborHrs: LV_COSTS.securityRough.labor });
  if (a.speakerDrops > 0) phase1.push({ assemblyId: 'nc_speakers', name: 'In-Wall Speaker Rough-In', qty: a.speakerDrops, unit: 'each', material: LV_COSTS.speakerRough.mat, laborHrs: LV_COSTS.speakerRough.labor });
  if (a.hasIntercom) phase1.push({ assemblyId: 'nc_intercom', name: 'Intercom System Rough-In', qty: 1, unit: 'job', material: LV_COSTS.intercom.mat, laborHrs: LV_COSTS.intercom.labor });

  // ── TRIM-OUT (phase 2) ──
  const grade = DEVICE_GRADE[a.deviceGrade] || DEVICE_GRADE.standard;

  if (totalOutlets > 0) phase2.push({ assemblyId: 'nc_outlets', name: `Duplex Receptacles (${a.deviceGrade} grade)`, qty: totalOutlets, unit: 'each', material: grade.outlet, laborHrs: 0.25 });
  if (totalGFCI > 0) phase2.push({ assemblyId: 'nc_gfci', name: `GFCI Receptacles (${a.deviceGrade} grade)`, qty: totalGFCI, unit: 'each', material: grade.gfci, laborHrs: 0.30 });
  if (totalSwitches > 0) {
    const dimmers = Math.min(a.dimmerCount || 0, totalSwitches);
    const switches = totalSwitches - dimmers;
    if (switches > 0) phase2.push({ assemblyId: 'nc_switches', name: `Light Switches (${a.deviceGrade} grade)`, qty: switches, unit: 'each', material: grade.switch, laborHrs: 0.20 });
    if (dimmers > 0) phase2.push({ assemblyId: 'nc_dimmers', name: `Dimmer Switches (${a.deviceGrade} grade)`, qty: dimmers, unit: 'each', material: grade.dimmer, laborHrs: 0.25 });
  }

  // Fixture connections
  if (totalLights > 0) {
    if (a.fixturesBy === 'owner') {
      phase2.push({ assemblyId: 'nc_fixtures_connect', name: 'Lighting Fixture Connections (owner-furnished)', qty: totalLights, unit: 'each', material: 0, laborHrs: 0.30 });
    } else {
      phase2.push({ assemblyId: 'nc_fixtures_ec', name: 'Lighting Fixtures (EC-furnished, allowance)', qty: totalLights, unit: 'each', material: 85, laborHrs: 0.45 });
    }
  }

  // Exhaust fans trim
  if (totalFans > 0) phase2.push({ assemblyId: 'nc_fans_trim', name: 'Exhaust Fan w/ Light (install & connect)', qty: totalFans, unit: 'each', material: 68, laborHrs: 0.75 });

  // Smoke detectors trim
  phase2.push({ assemblyId: 'nc_smoke_trim', name: 'Smoke/CO Detector (hardwired, interconnected)', qty: smokeCount, unit: 'each', material: 38, laborHrs: 0.30 });

  // Ceiling fans
  if (a.ceilingFans > 0) phase2.push({ assemblyId: 'nc_ceiling_fans', name: 'Ceiling Fan Installation & Connection', qty: a.ceilingFans, unit: 'each', material: 0, laborHrs: 0.75 });

  // Exterior
  if (a.exteriorOutlets > 0) phase2.push({ assemblyId: 'nc_ext_outlets', name: 'Exterior WP/GFCI Outlet (install)', qty: a.exteriorOutlets, unit: 'each', material: 28, laborHrs: 0.50 });
  if (a.exteriorLights > 0) phase2.push({ assemblyId: 'nc_ext_lights', name: 'Exterior Light Fixture Connection', qty: a.exteriorLights, unit: 'each', material: 0, laborHrs: 0.35 });

  // Panel trim (breakers, directory)
  phase2.push({ assemblyId: 'nc_panel_trim', name: 'Panel Final — Breakers, Labeling, Directory', qty: 1, unit: 'job', material: 180, laborHrs: 3.0 });

  // Trim-out labor
  const trimLabor = Math.round((totalOutlets + totalGFCI + totalSwitches) * 0.25 + totalLights * 0.30 + 4);
  phase2.push({ assemblyId: 'nc_trim_labor', name: 'Trim-Out Labor', qty: trimLabor, unit: 'hour', material: 0, laborHrs: 1 });

  return { phase1, phase2, tempItems };
}

// ── Helper components ─────────────────────────────────────────────────────────
function OptionBtn({ selected, onClick, children, className = '' }) {
  return (
    <button onClick={onClick} className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${selected ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]' : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#A7A5A6] hover:border-[#2a2a2a]'} ${className}`}>
      {children}
    </button>
  );
}

function Counter({ value, onChange, min = 0, max = 20, label, hint }) {
  return (
    <div className="flex items-center justify-between bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-3">
      <div>
        <p className="text-sm text-[#A7A5A6]">{label}</p>
        {hint && <p className="text-xs text-[#333] mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-full border border-[#2a2a2a] text-[#A7A5A6] hover:border-[#22c55e] hover:text-[#22c55e] transition-colors flex items-center justify-center text-lg">−</button>
        <span className="text-white font-bold w-6 text-center">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-full border border-[#2a2a2a] text-[#A7A5A6] hover:border-[#22c55e] hover:text-[#22c55e] transition-colors flex items-center justify-center text-lg">+</button>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, label, hint }) {
  return (
    <button onClick={() => onChange(!value)} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${value ? 'border-[#22c55e] bg-[#22c55e]/10' : 'border-[#1a1a1a] bg-[#0d0d0d]'}`}>
      <div className="text-left">
        <p className={`text-sm font-medium ${value ? 'text-[#22c55e]' : 'text-[#A7A5A6]'}`}>{label}</p>
        {hint && <p className="text-xs text-[#444] mt-0.5">{hint}</p>}
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${value ? 'bg-[#22c55e]' : 'bg-[#2a2a2a]'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function NewConstructionWizard({ onComplete, onSkip, settings }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState({
    // Project
    sqft: '1500_2500', stories: '2', basementType: 'none', builderOrCustom: 'builder',
    // Service
    serviceType: 'underground', serviceSize: '200a', serviceDistance: '0_50',
    meterSocketIncluded: true, trenchingBy: 'ec', panelCircuits: 40,
    // Temp
    tempPower: true, tempPanelSize: '60a',
    // Rough-in rooms
    bedrooms: 3, bathrooms: 2, masterBath: true, hasKitchen: true,
    livingRooms: 1, hasLaundry: true, garageType: 'attached',
    hasOffice: false, has3Way: true,
    hvacCircuits: 1, evCharger: false, generatorHookup: false,
    // Low voltage
    dataDrops: 6, coaxDrops: 4, hasDoorbell: true,
    securityDrops: 0, speakerDrops: 0, hasIntercom: false,
    // Trim-out
    deviceGrade: 'standard', dimmerCount: 6, fixturesBy: 'owner',
    ceilingFans: 3, exteriorOutlets: 4, exteriorLights: 6,
  });

  const set = (key, val) => setA(prev => ({ ...prev, [key]: val }));
  const laborRate = settings?.laborRate || 95;
  const markup = (settings?.defaultMarkup || 20) / 100;

  const { phase1, phase2, tempItems } = generateNewConstructionItems(a, settings);

  const calcTotal = (items) => items.reduce((sum, li) => sum + (li.material * li.qty) + (li.laborHrs * li.qty * laborRate), 0);

  const tempTotal = calcTotal(tempItems);
  const phase1Total = calcTotal(phase1);
  const phase2Total = calcTotal(phase2);
  const grandSubtotal = tempTotal + phase1Total + phase2Total;
  const grandTotal = grandSubtotal * (1 + markup);

  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  const renderStep = () => {
    switch (STEPS[step].id) {

      case 'project': return (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Square Footage</p>
            <div className="grid grid-cols-2 gap-2">
              {[{v:'under1500',l:'Under 1,500'},{v:'1500_2500',l:'1,500–2,500'},{v:'2500_3500',l:'2,500–3,500'},{v:'3500_5000',l:'3,500–5,000'},{v:'over5000',l:'Over 5,000'}].map(o=>(
                <OptionBtn key={o.v} selected={a.sqft===o.v} onClick={()=>set('sqft',o.v)}>{o.l} sq ft</OptionBtn>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Stories</p>
            <div className="grid grid-cols-4 gap-2">
              {['1','1.5','2','3+'].map(s=>(
                <OptionBtn key={s} selected={a.stories===s} onClick={()=>set('stories',s)}>{s} {s==='1'?'Story':'Stories'}</OptionBtn>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Foundation / Basement</p>
            <div className="grid grid-cols-2 gap-2">
              {[{v:'slab',l:'Slab'},{v:'crawl',l:'Crawl Space'},{v:'none',l:'No Basement'},{v:'unfinished',l:'Unfinished Basement'},{v:'finished',l:'Finished Basement'},{v:'walkout',l:'Walkout Basement'}].map(o=>(
                <OptionBtn key={o.v} selected={a.basementType===o.v} onClick={()=>set('basementType',o.v)}>{o.l}</OptionBtn>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Project Type</p>
            <div className="grid grid-cols-2 gap-2">
              <OptionBtn selected={a.builderOrCustom==='builder'} onClick={()=>set('builderOrCustom','builder')}>
                <span className="block font-bold">🏗️ Builder Spec</span>
                <span className="text-xs text-[#444]">Standard finishes, builder grade</span>
              </OptionBtn>
              <OptionBtn selected={a.builderOrCustom==='custom'} onClick={()=>set('builderOrCustom','custom')}>
                <span className="block font-bold">🏠 Custom Home</span>
                <span className="text-xs text-[#444]">Higher spec, more flexibility</span>
              </OptionBtn>
            </div>
          </div>
        </div>
      );

      case 'service': return (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Service Type</p>
            <div className="grid grid-cols-2 gap-2">
              <OptionBtn selected={a.serviceType==='underground'} onClick={()=>set('serviceType','underground')}>
                <span className="block font-bold">🌊 Underground</span>
                <span className="text-xs text-[#444]">Buried conduit/cable</span>
              </OptionBtn>
              <OptionBtn selected={a.serviceType==='overhead'} onClick={()=>set('serviceType','overhead')}>
                <span className="block font-bold">🔼 Overhead</span>
                <span className="text-xs text-[#444]">Aerial drop from pole</span>
              </OptionBtn>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Service Size</p>
            <div className="grid grid-cols-4 gap-2">
              {['100a','150a','200a','400a'].map(s=>(
                <OptionBtn key={s} selected={a.serviceSize===s} onClick={()=>set('serviceSize',s)}>{s.toUpperCase()}</OptionBtn>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Distance from Pole / Transformer</p>
            <div className="grid grid-cols-2 gap-2">
              {[{v:'0_50',l:'0–50 ft'},{v:'50_100',l:'50–100 ft'},{v:'100_200',l:'100–200 ft'},{v:'over200',l:'200+ ft'}].map(o=>(
                <OptionBtn key={o.v} selected={a.serviceDistance===o.v} onClick={()=>set('serviceDistance',o.v)}>{o.l}</OptionBtn>
              ))}
            </div>
          </div>
          {a.serviceType==='underground' && (
            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Trenching By</p>
              <div className="grid grid-cols-3 gap-2">
                <OptionBtn selected={a.trenchingBy==='ec'} onClick={()=>set('trenchingBy','ec')}>EC (labor only)</OptionBtn>
                <OptionBtn selected={a.trenchingBy==='sub'} onClick={()=>set('trenchingBy','sub')}>Subcontractor</OptionBtn>
                <OptionBtn selected={a.trenchingBy==='gc'} onClick={()=>set('trenchingBy','gc')}>GC Scope</OptionBtn>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Main Panel</p>
            <div className="grid grid-cols-3 gap-2">
              {[{v:24,l:'24-space'},{v:30,l:'30-space'},{v:40,l:'40-space'},{v:42,l:'42-space'},{v:60,l:'60-space'}].map(o=>(
                <OptionBtn key={o.v} selected={a.panelCircuits===o.v} onClick={()=>set('panelCircuits',o.v)}>{o.l}</OptionBtn>
              ))}
            </div>
          </div>
          <Toggle label="Meter Socket Included in EC Scope" value={a.meterSocketIncluded} onChange={v=>set('meterSocketIncluded',v)} hint="Some utilities furnish the meter socket" />
        </div>
      );

      case 'temp': return (
        <div className="space-y-4">
          <Toggle label="Temporary Power Required" value={a.tempPower} onChange={v=>set('tempPower',v)} hint="Temp pole and panel during construction" />
          {a.tempPower && (
            <>
              <div>
                <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Temp Panel Size</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:'30a',l:'30A'},{v:'60a',l:'60A'},{v:'100a',l:'100A'}].map(o=>(
                    <OptionBtn key={o.v} selected={a.tempPanelSize===o.v} onClick={()=>set('tempPanelSize',o.v)}>{o.l}</OptionBtn>
                  ))}
                </div>
              </div>
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
                <p className="text-xs text-[#444] mb-1">Temp power estimate</p>
                <p className="text-xl font-bold text-[#22c55e]">{fmt(tempTotal * (1+markup))}</p>
              </div>
            </>
          )}
        </div>
      );

      case 'roughin': return (
        <div className="space-y-3">
          <Counter label="Bedrooms" value={a.bedrooms} onChange={v=>set('bedrooms',v)} min={1} max={8} />
          <Counter label="Full Bathrooms" value={a.bathrooms} onChange={v=>set('bathrooms',v)} min={1} max={6} />
          <Toggle label="Master Bath (separate)" value={a.masterBath} onChange={v=>set('masterBath',v)} hint="Extra GFCI, exhaust fan, lighting" />
          <Counter label="Living / Dining Rooms" value={a.livingRooms} onChange={v=>set('livingRooms',v)} min={0} max={4} />
          <Toggle label="Kitchen" value={a.hasKitchen} onChange={v=>set('hasKitchen',v)} hint="8+ circuits, appliance connections" />
          <Toggle label="Laundry Room" value={a.hasLaundry} onChange={v=>set('hasLaundry',v)} hint="Dryer 30A + washer 20A dedicated" />
          <Toggle label="Home Office" value={a.hasOffice} onChange={v=>set('hasOffice',v)} hint="Extra outlets + dedicated circuit" />
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Garage</p>
            <div className="grid grid-cols-3 gap-2">
              {[{v:'none',l:'None'},{v:'attached',l:'Attached'},{v:'detached',l:'Detached'}].map(o=>(
                <OptionBtn key={o.v} selected={a.garageType===o.v} onClick={()=>set('garageType',o.v)}>{o.l}</OptionBtn>
              ))}
            </div>
          </div>
          <Toggle label="3-Way Switch Locations" value={a.has3Way} onChange={v=>set('has3Way',v)} hint="Stairs, hallways, large rooms" />
          <Counter label="HVAC / AC Disconnect Circuits" value={a.hvacCircuits} onChange={v=>set('hvacCircuits',v)} min={0} max={4} />
          <Toggle label="EV Charger Circuit (50A)" value={a.evCharger} onChange={v=>set('evCharger',v)} />
          <Toggle label="Generator Transfer Switch" value={a.generatorHookup} onChange={v=>set('generatorHookup',v)} />
        </div>
      );

      case 'lowvoltage': return (
        <div className="space-y-3">
          <Counter label="Ethernet / Data Drops (Cat6)" value={a.dataDrops} onChange={v=>set('dataDrops',v)} hint="Home office, bedrooms, living room, TV locations" />
          <Counter label="Coax / Cable TV Drops" value={a.coaxDrops} onChange={v=>set('coaxDrops',v)} />
          <Toggle label="Doorbell / Video Doorbell" value={a.hasDoorbell} onChange={v=>set('hasDoorbell',v)} />
          <Counter label="Security System Zones" value={a.securityDrops} onChange={v=>set('securityDrops',v)} hint="Door/window contacts, motion sensors" />
          <Counter label="In-Wall Speaker Rough-Ins" value={a.speakerDrops} onChange={v=>set('speakerDrops',v)} />
          <Toggle label="Intercom System" value={a.hasIntercom} onChange={v=>set('hasIntercom',v)} />
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 mt-2">
            <p className="text-xs text-[#444] mb-1">Low voltage adds to Phase 1 total</p>
            <p className="text-sm text-[#22c55e] font-semibold">Low voltage items added to Phase 1</p>
          </div>
        </div>
      );

      case 'trimout': return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Device Grade</p>
            <div className="grid grid-cols-3 gap-2">
              {[{v:'builder',l:'Builder Grade',h:'Leviton basic'},{v:'standard',l:'Standard',h:'Leviton Decora'},{v:'premium',l:'Premium',h:'Lutron / Legrand'}].map(o=>(
                <OptionBtn key={o.v} selected={a.deviceGrade===o.v} onClick={()=>set('deviceGrade',o.v)}>
                  <span className="block font-bold text-xs">{o.l}</span>
                  <span className="text-xs text-[#444]">{o.h}</span>
                </OptionBtn>
              ))}
            </div>
          </div>
          <Counter label="Dimmer Switches" value={a.dimmerCount} onChange={v=>set('dimmerCount',v)} hint="Included in total switch count" />
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">Light Fixtures</p>
            <div className="grid grid-cols-2 gap-2">
              <OptionBtn selected={a.fixturesBy==='owner'} onClick={()=>set('fixturesBy','owner')}>
                <span className="block font-bold">Owner Furnished</span>
                <span className="text-xs text-[#444]">EC connects only</span>
              </OptionBtn>
              <OptionBtn selected={a.fixturesBy==='ec'} onClick={()=>set('fixturesBy','ec')}>
                <span className="block font-bold">EC Furnished</span>
                <span className="text-xs text-[#444]">EC supplies + installs</span>
              </OptionBtn>
            </div>
          </div>
          <Counter label="Ceiling Fans" value={a.ceilingFans} onChange={v=>set('ceilingFans',v)} />
          <Counter label="Exterior Outlets (WP/GFCI)" value={a.exteriorOutlets} onChange={v=>set('exteriorOutlets',v)} />
          <Counter label="Exterior Light Fixtures" value={a.exteriorLights} onChange={v=>set('exteriorLights',v)} />
        </div>
      );

      case 'review': return (
        <div className="space-y-4">
          {/* Phase cards */}
          {a.tempPower && (
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1a1a1a] flex justify-between items-center">
                <div><p className="text-xs text-[#444]">Temp Power</p><p className="text-sm font-bold text-white">Temporary Electrical</p></div>
                <p className="text-[#22c55e] font-black">{fmt(tempTotal*(1+markup))}</p>
              </div>
            </div>
          )}

          <div className="bg-[#0d0d0d] border border-[#22c55e]/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1a] flex justify-between items-center">
              <div><p className="text-xs text-[#444]">Phase 1</p><p className="text-sm font-bold text-white">Rough-In & Service</p></div>
              <p className="text-[#22c55e] font-black">{fmt(phase1Total*(1+markup))}</p>
            </div>
            <div className="px-4 py-2 max-h-32 overflow-y-auto">
              {phase1.map((li,i)=>(
                <div key={i} className="flex justify-between py-1 border-b border-[#111] last:border-0">
                  <p className="text-xs text-[#555] truncate pr-2">{li.name} ×{li.qty}</p>
                  <p className="text-xs text-[#444] flex-shrink-0">{fmt((li.material*li.qty)+(li.laborHrs*li.qty*laborRate))}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#f59e0b]/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1a] flex justify-between items-center">
              <div><p className="text-xs text-[#444]">Phase 2</p><p className="text-sm font-bold text-white">Trim-Out & Finish</p></div>
              <p className="text-[#f59e0b] font-black">{fmt(phase2Total*(1+markup))}</p>
            </div>
            <div className="px-4 py-2 max-h-32 overflow-y-auto">
              {phase2.map((li,i)=>(
                <div key={i} className="flex justify-between py-1 border-b border-[#111] last:border-0">
                  <p className="text-xs text-[#555] truncate pr-2">{li.name} ×{li.qty}</p>
                  <p className="text-xs text-[#444] flex-shrink-0">{fmt((li.material*li.qty)+(li.laborHrs*li.qty*laborRate))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grand total */}
          <div className="bg-[#22c55e] rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-black/70 text-xs font-semibold">TOTAL CONTRACT</p>
              <p className="text-black text-xs">{a.tempPower ? 'Temp + ' : ''}Phase 1 + Phase 2</p>
            </div>
            <p className="text-black font-black text-2xl">{fmt(grandTotal)}</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <p className="text-xs text-green-400 font-semibold mb-1">⚠ Preliminary Estimate</p>
            <p className="text-xs text-green-400/70">Based on {a.bedrooms}BR/{a.bathrooms}BA {a.sqft.replace('_','–')} sq ft new construction. Actual scope subject to plan review and site conditions.</p>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-t-2xl sm:rounded-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1a1a] flex-shrink-0">
          <div>
            <p className="text-xs text-[#444] mb-0.5">New Construction Wizard</p>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span>{STEPS[step].icon}</span> {STEPS[step].title}
            </h2>
          </div>
          <button onClick={onSkip} className="text-[#333] hover:text-[#555] text-sm transition-colors">Skip wizard</button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 py-3 flex-shrink-0">
          {STEPS.map((s,i)=>(
            <div key={s.id} className={`h-1 flex-1 rounded-full transition-colors ${i<=step?'bg-[#22c55e]':'bg-[#1a1a1a]'}`} />
          ))}
        </div>

        {/* Running total */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-2 flex justify-between items-center">
            <span className="text-xs text-[#444]">Running total</span>
            <span className="text-sm font-black text-[#22c55e]">{fmt(grandTotal)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">{renderStep()}</div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[#1a1a1a] flex-shrink-0">
          {step > 0 && (
            <button onClick={()=>setStep(s=>s-1)} className="flex-1 border border-[#222] text-[#A7A5A6] font-semibold py-3 rounded-lg text-sm hover:border-[#444] transition-colors">← Back</button>
          )}
          {step < STEPS.length-1 ? (
            <button onClick={()=>setStep(s=>s+1)} className="flex-1 bg-[#22c55e] text-black font-black py-3 rounded-lg text-sm hover:opacity-90 transition-opacity">Next →</button>
          ) : (
            <button
              onClick={() => onComplete({ phase1, phase2, tempItems, answers: a })}
              className="flex-1 bg-[#22c55e] text-black font-black py-3 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Build Estimate ⚡
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
