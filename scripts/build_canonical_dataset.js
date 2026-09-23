const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Ajv = require('ajv');
let addFormats;
try {
  addFormats = require('ajv-formats');
} catch(e) {}

// Initialize Ajv with 2020-12 draft support
const ajv = new Ajv({ allErrors: true, strict: false });
if (typeof addFormats === 'function') {
  try { addFormats(ajv); } catch(e) {}
}

const schemaPath = path.join(__dirname, '../dataset/schema/safety_event.schema.json');
const rawSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajvSchema = { ...rawSchema };
delete ajvSchema.$schema; // Allows standard draft-07 validation with Ajv 6

const validateEvent = ajv.compile(ajvSchema);

// Helpers
function sha256(bufferOrString) {
  return crypto.createHash('sha256').update(bufferOrString).digest('hex');
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/bsee\s+safety\s+alert\s*#?\d*[-:]?\s*/gi, '')
    .replace(/safety\s+alert\s*#?\d*[-:]?\s*/gi, '')
    .replace(/imca\s+sf\s*\d+\/\d+[-:]?\s*/gi, '')
    .replace(/\d+\/\d+[-:]?\s*/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Detection rules
const ENERGY_KEYWORDS = {
  GRAVITATIONAL: ['dropped object', 'crane', 'lifting', 'suspended load', 'fall from height', 'scaffold', 'ladder', 'grating', 'rigging', 'fall arrest', 'harness', 'slings', 'shackle', 'hoist', 'winch line'],
  PRESSURE: ['pressurised', 'pressurized', 'hydraulic', 'pneumatic', 'high pressure', 'psi', 'bar', 'flange release', 'pipe rupture', 'wellbore', 'blowout', 'annulus', 'gas kick', 'relief valve', 'burst', 'autoclave', 'accumulator'],
  CHEMICAL: ['h2s', 'hydrogen sulfide', 'toxic', 'chemical burn', 'hydrocarbon gas', 'sour gas', 'corrosive', 'asphyxiant', 'drilling mud additive'],
  THERMAL: ['fire', 'flame', 'flash fire', 'explosion', 'burn', 'hot work', 'welding', 'torch', 'steam', 'flare', 'combustion', 'ignition'],
  ELECTRICAL: ['electrical', 'arc flash', 'shock', 'high voltage', 'electrocution', 'switchboard', 'transformer', 'breaker', '440v', '480v', 'generator'],
  KINETIC: ['rotating equipment', 'caught between', 'crushed', 'nip point', 'pinch point', 'collision', 'stern thruster', 'propeller', 'spinning', 'drill pipe rotation', 'tong', 'cathead', 'sheave']
};

const IOGP_RULES_MAP = [
  { id: 'IOGP-01', name: 'Bypassing safety controls', terms: ['bypass', 'override', 'defeat', 'interlock bypassed', 'safety device removed'] },
  { id: 'IOGP-02', name: 'Confined space', terms: ['confined space', 'enclosed space', 'tank entry', 'vessel entry', 'atmospheric testing', 'oxygen deficient'] },
  { id: 'IOGP-03', name: 'Driving', terms: ['driving', 'vehicle', 'seatbelt', 'speeding', 'rollover', 'forklift'] },
  { id: 'IOGP-04', name: 'Energy isolation', terms: ['isolation', 'loto', 'lockout', 'tagout', 'isolated', 'depressurise', 'zero energy', 'blinding', 'spading'] },
  { id: 'IOGP-05', name: 'Hot work', terms: ['hot work', 'welding', 'cutting', 'grinding', 'flammable atmosphere', 'fire watch', 'gas testing'] },
  { id: 'IOGP-06', name: 'Line of fire', terms: ['line of fire', 'struck by', 'path of travel', 'stored energy release', 'pinch point', 'snap back'] },
  { id: 'IOGP-07', name: 'Safe mechanical lifting', terms: ['lifting', 'crane', 'rigger', 'banksman', 'sling', 'rigging', 'lift plan', 'exclusion zone', 'load chart', 'suspended load'] },
  { id: 'IOGP-08', name: 'Work authorization', terms: ['permit to work', 'ptw', 'work permit', 'job safety analysis', 'jsa', 'toolbox talk', 'risk assessment', 'unauthorized'] },
  { id: 'IOGP-09', name: 'Working at height', terms: ['working at height', 'fall from height', 'fall protection', 'safety harness', 'scaffold', 'manbasket', 'safety net'] }
];

function analyzeEvent(text, title, sourceOrg, docId, sourceUrl, docHash, pubDate, pageNum = null) {
  const lower = (title + ' ' + text).toLowerCase();
  
  // 1. Detect Energy
  let detectedEnergy = 'UNKNOWN';
  let energyEvidence = null;
  let energySource = null;
  for (const [eType, kws] of Object.entries(ENERGY_KEYWORDS)) {
    for (const kw of kws) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        detectedEnergy = eType;
        const start = Math.max(0, idx - 40);
        const end = Math.min(lower.length, idx + kw.length + 40);
        energyEvidence = (title + ' ' + text).slice(start, end).trim();
        energySource = kw;
        break;
      }
    }
    if (detectedEnergy !== 'UNKNOWN') break;
  }

  // 2. Detect Event Type
  let eventType = 'UNKNOWN';
  if (lower.includes('near miss') || lower.includes('near-miss') || lower.includes('high potential near miss') || lower.includes('close call') || lower.includes('dropped object') && !lower.includes('fatality')) {
    eventType = 'NEAR_MISS';
  } else if (lower.includes('fatality') || lower.includes('fatal') || lower.includes('injury') || lower.includes('hospitalised') || lower.includes('hospitalized') || lower.includes('fire') || lower.includes('explosion') || lower.includes('spill') || lower.includes('damage')) {
    eventType = 'INCIDENT';
  } else if (lower.includes('unsafe act') || lower.includes('failure to follow') || lower.includes('unauthorised') || lower.includes('unauthorized') || lower.includes('bypassed')) {
    eventType = 'UA';
  } else if (lower.includes('unsafe condition') || lower.includes('corrosion') || lower.includes('substandard condition') || lower.includes('defective')) {
    eventType = 'UC';
  } else {
    eventType = 'NEAR_MISS';
  }

  // 3. SIF Potential
  const explicitSifKws = ['high potential', 'hipo', 'sif', 'potential fatality', 'life-threatening', 'catastrophic potential', 'potential for serious injury', 'fatal incident', 'fatal injury'];
  let isExplicitSif = false;
  let sifEvidence = null;
  for (const kw of explicitSifKws) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      isExplicitSif = true;
      const start = Math.max(0, idx - 30);
      const end = Math.min(lower.length, idx + kw.length + 40);
      sifEvidence = (title + ' ' + text).slice(start, end).trim();
      break;
    }
  }

  let sifPotential = 'UNKNOWN';
  let labelType = 'UNKNOWN';
  if (isExplicitSif) {
    sifPotential = 'TRUE';
    labelType = 'EXPLICIT';
  } else if (detectedEnergy !== 'UNKNOWN' && (eventType === 'INCIDENT' || eventType === 'NEAR_MISS')) {
    // Check if high energy release was uncontrolled or barriers compromised
    if (lower.includes('failed') || lower.includes('parted') || lower.includes('dropped') || lower.includes('released') || lower.includes('struck') || lower.includes('damaged')) {
      sifPotential = 'TRUE';
      labelType = 'DERIVED';
      sifEvidence = `Derived SIF: Uncontrolled ${detectedEnergy.toLowerCase()} energy with compromised barrier and line-of-fire exposure`;
    } else {
      sifPotential = 'FALSE';
      labelType = 'DERIVED';
      sifEvidence = `Controlled ${detectedEnergy.toLowerCase()} energy event without acute SIF potential`;
    }
  } else {
    sifPotential = 'UNKNOWN';
    labelType = 'UNKNOWN';
  }

  // 4. Critical Barriers
  const barriers = [];
  const barrierDefs = [
    { type: 'ENGINEERED', name: 'Pressure Relief Device', kws: ['relief valve', 'psv', 'bursting disc', 'prv'] },
    { type: 'ENGINEERED', name: 'Crane Load Moment Indicator / A2B', kws: ['load moment indicator', 'lmi', 'anti-two-block', 'a2b', 'overload limiter'] },
    { type: 'PHYSICAL', name: 'Secondary Retention / Dropped Object Protection', kws: ['secondary retention', 'safety sling', 'snub line', 'whip check', 'safety pin'] },
    { type: 'PHYSICAL', name: 'Fall Arrest System / Guardrail', kws: ['safety harness', 'fall arrest', 'inertia reel', 'handrail', 'guardrail', 'toe board'] },
    { type: 'PROCEDURAL', name: 'Energy Isolation / LOTO', kws: ['isolation certificate', 'loto', 'lockout tagout', 'blind list', 'zero energy check'] },
    { type: 'PROCEDURAL', name: 'Permit to Work & Risk Assessment', kws: ['permit to work', 'ptw', 'risk assessment', 'tra', 'jsa', 'method statement'] },
    { type: 'HUMAN', name: 'Exclusion Zone / Banksman Verification', kws: ['exclusion zone', 'banksman', 'slinger', 'spotter', 'barricade', 'lookout'] }
  ];

  for (const bDef of barrierDefs) {
    for (const kw of bDef.kws) {
      if (lower.includes(kw)) {
        let observedState = 'UNKNOWN';
        let evidenceStr = null;
        if (lower.includes(kw + ' failed') || lower.includes('failure of ' + kw) || lower.includes('not installed') || lower.includes('missing ' + kw) || lower.includes('without ' + kw) || lower.includes('bypassed ' + kw)) {
          observedState = lower.includes('not installed') || lower.includes('without') ? 'MISSING' : 'FAILED';
          evidenceStr = `${bDef.name} reported compromised or missing in incident description`;
        } else if (lower.includes(kw + ' functioned') || lower.includes(kw + ' held') || lower.includes(kw + ' prevented')) {
          observedState = 'EFFECTIVE';
          evidenceStr = `${bDef.name} functioned as designed to arrest or limit hazard`;
        } else if (lower.includes('damaged') || lower.includes('worn') || lower.includes('corroded')) {
          observedState = 'DEGRADED';
          evidenceStr = `${bDef.name} identified in degraded condition`;
        } else {
          observedState = 'FAILED'; // In investigated alerts, barriers mentioned were usually compromised
          evidenceStr = `${bDef.name} involved in incident causal chain`;
        }

        barriers.push({
          barrier_id: `BAR-${String(barriers.length + 1).padStart(2, '0')}`,
          type: bDef.type,
          description: bDef.name,
          expected_state: 'EFFECTIVE',
          observed_state: observedState,
          evidence: evidenceStr
        });
        break;
      }
    }
  }

  // 5. IOGP Life-Saving Rules
  const iogpRules = [];
  for (const rule of IOGP_RULES_MAP) {
    for (const term of rule.terms) {
      if (lower.includes(term)) {
        iogpRules.push({
          rule_id: rule.id,
          rule_name: rule.name,
          status: isExplicitSif ? 'EXPLICIT' : 'DERIVED',
          evidence: `Triggered by textual occurrence of keyword '${term}' in safety alert narrative`,
          mapping_source: 'IOGP Report 590 Life-Saving Rules Framework'
        });
        break;
      }
    }
  }

  // 6. Consequence
  let actualConsequence = 'None reported / Equipment stoppage or minor disruption.';
  let injury = null;
  let fatality = false;
  if (lower.includes('fatality') || lower.includes('fatal') || lower.includes('died') || lower.includes('killed')) {
    actualConsequence = 'Fatal injury occurred.';
    fatality = true;
    injury = 'Fatal injury';
  } else if (lower.includes('lost time') || lower.includes('fracture') || lower.includes('amputation') || lower.includes('hospitalized') || lower.includes('hospitalised')) {
    actualConsequence = 'Lost time / serious personal injury sustained.';
    fatality = false;
    injury = 'Fracture / Lost time injury';
  } else if (lower.includes('first aid') || lower.includes('minor burn') || lower.includes('cut') || lower.includes('bruise') || lower.includes('laceration')) {
    actualConsequence = 'Minor injury requiring first aid or medical attention.';
    fatality = false;
    injury = 'First aid / minor laceration or contusion';
  } else if (lower.includes('near miss') || lower.includes('near-miss') || lower.includes('no injuries')) {
    actualConsequence = 'No injuries occurred (Near Miss / Potential Consequence only).';
    fatality = false;
    injury = 'None';
  }

  let potentialConsequence = 'Local hazard exposure with manageable outcome.';
  if (sifPotential === 'TRUE') {
    if (detectedEnergy === 'GRAVITATIONAL') {
      potentialConsequence = 'Catastrophic crushing / struck-by fatality from dropped heavy load or fall from height.';
    } else if (detectedEnergy === 'PRESSURE') {
      potentialConsequence = 'Fatal injection, impact, or explosion from uncontrolled high-pressure fluid release.';
    } else if (detectedEnergy === 'THERMAL') {
      potentialConsequence = 'Major hydrocarbon fire or explosion resulting in multiple fatalities and facility loss.';
    } else if (detectedEnergy === 'ELECTRICAL') {
      potentialConsequence = 'Electrocution or severe thermal arc-flash blast fatality.';
    } else if (detectedEnergy === 'CHEMICAL') {
      potentialConsequence = 'Fatal toxic gas inhalation or major chemical exposure.';
    } else {
      potentialConsequence = 'Severe or fatal trauma resulting from uncontrolled energetic release.';
    }
  }

  // 7. Context
  let activity = null;
  if (lower.includes('lift') || lower.includes('crane') || lower.includes('rigging')) activity = 'Lifting & Rigging Operations';
  else if (lower.includes('drill') || lower.includes('well') || lower.includes('tripping') || lower.includes('bop')) activity = 'Drilling & Well Intervention';
  else if (lower.includes('diving') || lower.includes('diver') || lower.includes('rov')) activity = 'Subsea & Diving Operations';
  else if (lower.includes('pipe') || lower.includes('flange') || lower.includes('valve') || lower.includes('hydraulic')) activity = 'Piping & Pressure Maintenance';
  else if (lower.includes('weld') || lower.includes('cut') || lower.includes('grind') || lower.includes('torch')) activity = 'Hot Work Operations';
  else if (lower.includes('marine') || lower.includes('vessel') || lower.includes('mooring') || lower.includes('thruster')) activity = 'Marine & Vessel Operations';
  else activity = 'General Industrial / Offshore Operations';

  // 8. Quality Tiering
  let datasetTier = 'BRONZE';
  let overallQuality = 'MEDIUM';
  if (text.length >= 300 && detectedEnergy !== 'UNKNOWN' && barriers.length > 0 && docHash && sourceUrl) {
    datasetTier = 'GOLD';
    overallQuality = 'HIGH';
  } else if (text.length >= 100 && (detectedEnergy !== 'UNKNOWN' || isExplicitSif) && docHash) {
    datasetTier = 'SILVER';
    overallQuality = 'HIGH';
  } else {
    datasetTier = 'BRONZE';
    overallQuality = 'MEDIUM';
  }

  // Raw narrative & Source excerpt
  const rawNarrative = cleanText(text.length > 15 ? text : title);
  const normalizedNarrative = rawNarrative.replace(/\s+/g, ' ').slice(0, 3000);
  const sourceExcerpt = rawNarrative.slice(0, 350);

  return {
    eventType,
    detectedEnergy,
    energyEvidence,
    energySource,
    sifPotential,
    labelType,
    sifEvidence,
    barriers,
    iogpRules,
    actualConsequence,
    potentialConsequence,
    injury,
    fatality,
    activity,
    datasetTier,
    overallQuality,
    rawNarrative,
    normalizedNarrative,
    sourceExcerpt
  };
}

module.exports = {
  analyzeEvent,
  validateEvent,
  sha256,
  normalizeTitle,
  stripHtml,
  cleanText
};
