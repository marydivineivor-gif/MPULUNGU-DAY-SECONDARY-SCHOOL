import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Student } from '../types';

interface StudentModuleProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  isSyncing?: boolean;
}

export const StudentModule: React.FC<StudentModuleProps> = ({ students, setStudents, isSyncing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegForm, setShowRegForm] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastDeletedStudents, setLastDeletedStudents] = useState<Student[]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    dateOfAdmission: '',
    club: '',
    guardianName: '',
    residentialAddress: '',
    contact: '',
    status: 'Active' as Student['status'],
    isOVC: false,
    isKGS: false,
    isCAMFED: false
  });

  const nextId = useMemo(() => {
    if (editingStudentId) return editingStudentId;
    if (students.length === 0) return 'MDS000001';
    const numericIds = students
      .map(s => parseInt(s.id.replace('MDS', '')))
      .filter(n => !isNaN(n));
    const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return `MDS${String(max + 1).padStart(6, '0')}`;
  }, [students, editingStudentId]);

  const filtered = useMemo(() => {
    return students
      .filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [students, searchTerm]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isCameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(err => {
        console.error("Camera Access Denied:", err);
        alert("Could not access camera.");
        setIsCameraActive(false);
      });
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isCameraActive, facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      if (context) {
        if (facingMode === 'user') {
          context.translate(canvasRef.current.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.85));
        setIsCameraActive(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudentId) {
      setStudents(prev => prev.map(s => s.id === editingStudentId ? { ...formData, id: editingStudentId, photo: capturedPhoto || s.photo } as Student : s).sort((a, b) => a.id.localeCompare(b.id)));
    } else {
      setStudents(prev => [...prev, { ...formData, id: nextId, photo: capturedPhoto || undefined } as Student].sort((a, b) => a.id.localeCompare(b.id)));
    }
    closeForm();
  };

  const handleEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({ ...student });
    setCapturedPhoto(student.photo || null);
    setShowRegForm(true);
    setViewingStudent(null);
  };

  const handleDelete = (id: string) => {
    const studentToDelete = students.find(s => s.id === id);
    if (studentToDelete) {
      setLastDeletedStudents([studentToDelete]);
      setStudents(prev => prev.filter(s => s.id !== id));
      setShowUndoToast(true);
      
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setShowUndoToast(false);
        setLastDeletedStudents([]);
      }, 5000);
    }
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    setLastDeletedStudents([...students]);
    setStudents([]);
    setShowUndoToast(true);
    
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndoToast(false);
      setLastDeletedStudents([]);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (lastDeletedStudents.length > 0) {
      setStudents(prev => {
        const combined = [...prev, ...lastDeletedStudents];
        // Remove duplicates just in case
        const unique = Array.from(new Map(combined.map(s => [s.id, s])).values());
        return unique.sort((a, b) => a.id.localeCompare(b.id));
      });
      setLastDeletedStudents([]);
      setShowUndoToast(false);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const closeForm = () => {
    setShowRegForm(false);
    setEditingStudentId(null);
    setFormData({ 
      name: '', 
      class: '', 
      gender: 'Male', 
      dob: '', 
      dateOfAdmission: '', 
      club: '', 
      guardianName: '', 
      residentialAddress: '', 
      contact: '', 
      status: 'Active',
      isOVC: false,
      isKGS: false,
      isCAMFED: false
    });
    setCapturedPhoto(null);
    setIsCameraActive(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '---';
    return dateStr.split('-').reverse().join('/');
  };

  const parseImportDate = (rawDate: string): string => {
    if (!rawDate) return '';
    const parts = rawDate.split(/[./-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return rawDate; 
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parts[2];
      if (y.length === 2) y = `20${y}`;
      return `${y}-${m}-${d}`;
    }
    return rawDate;
  };

  const downloadCSVTemplate = () => {
    const headers = "ID,Name,Class,Gender,DOB,DateOfAdmission,Club,GuardianName,Address,Contact,Status\n";
    const example = "MDS000001,John Doe,Grade 10 A,Male,15/05/2008,10/01/2024,Chess Club,Mary Doe,123 Smart St,+260977000000,Active\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = text.split(/\r?\n/).filter(line => line.trim());
          if (rows.length < 2) return alert("File appears empty or missing data rows.");
          
          const dataRows = rows.slice(1); 
          let lastIdNum = students.length > 0 
            ? Math.max(...students.map(s => parseInt(s.id.replace('MDS', ''))).filter(n => !isNaN(n))) 
            : 0;

          const newStudents: Student[] = dataRows.map((row) => {
            const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || [];
            
            let rawId = cols[0] || '';
            const finalId = (rawId.toUpperCase().startsWith('MDS')) 
              ? rawId.toUpperCase() 
              : `MDS${String(++lastIdNum).padStart(6, '0')}`;

            return {
              id: finalId,
              name: cols[1] || 'Imported Student',
              class: cols[2] || 'Unassigned',
              gender: (cols[3] || 'Male') as any,
              dob: parseImportDate(cols[4] || ''),
              dateOfAdmission: parseImportDate(cols[5] || ''),
              club: cols[6] || '',
              guardianName: cols[7] || '',
              residentialAddress: cols[8] || '',
              contact: cols[9] || '',
              status: (cols[10] || 'Active') as any
            };
          });

          const existingIds = new Set(students.map(s => s.id));
          const uniqueNewStudents = newStudents.filter(ns => !existingIds.has(ns.id));
          
          if (uniqueNewStudents.length > 0) {
            setStudents(prev => [...prev, ...uniqueNewStudents].sort((a, b) => a.id.localeCompare(b.id)));
            alert(`Successfully added ${uniqueNewStudents.length} new records.`);
          } else {
            alert("No unique student records found (Possible duplicates).");
          }
        } catch (err) {
          console.error("Import failed:", err);
          alert("CSV Parsing failed. Please check your column format.");
        }
        e.target.value = ''; 
      };
      reader.readAsText(file);
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return alert("No records.");
    const headers = "ID,Name,Class,Gender,DOB,DateOfAdmission,Club,GuardianName,Address,Contact,Status\n";
    const rows = filtered.map(s => `${s.id},"${s.name}","${s.class}",${s.gender},${s.dob},${s.dateOfAdmission},"${s.club}","${s.guardianName}","${s.residentialAddress.replace(/"/g, '""')}",${s.contact},${s.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_registry_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'Active': return 'bg-sky-950 text-sky-400 border-sky-500/20';
      case 'Alumni': return 'bg-blue-900/40 text-blue-400 border-blue-500/20';
      case 'Transferred': return 'bg-amber-900/40 text-amber-400 border-amber-500/20';
      case 'Dropped out': return 'bg-rose-900/40 text-rose-400 border-rose-500/20';
      default: return 'bg-blue-950 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-blue-950/40 p-4 rounded-2xl border border-sky-900/30 shadow-lg no-print">
        <div className="flex items-center gap-3 self-start lg:self-center">
           <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-id-card text-white text-lg"></i></div>
           <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Student Registry</h2>
              {isSyncing && <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest mt-1 animate-pulse">Syncing to Cloud...</p>}
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[150px]">
            <input type="text" placeholder="Search..." className="w-full bg-black border border-sky-900/30 rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-sky-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <i className="fas fa-search absolute right-4 top-3.5 text-slate-500 text-xs"></i>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => { closeForm(); setShowRegForm(true); }} className="flex-1 sm:flex-none bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> New
            </button>
            
            <button onClick={downloadCSVTemplate} className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-900/50 text-sky-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-sky-900/30 flex items-center justify-center gap-2">
              <i className="fas fa-file-csv"></i> Template
            </button>
            
            <label className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-900/50 text-sky-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-sky-900/30 cursor-pointer flex items-center justify-center gap-2">
              <i className="fas fa-upload"></i> Import
              <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
            </label>
            
            <button onClick={handleExportCSV} className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-900/50 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-sky-900/30 flex items-center justify-center gap-2">
              <i className="fas fa-download"></i> Export
            </button>

            <button onClick={handleClearAll} className="flex-1 sm:flex-none bg-rose-900/30 hover:bg-rose-600 text-rose-400 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-rose-900/30 flex items-center justify-center gap-2 transition-all">
              <i className="fas fa-trash-sweep"></i> Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-950/20 rounded-3xl border border-sky-900/30 overflow-hidden shadow-2xl">
        <div className="table-container">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-black/50 border-b border-sky-900/30">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/20">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-sky-500/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black border border-sky-900/30 overflow-hidden flex items-center justify-center shadow-md">
                        {student.photo ? <img src={student.photo} className="w-full h-full object-cover" alt="" /> : <i className="fas fa-user text-sky-800"></i>}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase group-hover:text-sky-400 transition-colors">{student.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{student.class}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-sky-400">{student.id}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${getStatusColor(student.status)}`}>{student.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setViewingStudent(student)} className="w-9 h-9 rounded-lg bg-blue-900/20 text-sky-400 hover:text-white border border-sky-900/30 transition-all"><i className="fas fa-eye text-xs"></i></button>
                      <button onClick={() => handleEdit(student)} className="w-9 h-9 rounded-lg bg-blue-900/20 text-sky-400 hover:text-white border border-sky-900/30 transition-all"><i className="fas fa-pen text-xs"></i></button>
                      <button onClick={() => handleDelete(student.id)} className="w-9 h-9 rounded-lg bg-blue-900/20 text-rose-400 hover:text-white border border-rose-900/30 transition-all"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
             <i className="fas fa-users-slash text-5xl text-sky-900/20"></i>
             <p className="text-slate-600 font-black uppercase text-xs tracking-widest">No student records found</p>
             <button onClick={() => setSearchTerm('')} className="text-sky-500 text-[10px] font-black uppercase underline">Clear search</button>
          </div>
        )}
      </div>

      {/* UNDO TOAST */}
      {showUndoToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-blue-950 border border-sky-500/30 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-trash-alt text-xs"></i>
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">
                {lastDeletedStudents.length > 1 ? `${lastDeletedStudents.length} records deleted` : 'Student record deleted'}
              </p>
            </div>
            <button 
              onClick={handleUndoDelete}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <i className="fas fa-undo"></i> Redo
            </button>
          </div>
        </div>
      )}

      {/* VIEW STUDENT PROFILE MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-blue-950 border border-sky-900/50 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="relative h-48 bg-sky-600/10 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-t from-blue-950 to-transparent"></div>
                 <button onClick={() => setViewingStudent(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-sky-500 transition-all"><i className="fas fa-times"></i></button>
              </div>
              <div className="px-8 pb-8 -mt-20 relative">
                 <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                    <div className="w-32 h-32 rounded-[32px] border-4 border-blue-950 bg-black overflow-hidden shadow-2xl shrink-0">
                       {viewingStudent.photo ? <img src={viewingStudent.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sky-900"><i className="fas fa-user-graduate text-4xl"></i></div>}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{viewingStudent.name}</h3>
                       <p className="text-sky-500 font-black uppercase text-[10px] tracking-widest">{viewingStudent.id} • {viewingStudent.class}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Guardian', value: viewingStudent.guardianName, icon: 'fa-user-shield' },
                      { label: 'Contact', value: viewingStudent.contact, icon: 'fa-phone' },
                      { label: 'Address', value: viewingStudent.residentialAddress, icon: 'fa-map-marker-alt' },
                      { label: 'Gender', value: viewingStudent.gender, icon: 'fa-venus-mars' },
                      { label: 'DOB', value: formatDateDisplay(viewingStudent.dob), icon: 'fa-calendar' },
                      { label: 'Admission', value: formatDateDisplay(viewingStudent.dateOfAdmission), icon: 'fa-id-badge' },
                      { label: 'Club/Society', value: viewingStudent.club || 'None', icon: 'fa-users' },
                      { label: 'Current Status', value: viewingStudent.status, icon: 'fa-info-circle' }
                    ].map((item, i) => (
                      <div key={i} className="bg-black/50 p-4 rounded-2xl border border-sky-900/30 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-sky-500 text-sm shadow-inner"><i className={`fas ${item.icon}`}></i></div>
                         <div className="overflow-hidden">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{item.label}</p>
                            <p className="text-xs font-bold text-white uppercase truncate">{item.value}</p>
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="mt-8 flex gap-4">
                    <button onClick={() => handleEdit(viewingStudent)} className="flex-1 bg-sky-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Edit Record</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* REGISTRATION / EDIT FORM */}
      {showRegForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-blue-950 border border-sky-900/30 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 border-b border-sky-900/30 flex justify-between items-center sticky top-0 bg-blue-950 z-10">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{editingStudentId ? 'Modify Account' : 'Institutional Enrollment'}</h3>
                <p className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mt-1">Ref ID: {nextId}</p>
              </div>
              <button onClick={closeForm} className="w-12 h-12 rounded-2xl bg-black border border-sky-900/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Legal Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Class Group</label>
                    <input required value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none uppercase focus:border-sky-600 transition-all" placeholder="e.g. 10A" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Birth Date</label>
                      <input type="date" required value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-sky-600 outline-none" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Admission</label>
                      <input type="date" required value={formData.dateOfAdmission} onChange={e => setFormData({...formData, dateOfAdmission: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-sky-600 outline-none" />
                   </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Residential Address</label>
                  <input required value={formData.residentialAddress} onChange={e => setFormData({...formData, residentialAddress: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" placeholder="123 Smart Ave" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden relative group border-2 border-sky-900/30">
                  {capturedPhoto ? (
                    <div className="relative h-full w-full">
                      <img src={capturedPhoto} className="w-full h-full object-cover" alt="Captured" />
                      <button type="button" onClick={() => setCapturedPhoto(null)} className="absolute top-4 right-4 bg-rose-600 text-white w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-transform active:scale-90"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  ) : (isCameraActive ? <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} /> : <div className="flex flex-col items-center justify-center h-full text-sky-900 space-y-4"><i className="fas fa-camera text-5xl"></i><p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-800">Camera Terminal Ready</p></div>)}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-opacity duration-300">
                    {!isCameraActive && !capturedPhoto ? (
                      <button type="button" onClick={() => setIsCameraActive(true)} className="bg-sky-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-transform">Initialize Capture</button>
                    ) : isCameraActive && (
                      <div className="flex gap-4">
                        <button type="button" onClick={handleCapture} className="bg-emerald-600 text-white w-16 h-16 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"><i className="fas fa-camera text-xl"></i></button>
                        <button type="button" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="bg-blue-900 text-white w-16 h-16 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"><i className="fas fa-sync-alt text-xl"></i></button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Guardian / Parent</label>
                    <input required value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" placeholder="Guardian Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Emergency Contact</label>
                    <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all font-mono" placeholder="+260..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Club Membership</label>
                    <input value={formData.club} onChange={e => setFormData({...formData, club: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" placeholder="e.g. Chess Club" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Account Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all">
                      <option>Active</option><option>Alumni</option><option>Transferred</option><option>Dropped out</option>
                    </select>
                  </div>
                </div>

                <div className="bg-black/40 p-6 rounded-3xl border border-sky-900/20 space-y-4">
                  <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest border-b border-sky-900/20 pb-2">Bursary & Vulnerability Status</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-sky-900/10 cursor-pointer hover:bg-sky-500/5 transition-colors">
                      <input type="checkbox" checked={formData.isOVC} onChange={e => setFormData({...formData, isOVC: e.target.checked})} className="w-5 h-5 rounded bg-black border-sky-900/30 text-sky-500 focus:ring-sky-600" />
                      <div>
                        <p className="text-xs font-black text-white uppercase">OVC (Orphaned/Vulnerable)</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Tagged by Grade Teacher</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-sky-900/10 cursor-pointer hover:bg-sky-500/5 transition-colors">
                      <input type="checkbox" checked={formData.isKGS} onChange={e => setFormData({...formData, isKGS: e.target.checked})} className="w-5 h-5 rounded bg-black border-sky-900/30 text-sky-500 focus:ring-sky-600" />
                      <div>
                        <p className="text-xs font-black text-white uppercase">KGS (Keeping Girls in School)</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Tagged by Guidance & Counseling</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-sky-900/10 cursor-pointer hover:bg-sky-500/5 transition-colors">
                      <input type="checkbox" checked={formData.isCAMFED} onChange={e => setFormData({...formData, isCAMFED: e.target.checked})} className="w-5 h-5 rounded bg-black border-sky-900/30 text-sky-500 focus:ring-sky-600" />
                      <div>
                        <p className="text-xs font-black text-white uppercase">CAMFED</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Tagged by Guidance & Counseling</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-sky-900/30">
                <button type="button" onClick={closeForm} className="order-2 md:order-1 px-8 py-4 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Discard Form</button>
                <button type="submit" className="order-1 md:order-2 bg-sky-500 hover:bg-sky-600 text-white px-12 py-4 rounded-2xl text-[10px] font-black uppercase shadow-2xl transition-all active:scale-95 shadow-sky-500/20">Commit to Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};