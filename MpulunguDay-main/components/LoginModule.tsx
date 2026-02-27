import React, { useState } from 'react';
import { AuthUser, Student, Teacher } from '../types';

interface LoginModuleProps {
  onLogin: (user: AuthUser) => void;
  students: Student[];
  teachers: Teacher[];
  schoolName: string;
  schoolLogo: string;
}

export const LoginModule: React.FC<LoginModuleProps> = ({ onLogin, students, teachers, schoolName, schoolLogo }) => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const input = credential.trim();
    const pass = password.trim();

    // 1. Admin Logic
    if (input.toLowerCase() === 'admin' && (pass === 'admin' || pass === '')) {
      onLogin({ id: 'ADMIN-01', name: 'System Administrator', emailOrId: 'admin', role: 'ADMIN' });
      return;
    }

    // 2. Attendance Officer Logic
    if (input.toLowerCase() === 'attendance') {
      onLogin({ id: 'AO-01', name: 'Attendance Officer', emailOrId: 'attendance', role: 'ATTENDANCE_OFFICER' });
      return;
    }

    // 3. Student Logic (MDS...)
    if (input.toUpperCase().startsWith('MDS')) {
      const student = students.find(s => s.id.toUpperCase() === input.toUpperCase());
      if (student) {
        onLogin({ 
          id: student.id, 
          name: student.name, 
          emailOrId: student.id, 
          role: 'STUDENT',
          meta: { class: student.class }
        });
        return;
      }
    }

    // 4. Teacher Logic (Email, Username, Password)
    const teacher = teachers.find(t => 
      t.email.toLowerCase() === input.toLowerCase() || 
      (t.username && t.username.toLowerCase() === input.toLowerCase())
    );

    if (teacher) {
      // If teacher has a password set, verify it
      if (teacher.password && teacher.password !== pass) {
        setError('Incorrect password.');
        return;
      }
      
      onLogin({ 
        id: teacher.id, 
        name: teacher.name, 
        emailOrId: teacher.email, 
        role: 'TEACHER',
        meta: { subject: teacher.subject }
      });
      return;
    }

    setError('Invalid credentials. Check your Identity and Password.');
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center p-6 overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-blue-950/40 backdrop-blur-2xl border border-sky-500/20 p-10 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-sky-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.4)] overflow-hidden">
              {schoolLogo ? (
                <img src={schoolLogo} className="w-full h-full object-contain p-2 bg-white" alt="School Logo" />
              ) : (
                <i className="fas fa-graduation-cap text-3xl text-white"></i>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">{schoolName}</h1>
              <p className="text-sky-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Institutional Access Portal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Credential</label>
              <div className="relative group">
                <i className="fas fa-fingerprint absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors"></i>
                <input 
                  type="text" 
                  value={credential}
                  onChange={(e) => { setCredential(e.target.value); setError(''); }}
                  placeholder="Email, Username or MDS Number"
                  className="w-full bg-black/40 border-2 border-sky-900/30 rounded-2xl p-4 pl-12 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
              <div className="relative group">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border-2 border-sky-900/30 rounded-2xl p-4 pl-12 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all placeholder:text-slate-700"
                />
              </div>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest ml-1">Leave blank if not set</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3 animate-shake">
                <i className="fas fa-exclamation-circle text-rose-500 text-xs"></i>
                <p className="text-[10px] font-black text-rose-500 uppercase">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Authorize Access <i className="fas fa-arrow-right"></i>
            </button>
          </form>

          <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
             <div className="p-3 bg-blue-900/20 rounded-xl text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Staff</p>
                <p className="text-[9px] font-bold text-slate-300">Use Email Address</p>
             </div>
             <div className="p-3 bg-blue-900/20 rounded-xl text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Students</p>
                <p className="text-[9px] font-bold text-slate-300">Use MDS Number</p>
             </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-600 text-[9px] font-bold uppercase tracking-widest">
          Secure Academic Management Environment &bull; v2.5.0
        </p>
      </div>
    </div>
  );
};