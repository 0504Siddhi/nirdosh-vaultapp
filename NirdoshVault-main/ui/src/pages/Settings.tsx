import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api/client';
import { User, Lock, AlertTriangle, Check, Loader2 } from 'lucide-react';

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

export default function Settings() {
  const { user, setAuth, token, logout } = useAuthStore();
  const navigate = useNavigate();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const strength = passwordStrength(newPw);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const { data } = await api.put('/auth/me', { name });
      setAuth(data.user, token!);
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      setProfileMsg(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    if (strength.score < 2) {
      setPwError('New password is too weak. Add uppercase letters, numbers, or symbols.');
      return;
    }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwMsg('Password changed successfully!');
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/auth/me');
      logout();
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto min-h-screen pb-20 relative z-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-saffron-500 bg-saffron-500/10 border border-saffron-500/20 mb-3">
          ⚙️ Settings
        </div>
        <h2 className="text-3xl font-bold">Account Settings</h2>
        <p className="text-slate-500 mt-1">Manage your profile, security, and data</p>
      </div>

      {/* Profile Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-saffron-500/15 flex items-center justify-center">
            <User size={18} className="text-saffron-500" />
          </div>
          <div>
            <h3 className="font-bold">Profile</h3>
            <p className="text-xs text-slate-500">Update your display name</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
            <input type="email" className="input opacity-60 cursor-not-allowed" value={user?.email || ''} readOnly />
            <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed in this demo</p>
          </div>
          {profileMsg && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${profileMsg.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              <Check size={14} /> {profileMsg}
            </div>
          )}
          <button type="submit" disabled={profileSaving} className="btn btn-primary">
            {profileSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Lock size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold">Change Password</h3>
            <p className="text-xs text-slate-500">Requires your current password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
            />
            {/* Strength bar */}
            {newPw && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength.score ? strength.color : 'rgba(148,163,184,0.2)' }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>
          {pwMsg && <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20"><Check size={14} />{pwMsg}</div>}
          {pwError && <div className="text-sm p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">{pwError}</div>}
          <button type="submit" disabled={pwSaving} className="btn btn-primary">
            {pwSaving ? <><Loader2 size={16} className="animate-spin" /> Changing...</> : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-500/20 bg-red-500/[0.02]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-red-400">Danger Zone</h3>
            <p className="text-xs text-slate-500">This action is irreversible</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Deleting your account removes all uploaded documents, analyses, and your user record from the system immediately. This cannot be undone.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Type <strong>DELETE</strong> to confirm</label>
            <input
              type="text"
              className="input border-red-500/30 focus:border-red-500"
              placeholder="DELETE"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleting}
            className="btn bg-red-500 text-white hover:bg-red-400 disabled:opacity-40"
          >
            {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : 'Delete My Account & All Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
