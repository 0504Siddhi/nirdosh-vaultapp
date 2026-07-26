import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api/client';
import { Info, Lock } from 'lucide-react';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#f59e0b', '#10b981'];
  return { score, label: labels[score] || '', color: colors[score] || '#ef4444' };
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('sanjay@demo.in');
  const [password, setPassword] = useState('demo123');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const { data } = await api.post(endpoint, payload);
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 pt-24 relative z-10">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-saffron-500 to-green-600 flex items-center justify-center text-sm font-black text-white tracking-tight shadow-lg shadow-saffron-500/20">
              NV
            </div>
            <div>
              <div className="font-extrabold text-lg leading-tight">Nirdosh Vault</div>
              <div className="text-xs text-slate-500">Consensus Identity Engine</div>
            </div>
          </div>

          <div className="flex bg-white rounded-lg p-1 mb-8">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-slate-100 text-navy-950' : 'text-slate-500 hover:text-navy-950'}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-slate-100 text-navy-950' : 'text-slate-500 hover:text-navy-950'}`}
              onClick={() => setIsLogin(false)}
            >
              Create Account
            </button>
          </div>

          {isLogin && (
            <div className="flex gap-3 p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
              <Info className="shrink-0" size={18} />
              <div>Demo credentials pre-filled: <strong>sanjay@demo.in / Demo1234</strong></div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 text-center">
              {Array.isArray(error) ? error.map(e => e.message).join(', ') : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="As on Aadhaar" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required 
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
              <input 
                type="email" 
                className="input" 
                placeholder="your@email.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                placeholder={isLogin ? '••••••••' : 'Min 8 chars, 1 uppercase, 1 number'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {/* Password strength bar — only on signup */}
              {!isLogin && password && (() => {
                const { score, label, color } = passwordStrength(password);
                return (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= score ? color : 'rgba(148,163,184,0.2)' }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
                  </div>
                );
              })()}
            </div>
            
            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Authenticating...' : isLogin ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-500">use synthetic documents only</span></div>
          </div>

          <p className="text-xs text-slate-500 text-center flex items-start gap-1.5">
            <Lock className="shrink-0 text-slate-500" size={14} />
            <span>Demo prototype. Do not upload real Aadhaar, PAN, or sensitive personal documents.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
