// SBK Estimator — Job Types & Assembly Defaults
// Each job type has assemblies (pre-built line items) the user picks from

export const JOB_TYPES = [
  { id: 'rewire', label: 'Whole House Rewire', icon: '🏠', color: '#f59e0b' },
  { id: 'service', label: 'Service Upgrade / Panel', icon: '⚡', color: '#f59e0b' },
  { id: 'ev_charger', label: 'EV Charger', icon: '🔌', color: '#f59e0b' },
  { id: 'generator', label: 'Generator & Transfer Switch', icon: '🔋', color: '#f59e0b' },
  { id: 'remodel', label: 'Kitchen / Bath Remodel', icon: '🔧', color: '#f59e0b' },
  { id: 'fan_fixture', label: 'Ceiling Fan / Light Fixture', icon: '💡', color: '#f59e0b' },
  { id: 'hot_tub', label: 'Hot Tub / Pool', icon: '🌊', color: '#f59e0b' },
  { id: 'outdoor', label: 'Outdoor / Landscape', icon: '🌿', color: '#f59e0b' },
  { id: 'smoke_co', label: 'Smoke & CO Detector Install', icon: '🚨', color: '#f59e0b' },
  { id: 'custom', label: 'Custom / Misc Job', icon: '📋', color: '#A7A5A6' },
];

// Assembly = a pre-priced line item with material cost and labor hours
// User picks which assemblies apply, adjusts qty, can override price
export const JOB_ASSEMBLIES = {
  service: [
    { id: 'panel_100a', name: '100A Panel (main breaker)', material: 165, laborHrs: 6, unit: 'each', notes: 'Includes new panel, main breaker, and trim' },
    { id: 'panel_200a', name: '200A Panel (main breaker)', material: 285, laborHrs: 8, unit: 'each', notes: 'Includes new panel, main breaker, and trim' },
    { id: 'panel_400a', name: '400A Panel / Meter-Main', material: 650, laborHrs: 12, unit: 'each' },
    { id: 'meter_base', name: 'Meter Base Replacement', material: 120, laborHrs: 3, unit: 'each' },
    { id: 'service_entrance', name: 'Service Entrance Cable (SER)', material: 185, laborHrs: 4, unit: 'each' },
    { id: 'ground_rod', name: 'Ground Rod & Clamp', material: 22, laborHrs: 1, unit: 'each' },
    { id: 'arc_flash_label', name: 'Arc Flash Label', material: 8, laborHrs: 0.25, unit: 'each' },
    { id: 'load_calc', name: 'Load Calculation', material: 0, laborHrs: 1.5, unit: 'each', notes: 'NEC 220 load calculation for service sizing' },
    { id: 'breaker_single', name: 'Single Pole Breaker', material: 12, laborHrs: 0.25, unit: 'each' },
    { id: 'breaker_single_afci', name: 'Single Pole AFCI Breaker', material: 45, laborHrs: 0.25, unit: 'each' },
    { id: 'breaker_double', name: 'Double Pole Breaker', material: 18, laborHrs: 0.25, unit: 'each' },
    { id: 'permit', name: 'Permit Fee', material: 250, laborHrs: 2, unit: 'job' },
    { id: 'inspection', name: 'Inspection Coordination', material: 0, laborHrs: 2, unit: 'job' },
  ],
  ev_charger: [
    { id: 'ev_circuit_50a', name: '50A/240V Circuit for EVSE', material: 120, laborHrs: 3.5, unit: 'each', notes: '6 AWG wire, 2-pole 50A breaker' },
    { id: 'ev_circuit_40a', name: '40A/240V Circuit for EVSE', material: 95, laborHrs: 3, unit: 'each', notes: '8 AWG wire, 2-pole 40A breaker' },
    { id: 'nema_1450', name: 'NEMA 14-50 Receptacle', material: 28, laborHrs: 0.5, unit: 'each' },
    { id: 'nema_630', name: 'NEMA 6-30 Receptacle', material: 22, laborHrs: 0.5, unit: 'each' },
    { id: 'evse_hardwire', name: 'EVSE Hardwire Connection (customer supplied charger)', material: 15, laborHrs: 1.5, unit: 'each' },
    { id: 'ev_load_mgmt', name: 'Load Management Device', material: 185, laborHrs: 1, unit: 'each', notes: 'For panels near capacity' },
    { id: 'conduit_outdoor', name: 'Conduit Run (outdoor/garage, per 10ft)', material: 18, laborHrs: 0.5, unit: '10ft' },
    { id: 'panel_breaker_dp', name: 'Double Pole Breaker', material: 18, laborHrs: 0.25, unit: 'each' },
    { id: 'permit_ev', name: 'Permit Fee', material: 150, laborHrs: 1.5, unit: 'job' },
  ],
  generator: [
    { id: 'transfer_switch_manual', name: 'Manual Transfer Switch (6-8 circuit)', material: 285, laborHrs: 6, unit: 'each' },
    { id: 'transfer_switch_auto', name: 'Automatic Transfer Switch (ATS)', material: 850, laborHrs: 10, unit: 'each' },
    { id: 'interlock_kit', name: 'Generator Interlock Kit', material: 65, laborHrs: 1.5, unit: 'each', notes: 'Code-compliant panel interlock' },
    { id: 'inlet_box_30a', name: 'Generator Inlet Box (30A)', material: 55, laborHrs: 2, unit: 'each' },
    { id: 'inlet_box_50a', name: 'Generator Inlet Box (50A)', material: 75, laborHrs: 2, unit: 'each' },
    { id: 'gen_cord_30a', name: 'Generator Cord (30A, 25ft)', material: 85, laborHrs: 0, unit: 'each' },
    { id: 'gen_circuit_240', name: '240V Generator Feed Circuit', material: 95, laborHrs: 3, unit: 'each' },
    { id: 'standby_install', name: 'Standby Generator Wiring & Connection', material: 185, laborHrs: 8, unit: 'each', notes: 'Does not include generator unit' },
    { id: 'gas_line_coord', name: 'Gas Line Coordination (sub)', material: 0, laborHrs: 1, unit: 'job', notes: 'Subcontractor coordination' },
    { id: 'permit_gen', name: 'Permit Fee', material: 250, laborHrs: 2, unit: 'job' },
  ],
  remodel: [
    { id: 'kitchen_small_app', name: 'Small Appliance Circuit (20A)', material: 55, laborHrs: 2.5, unit: 'each', notes: 'NEC 210.11(C)(1) requires min 2' },
    { id: 'kitchen_lighting', name: 'Kitchen Lighting Circuit (15A)', material: 45, laborHrs: 2.5, unit: 'each' },
    { id: 'dishwasher_circuit', name: 'Dishwasher Circuit (20A dedicated)', material: 65, laborHrs: 3, unit: 'each' },
    { id: 'disposal_circuit', name: 'Disposal Circuit (20A)', material: 55, laborHrs: 2.5, unit: 'each' },
    { id: 'microwave_circuit', name: 'Microwave Circuit (20A dedicated)', material: 55, laborHrs: 2.5, unit: 'each' },
    { id: 'refrigerator_circuit', name: 'Refrigerator Circuit (20A dedicated)', material: 55, laborHrs: 2.5, unit: 'each' },
    { id: 'bath_receptacle', name: 'Bathroom Receptacle Circuit (20A)', material: 55, laborHrs: 2.5, unit: 'each', notes: 'NEC 210.11(C)(3) dedicated' },
    { id: 'bath_lighting', name: 'Bathroom Lighting Circuit (15A)', material: 45, laborHrs: 2.5, unit: 'each' },
    { id: 'exhaust_fan', name: 'Exhaust Fan & Switch', material: 85, laborHrs: 2, unit: 'each' },
    { id: 'gfci_receptacle', name: 'GFCI Receptacle', material: 18, laborHrs: 0.35, unit: 'each' },
    { id: 'recessed_light', name: 'Recessed Light (can + trim)', material: 25, laborHrs: 0.75, unit: 'each' },
    { id: 'under_cab_lighting', name: 'Under Cabinet Lighting Circuit', material: 55, laborHrs: 2, unit: 'each' },
    { id: 'range_circuit', name: 'Range/Oven Circuit (240V 50A)', material: 120, laborHrs: 3.5, unit: 'each' },
    { id: 'permit_remodel', name: 'Permit Fee', material: 175, laborHrs: 1.5, unit: 'job' },
  ],
  fan_fixture: [
    { id: 'fan_new_box', name: 'Ceiling Fan - New Fan-Rated Box & Brace', material: 25, laborHrs: 1.5, unit: 'each', notes: 'Old work fan-rated box' },
    { id: 'fan_existing_box', name: 'Ceiling Fan - Existing Box (verify rated)', material: 5, laborHrs: 0.75, unit: 'each' },
    { id: 'fan_with_light_switch', name: 'Fan/Light Separate Switch Leg', material: 45, laborHrs: 2, unit: 'each', notes: '14/3 wire for separate fan & light control' },
    { id: 'fan_install', name: 'Fan Installation (customer supplied)', material: 5, laborHrs: 1, unit: 'each' },
    { id: 'fixture_swap', name: 'Light Fixture Swap (existing box)', material: 5, laborHrs: 0.5, unit: 'each' },
    { id: 'fixture_new_circuit', name: 'New Lighting Circuit (15A)', material: 45, laborHrs: 2.5, unit: 'each' },
    { id: 'dimmer_switch', name: 'Dimmer Switch', material: 25, laborHrs: 0.35, unit: 'each' },
    { id: 'smart_switch', name: 'Smart Switch / Wifi Dimmer', material: 45, laborHrs: 0.5, unit: 'each' },
    { id: 'chandelier_heavy', name: 'Chandelier / Heavy Fixture (medallion box)', material: 35, laborHrs: 2, unit: 'each' },
  ],
  hot_tub: [
    { id: 'hottub_circuit', name: 'Hot Tub Circuit (240V/50A GFCI)', material: 185, laborHrs: 5, unit: 'each', notes: 'NEC 680.43 — 6 AWG, GFCI breaker' },
    { id: 'hottub_disconnect', name: 'Disconnect Box (within sight, 5-10ft)', material: 65, laborHrs: 1.5, unit: 'each', notes: 'NEC 680.12 — lockable disconnect required' },
    { id: 'hottub_bonding', name: 'Equipotential Bonding (pool/tub)', material: 45, laborHrs: 2, unit: 'each', notes: 'NEC 680.26 — bonding grid required' },
    { id: 'pool_pump_circuit', name: 'Pool Pump Circuit (240V/20A)', material: 95, laborHrs: 3.5, unit: 'each' },
    { id: 'pool_lighting', name: 'Pool/Spa Lighting Circuit (GFCI)', material: 75, laborHrs: 2.5, unit: 'each' },
    { id: 'gfci_breaker_dp', name: 'Double Pole GFCI Breaker', material: 85, laborHrs: 0.25, unit: 'each' },
    { id: 'conduit_underground', name: 'Underground Conduit Run (per 10ft)', material: 22, laborHrs: 0.75, unit: '10ft', notes: 'PVC schedule 40, does not include trenching' },
    { id: 'trenching', name: 'Trenching (subcontractor, per 10ft)', material: 15, laborHrs: 0, unit: '10ft' },
    { id: 'permit_hottub', name: 'Permit Fee', material: 250, laborHrs: 2, unit: 'job' },
  ],
  outdoor: [
    { id: 'outdoor_circuit_20a', name: 'Outdoor Receptacle Circuit (20A GFCI)', material: 65, laborHrs: 3, unit: 'each', notes: 'NEC 210.8(A)(3) — GFCI required' },
    { id: 'outlet_weatherproof', name: 'Weatherproof Outlet (in-use cover)', material: 22, laborHrs: 0.5, unit: 'each' },
    { id: 'landscape_lighting', name: 'Low Voltage Landscape Lighting Circuit', material: 55, laborHrs: 2, unit: 'each' },
    { id: 'post_light', name: 'Post Light / Lamp Post', material: 45, laborHrs: 2.5, unit: 'each', notes: 'Includes underground feed stub-up' },
    { id: 'security_light', name: 'Motion Security Light', material: 35, laborHrs: 1.5, unit: 'each' },
    { id: 'outdoor_panel_circuit', name: 'Outdoor Sub-Panel / Disconnect', material: 185, laborHrs: 4, unit: 'each' },
    { id: 'underground_feed', name: 'Underground Feed (per 10ft, direct burial)', material: 12, laborHrs: 0.5, unit: '10ft' },
    { id: 'trenching_outdoor', name: 'Trenching (subcontractor, per 10ft)', material: 15, laborHrs: 0, unit: '10ft' },
    { id: 'gfci_outdoor', name: 'GFCI Receptacle (weatherproof)', material: 28, laborHrs: 0.5, unit: 'each' },
    { id: 'permit_outdoor', name: 'Permit Fee', material: 150, laborHrs: 1.5, unit: 'job' },
  ],
  smoke_co: [
    { id: 'smoke_interconnected', name: 'Smoke Detector (interconnected, hardwired)', material: 28, laborHrs: 0.75, unit: 'each', notes: 'NEC 760, NFPA 72 — new circuit or existing' },
    { id: 'co_detector', name: 'CO Detector (hardwired)', material: 35, laborHrs: 0.75, unit: 'each' },
    { id: 'combo_smoke_co', name: 'Combination Smoke/CO Detector', material: 55, laborHrs: 0.75, unit: 'each' },
    { id: 'smoke_circuit', name: 'New Smoke Detector Circuit (15A)', material: 45, laborHrs: 2.5, unit: 'each', notes: 'Required when no existing interconnect circuit' },
    { id: 'smoke_battery', name: 'Smoke Detector (battery backup, replace only)', material: 22, laborHrs: 0.35, unit: 'each' },
    { id: 'smoke_inspection', name: 'Full System Test & Inspection', material: 0, laborHrs: 1, unit: 'job' },
  ],
  custom: [
    { id: 'custom_circuit_15a', name: '15A Circuit', material: 45, laborHrs: 2.5, unit: 'each' },
    { id: 'custom_circuit_20a', name: '20A Circuit', material: 55, laborHrs: 2.5, unit: 'each' },
    { id: 'custom_circuit_240', name: '240V Circuit (30A)', material: 95, laborHrs: 3.5, unit: 'each' },
    { id: 'custom_outlet', name: 'Outlet / Receptacle', material: 8, laborHrs: 0.35, unit: 'each' },
    { id: 'custom_switch', name: 'Switch', material: 6, laborHrs: 0.25, unit: 'each' },
    { id: 'custom_labor', name: 'Labor Only (per hour)', material: 0, laborHrs: 1, unit: 'hour' },
    { id: 'custom_permit', name: 'Permit Fee', material: 150, laborHrs: 1.5, unit: 'job' },
  ],
};

// Rewire uses the full room-builder from RewireEstimator logic
// Other job types use the assembly picker

export const WALL_TYPES = [
  { id: 'drywall', label: 'Drywall', multiplier: 1.0 },
  { id: 'plaster', label: 'Plaster & Lath', multiplier: 1.6 },
  { id: 'concrete', label: 'Concrete Block', multiplier: 1.8 },
  { id: 'brick', label: 'Brick', multiplier: 2.0 },
  { id: 'paneling', label: 'Wood Paneling', multiplier: 1.1 },
];

export const ACCESS_TYPES = [
  { id: 'open_attic', label: 'Open Attic Above', multiplier: 1.0 },
  { id: 'insulated_attic', label: 'Insulated Attic', multiplier: 1.2 },
  { id: 'open_basement', label: 'Open Basement Below', multiplier: 1.0 },
  { id: 'finished_basement', label: 'Finished Basement', multiplier: 1.4 },
  { id: 'slab', label: 'Slab Foundation', multiplier: 1.3 },
  { id: 'crawlspace', label: 'Crawl Space', multiplier: 1.2 },
  { id: 'no_access', label: 'No Access', multiplier: 1.7 },
];

export const DEFAULT_SETTINGS = {
  laborRate: 95,
  defaultMarkup: 20,
  companyName: 'Saybrook Electric, LLC.',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyLicense: '',
  logoBase64: null,
  logoName: null,
  pricingMode: 'both',
};
