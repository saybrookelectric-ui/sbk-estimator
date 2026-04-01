import { useState, useRef, useEffect } from 'react';
import { Input, SectionLabel, YellowBtn, GhostBtn } from './UI';
import { startQBAuth, isQBConnected, hasRefreshToken, clearQBTokens, getQBTokens } from '../utils/quickbooks';

export default function SettingsPage({ settings, onSave, onBack }) {
  const [local, setLocal] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [qbConnected, setQbConnected] = useState(isQBConnected() || hasRefreshToken());
  const [qbConnecting, setQbConnecting] = useState(false);
  const [qbError, setQbError] = useState('');
  const logoRef = useRef(null);

  const upd = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const save = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => setLocal(p => ({ ...p, logoBase64: ev.target.result, logoName: file.name }));
    reader.readAsDataURL(file);
  };

  const handleQBConnect = async () => {
    if (!local.qbClientId?.trim()) {
      setQbError('Enter your QuickBooks Client ID first, then save Settings before connecting.');
      return;
    }
    setQbError('');
    setQbConnecting(true);
    onSave(local);
    // Use stored redirect URI or fall back to current URL, always ensure trailing slash
    const redirectUri = local.qbRedirectUri?.trim() ||
      (window.location.origin + window.location.pathname).replace(/\/?$/, '/');
    try {
      await startQBAuth(local.qbClientId.trim(), redirectUri);
    } catch (e) {
      setQbError(e.message);
      setQbConnecting(false);
    }
  };

  const handleQBDisconnect = () => {
    if (confirm('Disconnect QuickBooks? You can reconnect anytime.')) {
      clearQBTokens();
      setQbConnected(false);
    }
  };

  const tokens = getQBTokens();
  const realmId = tokens?.realmId;

  const [activeTab, setActiveTab] = useState('company');
  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'logo', label: 'Logo' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'quickbooks', label: 'QuickBooks' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-[#444] hover:text-[#f59e0b] text-sm transition-colors">← Back</button>
          <div className="h-4 w-px bg-[#1a1a1a]" />
          <h2 className="condensed text-xl font-black">SETTINGS</h2>
        </div>
        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === t.id ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-transparent text-[#444] hover:text-[#A7A5A6]'}`}>
              {t.label}
              {t.id === 'quickbooks' && qbConnected && (
                <span className="ml-1.5 w-2 h-2 bg-green-400 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* COMPANY */}
        {activeTab === 'company' && (
          <div className="space-y-4">
            <SectionLabel>Company Information</SectionLabel>
            <p className="text-xs text-[#444]">Appears on all printed quotes.</p>
            {[
              { k: 'companyName', label: 'Company Name', placeholder: 'Saybrook Electric, LLC.' },
              { k: 'companyAddress', label: 'Address', placeholder: '123 Main St, Jefferson, OH 44047' },
              { k: 'companyPhone', label: 'Phone', placeholder: '(440) 555-0100' },
              { k: 'companyEmail', label: 'Email', placeholder: 'info@saybrookelectric.com' },
              { k: 'companyLicense', label: 'License #', placeholder: 'OH-E-12345' },
            ].map(f => (
              <Input key={f.k} label={f.label} value={local[f.k]} onChange={v => upd(f.k, v)} placeholder={f.placeholder} />
            ))}
          </div>
        )}

        {/* LOGO */}
        {activeTab === 'logo' && (
          <div className="space-y-5">
            <SectionLabel>Company Logo</SectionLabel>
            <p className="text-xs text-[#444]">Appears on printed quotes. PNG with transparent background recommended.</p>
            {local.logoBase64 ? (
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
                <p className="text-xs text-[#444] mb-3">{local.logoName}</p>
                <div className="bg-white rounded-lg p-4 inline-block">
                  <img src={local.logoBase64} alt="Logo" className="max-h-20 max-w-xs object-contain" />
                </div>
                <div className="flex gap-3 mt-4">
                  <GhostBtn size="sm" onClick={() => logoRef.current?.click()}>Replace</GhostBtn>
                  <button onClick={() => setLocal(p => ({ ...p, logoBase64: null, logoName: null }))}
                    className="text-sm text-red-400 hover:text-red-300 border border-[#222] px-3 py-1.5 rounded-lg">Remove</button>
                </div>
              </div>
            ) : (
              <div onClick={() => logoRef.current?.click()}
                className="border-2 border-dashed border-[#1a1a1a] hover:border-[#f59e0b]/40 rounded-xl py-12 text-center cursor-pointer transition-colors group">
                <div className="text-4xl mb-3">🖼</div>
                <p className="text-sm text-[#444] group-hover:text-[#f59e0b] transition-colors font-semibold">Click to upload logo</p>
                <p className="text-xs text-[#333] mt-1">PNG, JPG, SVG — horizontal logos work best</p>
              </div>
            )}
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
          </div>
        )}

        {/* PRICING */}
        {activeTab === 'pricing' && (
          <div className="space-y-5">
            <SectionLabel>Pricing Defaults</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Labor Rate ($/hr)" type="number" value={local.laborRate} onChange={v => upd('laborRate', parseFloat(v) || 95)} hint="Fully loaded shop rate" />
              <Input label="Default Markup (%)" type="number" value={local.defaultMarkup} onChange={v => upd('defaultMarkup', parseFloat(v) || 20)} hint="Applied to material + labor" />
            </div>
            <div>
              <SectionLabel>Pricing Mode</SectionLabel>
              <div className="space-y-2">
                {[
                  { id: 'material_labor', label: 'Material + Labor', desc: 'Enter mat cost and labor hours separately' },
                  { id: 'both', label: 'Both (recommended)', desc: 'All-in override available, auto-calculates if blank' },
                ].map(m => (
                  <button key={m.id} onClick={() => upd('pricingMode', m.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${local.pricingMode === m.id ? 'border-[#f59e0b] bg-[#f59e0b]/5' : 'border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#2a2a2a]'}`}>
                    <p className={`text-sm font-semibold ${local.pricingMode === m.id ? 'text-[#f59e0b]' : 'text-[#A7A5A6]'}`}>{m.label}</p>
                    <p className="text-xs text-[#444] mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUICKBOOKS */}
        {activeTab === 'quickbooks' && (
          <div className="space-y-6">
            <div>
              <SectionLabel>QuickBooks Online Integration</SectionLabel>
              <p className="text-xs text-[#444] mb-4">Push estimates directly to QuickBooks Online. Requires a free Intuit Developer account.</p>
            </div>

            {/* Connection status */}
            <div className={`rounded-xl p-4 border ${qbConnected ? 'border-green-800/50 bg-green-950/20' : 'border-[#1a1a1a] bg-[#0d0d0d]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${qbConnected ? 'bg-green-400' : 'bg-[#333]'}`} />
                  <div>
                    <p className={`text-sm font-bold ${qbConnected ? 'text-green-400' : 'text-[#555]'}`}>
                      {qbConnected ? 'Connected to QuickBooks Online' : 'Not connected'}
                    </p>
                    {qbConnected && realmId && (
                      <p className="text-xs text-[#444] mt-0.5">Company ID: {realmId}</p>
                    )}
                  </div>
                </div>
                {qbConnected ? (
                  <button onClick={handleQBDisconnect}
                    className="text-xs text-red-400 hover:text-red-300 border border-[#222] px-3 py-1.5 rounded-lg transition-colors">
                    Disconnect
                  </button>
                ) : (
                  <YellowBtn onClick={handleQBConnect} disabled={qbConnecting} size="sm">
                    {qbConnecting ? 'Redirecting...' : 'Connect QuickBooks'}
                  </YellowBtn>
                )}
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-3">
              <SectionLabel>API Credentials</SectionLabel>
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 text-xs text-[#555] space-y-1 mb-3">
                <p>1. Go to <span className="text-[#f59e0b]">developer.intuit.com</span> → sign in with your QB account</p>
                <p>2. Click <strong className="text-[#A7A5A6]">Dashboard → Create an App → QuickBooks Online</strong></p>
                <p>3. Go to <strong className="text-[#A7A5A6]">Settings → Redirect URIs</strong> and add your app URL exactly as shown in the Redirect URI field below</p>
                <p>4. Copy your <strong className="text-[#A7A5A6]">Client ID</strong> and <strong className="text-[#A7A5A6]">Client Secret</strong> from Keys &amp; Credentials → Development</p>
                <p>5. Fill in all fields below, Save Settings, then click Connect QuickBooks</p>
              </div>
              <div className="bg-[#111] border border-[#f59e0b]/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-[#f59e0b] font-semibold mb-1">Your Redirect URI — copy this exactly into Intuit:</p>
                <p className="text-xs font-mono text-white break-all bg-[#0d0d0d] rounded px-2 py-1.5">
                  {local.qbRedirectUri?.trim() || 'https://saybrookelectric-ui.github.io/sbk-estimator/'}
                </p>
              </div>
              <Input
                label="Redirect URI (must match Intuit exactly)"
                value={local.qbRedirectUri || ''}
                onChange={v => upd('qbRedirectUri', v)}
                placeholder="https://saybrookelectric-ui.github.io/sbk-estimator/"
                hint="Copy from Intuit → Settings → Redirect URIs. Include trailing slash."
              />
              <Input
                label="Client ID"
                value={local.qbClientId || ''}
                onChange={v => upd('qbClientId', v)}
                placeholder="ABCDEFGHIJKLMNabcdefghijklmn12345678"
              />
              <Input
                label="Client Secret"
                value={local.qbClientSecret || ''}
                onChange={v => upd('qbClientSecret', v)}
                placeholder="Your QuickBooks Client Secret"
              />
              <p className="text-xs text-[#333]">These are stored locally on your device only and never sent anywhere except directly to Intuit's servers.</p>
            </div>

            {qbError && (
              <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 text-xs text-red-400">
                {qbError}
              </div>
            )}

            {/* Environment toggle */}
            <div>
              <SectionLabel>Environment</SectionLabel>
              <div className="flex gap-2">
                {[
                  { id: 'production', label: 'Production', desc: 'Your real QB company' },
                  { id: 'sandbox', label: 'Sandbox', desc: 'Test environment' },
                ].map(e => (
                  <button key={e.id} onClick={() => upd('qbEnvironment', e.id)}
                    className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors ${(local.qbEnvironment || 'production') === e.id ? 'border-[#f59e0b] bg-[#f59e0b]/5' : 'border-[#1a1a1a] bg-[#0d0d0d]'}`}>
                    <p className={`text-sm font-semibold ${(local.qbEnvironment || 'production') === e.id ? 'text-[#f59e0b]' : 'text-[#A7A5A6]'}`}>{e.label}</p>
                    <p className="text-xs text-[#444]">{e.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#333] mt-2">Start with Sandbox to test — use your sandbox QB credentials from developer.intuit.com</p>
            </div>
          </div>
        )}

        <YellowBtn onClick={save} className="w-full" size="lg">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </YellowBtn>
      </div>
    </div>
  );
}
