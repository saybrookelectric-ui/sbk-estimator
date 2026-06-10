import { useState } from 'react';
import { JOB_TYPES } from '../data/jobTypes';
import RewireWizard from './RewireWizard';

export default function NewJobScreen({ onSelect, onBack, settings }) {
  const [showWizard, setShowWizard] = useState(false);

  const handleSelect = (jobTypeId) => {
    if (jobTypeId === 'rewire') {
      setShowWizard(true);
    } else {
      onSelect(jobTypeId, []);
    }
  };

  const handleWizardComplete = (lineItems, answers) => {
    setShowWizard(false);
    // Pass rewire job type + generated line items + wizard answers for notes
    const wiringLabels = {
      knob_tube: 'Knob & Tube',
      aluminum: 'Aluminum wiring',
      romex: 'Romex/NM-B',
      unknown: 'Unknown wiring type',
    };
    const sqftLabels = {
      under1000: 'Under 1,000 sq ft',
      '1000_1500': '1,000–1,500 sq ft',
      '1500_2000': '1,500–2,000 sq ft',
      '2000_2500': '2,000–2,500 sq ft',
      over2500: 'Over 2,500 sq ft',
    };
    const notes = [
      `PRELIMINARY ESTIMATE — Site visit required to confirm scope.`,
      `House: ${sqftLabels[answers.sqft]}, ${answers.stories} stor${answers.stories === '1' ? 'y' : 'ies'}, ${answers.basementType} basement`,
      `Wiring: ${wiringLabels[answers.wiringType]}`,
      `Rooms: ${answers.bedrooms} bed / ${answers.bathrooms} bath${answers.hasKitchen ? ' / kitchen' : ''}${answers.hasLaundry ? ' / laundry' : ''}${answers.hasOffice ? ' / office' : ''}`,
      `Panel: Currently ${answers.currentPanel.toUpperCase()}, upgrade: ${answers.panelUpgrade}`,
    ].join('\n');

    onSelect('rewire', lineItems, notes);
  };

  return (
    <>
      {showWizard && (
        <RewireWizard
          onComplete={handleWizardComplete}
          onSkip={() => { setShowWizard(false); onSelect('rewire', []); }}
          settings={settings}
        />
      )}

      <div className="min-h-screen bg-black text-white">
        <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-5 py-4 flex items-center gap-4">
          <button onClick={onBack} className="text-[#555] hover:text-[#f59e0b] transition-colors text-sm">← Back</button>
          <div className="h-4 w-px bg-[#222]" />
          <h2 className="condensed text-xl font-black text-white">SELECT JOB TYPE</h2>
        </div>

        <div className="max-w-3xl mx-auto px-5 py-8">
          <p className="text-[#555] text-sm mb-6">Choose the type of job to estimate. Each type has pre-built assemblies and NEC 2023 defaults.</p>
          <div className="grid grid-cols-2 gap-3">
            {JOB_TYPES.map(jt => (
              <button
                key={jt.id}
                onClick={() => handleSelect(jt.id)}
                className={`bg-[#0d0d0d] border rounded-xl p-5 text-left transition-all group relative ${
                  jt.id === 'rewire'
                    ? 'border-[#f59e0b]/30 hover:border-[#f59e0b]'
                    : 'border-[#1a1a1a] hover:border-[#f59e0b]'
                }`}
              >
                {jt.id === 'rewire' && (
                  <span className="absolute top-3 right-3 text-xs bg-[#f59e0b] text-black font-bold px-2 py-0.5 rounded-full">
                    Wizard
                  </span>
                )}
                <div className="text-3xl mb-3">{jt.icon}</div>
                <p className="condensed text-lg font-bold text-white group-hover:text-[#f59e0b] transition-colors leading-tight">{jt.label}</p>
                {jt.id === 'rewire' && (
                  <p className="text-xs text-[#444] mt-1">Auto-generates estimate from room count</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
