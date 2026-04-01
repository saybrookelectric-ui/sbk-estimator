// Shared UI primitives using SBK brand colors

export function Input({ label, value, onChange, placeholder, type = 'text', hint, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-[#A7A5A6] uppercase tracking-wider mb-1.5">{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#f59e0b] transition-colors"
      />
      {hint && <p className="text-xs text-[#555] mt-1">{hint}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-[#A7A5A6] uppercase tracking-wider mb-1.5">{label}</label>}
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b] transition-colors"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-[#A7A5A6] uppercase tracking-wider mb-1.5">{label}</label>}
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#f59e0b] resize-none transition-colors"
      />
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-[#A7A5A6] mb-3">{children}</p>
  );
}

export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#111] border border-[#222] rounded-xl ${onClick ? 'cursor-pointer hover:border-[#f59e0b]/40 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function YellowBtn({ children, onClick, disabled, className = '', size = 'md' }) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#f59e0b] hover:bg-yellow-300 disabled:opacity-40 text-black font-bold rounded-lg transition-colors ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, className = '', size = 'md' }) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return (
    <button
      onClick={onClick}
      className={`border border-[#333] text-[#A7A5A6] hover:text-white hover:border-[#555] rounded-lg transition-colors ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }) {
  const map = {
    draft: 'bg-[#222] text-[#888]',
    sent: 'bg-yellow-900/40 text-yellow-400',
    approved: 'bg-green-900/40 text-green-400',
    signed: 'bg-green-800/50 text-green-300',
    declined: 'bg-red-900/40 text-red-400',
    complete: 'bg-blue-900/40 text-blue-400',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[status] || map.draft}`}>
      {status}
    </span>
  );
}
