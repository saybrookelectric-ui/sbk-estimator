import { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      if (data?.session) onLogin(data.session);
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚡</div>
        <h1 className="condensed text-3xl font-black text-white tracking-tight">SBK ESTIMATOR</h1>
        <p className="text-[#444] text-sm mt-1">Saybrook Electric, LLC.</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-bold text-lg">Sign In</h2>

        <form onSubmit={handleLogin} className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="shane@saybrookelectric.com"
              autoComplete="email"
              required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#f59e0b] transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] text-xs transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f59e0b] disabled:opacity-50 text-black font-black py-3 rounded-lg text-sm transition-opacity hover:opacity-90 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="text-[#333] text-xs mt-6">
        Access restricted — authorized users only
      </p>
    </div>
  );
}
