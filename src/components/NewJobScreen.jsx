import { JOB_TYPES } from '../data/jobTypes';

export default function NewJobScreen({ onSelect, onBack }) {
  return (
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
              onClick={() => onSelect(jt.id)}
              className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#f59e0b] rounded-xl p-5 text-left transition-all group"
            >
              <div className="text-3xl mb-3">{jt.icon}</div>
              <p className="condensed text-lg font-bold text-white group-hover:text-[#f59e0b] transition-colors leading-tight">{jt.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
