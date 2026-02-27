import React, { useState } from 'react';
import { AuthUser, Teacher } from '../types';

interface ProfileModuleProps {
  authUser: AuthUser;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({ authUser, teachers, setTeachers }) => {
  const teacher = teachers.find(t => t.id === authUser.id);
  
  const [username, setUsername] = useState(teacher?.username || '');
  const [password, setPassword] = useState(teacher?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(teacher?.password || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!teacher) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800">
        <p className="text-slate-500 font-black uppercase tracking-widest">Profile settings only available for staff members.</p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setTeachers(prev => prev.map(t => 
      t.id === teacher.id 
        ? { ...t, username: username.trim(), password: password.trim() } 
        : t
    ));

    setMessage({ type: 'success', text: 'Credentials updated successfully. Use these for your next login.' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <i className="fas fa-user-shield text-[12rem] text-sky-500"></i>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Security Settings</h2>
          <p className="text-sky-500 text-[12px] font-black uppercase tracking-[0.4em] mt-2">Customise Your Login Credentials</p>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-[40px] shadow-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Personal Username</label>
              <div className="relative group">
                <i className="fas fa-at absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors"></i>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a custom username"
                  className="w-full bg-black/40 border-2 border-slate-800 rounded-2xl p-4 pl-12 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all"
                />
              </div>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest ml-1">You can use this instead of your email to login.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors"></i>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border-2 border-slate-800 rounded-2xl p-4 pl-12 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                  <i className="fas fa-check-double absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors"></i>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border-2 border-slate-800 rounded-2xl p-4 pl-12 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}>
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
            </div>
          )}

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button 
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center gap-3"
            >
              Update Credentials <i className="fas fa-shield-alt"></i>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-950/20 border border-blue-900/30 p-6 rounded-3xl flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
          <i className="fas fa-info-circle text-blue-400"></i>
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Security Note</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
            Your credentials are encrypted and stored securely in the institutional cloud. 
            If you forget your password, please contact the System Administrator for a reset.
          </p>
        </div>
      </div>
    </div>
  );
};
