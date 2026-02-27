import React, { useState } from 'react';
import { Teacher } from '../types';

interface TeacherModuleProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

export const TeacherModule: React.FC<TeacherModuleProps> = ({ teachers, setTeachers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegForm, setShowRegForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    contact: '',
    status: 'Active' as Teacher['status'],
    username: '',
    password: ''
  });

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      subject: teacher.subject || '',
      email: teacher.email,
      contact: teacher.contact,
      status: teacher.status,
      username: teacher.username || '',
      password: teacher.password || ''
    });
    setShowRegForm(true);
  };

  const handleDelete = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const filtered = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...editingTeacher, ...formData } : t));
    } else {
      const newTeacher: Teacher = {
        ...formData,
        id: `T${String(teachers.length + 1).padStart(3, '0')}`
      };
      setTeachers([newTeacher, ...teachers]);
    }
    setShowRegForm(false);
    setEditingTeacher(null);
    setFormData({ name: '', subject: '', email: '', contact: '', status: 'Active', username: '', password: '' });
  };

  const handleCloseForm = () => {
    setShowRegForm(false);
    setEditingTeacher(null);
    setFormData({ name: '', subject: '', email: '', contact: '', status: 'Active', username: '', password: '' });
  };

  const downloadCSVTemplate = () => {
    const headers = "ID,Name,Subject,Email,Contact,Status\n";
    const example = "T001,John Smith,Mathematics,john@school.edu,+260977123456,Active\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher_import_template.csv';
    a.click();
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No staff records to export.");
      return;
    }
    const headers = "ID,Name,Subject,Email,Contact,Status\n";
    const rows = filtered.map(t => 
      `${t.id},"${t.name}","${t.subject || ''}",${t.email},${t.contact},${t.status}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_registry_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1); // Skip header
        const newTeachers: Teacher[] = rows
          .filter(row => row.trim() !== '' && row.includes(','))
          .map((row, index) => {
            const cols = row.split(',');
            let rawId = cols[0]?.trim() || '';
            
            // Generate valid Txxx ID if empty or malformed
            const finalId = (rawId.toUpperCase().startsWith('T')) 
              ? rawId.toUpperCase() 
              : `T${String(teachers.length + index + 1).padStart(3, '0')}`;

            return {
              id: finalId,
              name: cols[1]?.trim() || 'Unknown Staff',
              subject: cols[2]?.trim() || 'N/A',
              email: cols[3]?.trim() || `staff${index}@school.edu`,
              contact: cols[4]?.trim() || 'N/A',
              status: (cols[5]?.trim() as any) || 'Active'
            };
          });
        setTeachers(prev => [...newTeachers, ...prev]);
        // Reset file input
        e.target.value = '';
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-chalkboard-teacher text-white text-sm"></i>
           </div>
           <h2 className="text-xl font-black text-white uppercase tracking-tighter">Staff Registry</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search Name, Subject or Email..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute right-3 top-2.5 text-slate-500 text-xs"></i>
          </div>
          
          <button 
            onClick={() => setShowRegForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <i className="fas fa-plus"></i> New Teacher
          </button>

          <button 
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-file-excel"></i> Export CSV
          </button>

          <button 
            onClick={downloadCSVTemplate}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700"
          >
            <i className="fas fa-file-csv mr-1"></i> Template
          </button>

          <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700 cursor-pointer">
            <i className="fas fa-cloud-upload-alt mr-1"></i> Bulk Import
            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
          </label>
        </div>
      </div>

      {showRegForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={handleCloseForm} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-widest">Full Legal Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all" placeholder="e.g. John Smith" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-widest">Subject Specialization</label>
                <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-widest">Institutional Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all" placeholder="e.g. teacher@school.edu" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-widest">Contact Number</label>
                <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all font-mono" placeholder="+123..." />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-widest">Teacher Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-slate-800 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all">
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-widest">Custom Username</label>
                  <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-widest">Access Password</label>
                  <input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all" placeholder="Optional" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={handleCloseForm} className="px-6 py-2 rounded-lg text-sm font-black text-slate-500 uppercase hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8 py-2 rounded-lg text-sm font-black text-white uppercase shadow-lg transition-all active:scale-95">{editingTeacher ? 'Update Record' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Information</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Specialization</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(teacher => (
                <tr key={teacher.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-white uppercase group-hover:text-blue-400 transition-colors">{teacher.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{teacher.id} • {teacher.contact}</p>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-xs text-blue-400 font-black uppercase tracking-tighter bg-blue-400/10 px-3 py-1 rounded-lg border border-blue-400/20">{teacher.subject}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300 font-mono font-bold">{teacher.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        teacher.status === 'Active' ? 'bg-green-900/40 text-green-400 border-green-500/20' : 'bg-red-900/40 text-red-400 border-red-500/20'
                      }`}>
                        {teacher.status}
                      </span>
                      <button 
                        onClick={() => handleEdit(teacher)}
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all shadow-md active:scale-90"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(teacher.id)}
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-md active:scale-90"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-32 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
                <i className="fas fa-search text-3xl text-slate-800"></i>
              </div>
              <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">No staff records match your query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};