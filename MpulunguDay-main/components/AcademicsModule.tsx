import React, { useState } from 'react';
import { Department, Subject, ClassInfo, ClassAllocation, Teacher } from '../types';

type SubTab = 'DEPARTMENTS' | 'SUBJECTS' | 'CLASSES' | 'ALLOCATIONS';
type ModalMode = 'CREATE' | 'EDIT' | 'VIEW';

interface AcademicsModuleProps {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  classes: ClassInfo[];
  setClasses: React.Dispatch<React.SetStateAction<ClassInfo[]>>;
  allocations: ClassAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<ClassAllocation[]>>;
  teachers: Teacher[];
}

export const AcademicsModule: React.FC<AcademicsModuleProps> = ({
  departments, setDepartments, subjects, setSubjects, classes, setClasses, allocations, setAllocations, teachers
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('DEPARTMENTS');
  
  const [showModal, setShowModal] = useState<SubTab | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('CREATE');

  // Form States
  const [deptForm, setDeptForm] = useState<Partial<Department>>({ name: '', hodId: '', teacherIds: [], subjectIds: [] });
  const [subForm, setSubForm] = useState<Partial<Subject>>({ name: '', code: '', departmentId: '' });
  const [classForm, setClassForm] = useState<Partial<ClassInfo>>({ name: '', gradeTeacherId: '', subjectIds: [] });
  const [allocForm, setAllocForm] = useState<Partial<ClassAllocation>>({ classId: '', teacherId: '', subjectId: '' });
  
  // Active Record being viewed/edited
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  // --- DELETE HANDLERS ---
  const handleDeleteDept = (id: string) => {
    setDepartments(departments.filter(d => d.id !== id));
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleDeleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  const handleDeleteAlloc = (id: string) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  // --- SUBMIT HANDLERS ---
  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'CREATE') {
      const newDept: Department = {
        id: `DEP${Date.now()}`,
        name: deptForm.name || '',
        hodId: deptForm.hodId || '',
        teacherIds: deptForm.teacherIds || [],
        subjectIds: deptForm.subjectIds || []
      };
      setDepartments([...departments, newDept]);
    } else {
      setDepartments(departments.map(d => d.id === activeRecordId ? { ...d, ...deptForm } as Department : d));
    }
    closeModal();
  };

  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'CREATE') {
      const newSub: Subject = {
        id: `SUB${Date.now()}`,
        name: subForm.name || '',
        code: subForm.code || '',
        departmentId: subForm.departmentId || ''
      };
      setSubjects([...subjects, newSub]);
    } else {
      setSubjects(subjects.map(s => s.id === activeRecordId ? { ...s, ...subForm } as Subject : s));
    }
    closeModal();
  };

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'CREATE') {
      const newClass: ClassInfo = {
        id: `CLS${Date.now()}`,
        name: classForm.name || '',
        gradeTeacherId: classForm.gradeTeacherId || '',
        subjectIds: classForm.subjectIds || []
      };
      setClasses([...classes, newClass]);
    } else {
      setClasses(classes.map(c => c.id === activeRecordId ? { ...c, ...classForm } as ClassInfo : c));
    }
    closeModal();
  };

  const handleAllocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'CREATE') {
      const newAlloc: ClassAllocation = {
        id: `AL${Date.now()}`,
        classId: allocForm.classId || '',
        teacherId: allocForm.teacherId || '',
        subjectId: allocForm.subjectId || ''
      };
      setAllocations([...allocations, newAlloc]);
    } else {
      setAllocations(allocations.map(a => a.id === activeRecordId ? { ...a, ...allocForm } as ClassAllocation : a));
    }
    closeModal();
  };

  // --- MODAL UTILS ---
  const openModal = (tab: SubTab, mode: ModalMode = 'CREATE', recordId: string | null = null) => {
    setModalMode(mode);
    setShowModal(tab);
    setActiveRecordId(recordId);

    if (mode === 'EDIT' || mode === 'VIEW') {
      if (tab === 'DEPARTMENTS') {
        const d = departments.find(i => i.id === recordId);
        if (d) setDeptForm({ ...d });
      } else if (tab === 'SUBJECTS') {
        const s = subjects.find(i => i.id === recordId);
        if (s) setSubForm({ ...s });
      } else if (tab === 'CLASSES') {
        const c = classes.find(i => i.id === recordId);
        if (c) setClassForm({ ...c });
      } else if (tab === 'ALLOCATIONS') {
        const a = allocations.find(i => i.id === recordId);
        if (a) setAllocForm({ ...a });
      }
    } else {
      setDeptForm({ name: '', hodId: '', teacherIds: [], subjectIds: [] });
      setSubForm({ name: '', code: '', departmentId: '' });
      setClassForm({ name: '', gradeTeacherId: '', subjectIds: [] });
      setAllocForm({ classId: '', teacherId: '', subjectId: '' });
    }
  };

  const closeModal = () => {
    setShowModal(null);
    setActiveRecordId(null);
    setModalMode('CREATE');
  };

  const toggleSelection = (list: string[], item: string) => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  const renderDepartments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Departments</h3>
        <button onClick={() => openModal('DEPARTMENTS', 'CREATE')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-lg">
          <i className="fas fa-plus mr-2"></i> Create Department
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const hod = teachers.find(t => t.id === dept.hodId);
          return (
            <div key={dept.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-blue-500/50 transition-all flex flex-col shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-blue-400 font-black uppercase text-sm">{dept.name}</h4>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{dept.id}</span>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <i className="fas fa-user-tie text-xs text-slate-500"></i>
                  <span className="text-xs text-white"><span className="text-slate-500">HOD:</span> {hod?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-users text-xs text-slate-500"></i>
                  <span className="text-xs text-slate-300">{dept.teacherIds.length} Teachers Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-book text-xs text-slate-500"></i>
                  <span className="text-xs text-slate-300">{dept.subjectIds.length} Subjects Linked</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex gap-4">
                <button 
                  onClick={() => openModal('DEPARTMENTS', 'VIEW', dept.id)}
                  className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-eye"></i> View
                </button>
                <button 
                  onClick={() => openModal('DEPARTMENTS', 'EDIT', dept.id)}
                  className="text-[9px] font-black uppercase text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button 
                  onClick={() => handleDeleteDept(dept.id)}
                  className="text-[9px] font-black uppercase text-slate-500 hover:text-red-400 transition-colors ml-auto flex items-center gap-1"
                >
                  <i className="fas fa-trash-alt"></i> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Subjects Catalog</h3>
        <button onClick={() => openModal('SUBJECTS', 'CREATE')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-lg">
          <i className="fas fa-plus mr-2"></i> Add New Subject
        </button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="table-container">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Subject Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Code</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Department</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {subjects.map(sub => {
              const dept = departments.find(d => d.id === sub.departmentId);
              return (
                <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white">{sub.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">{sub.code}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{dept?.name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openModal('SUBJECTS', 'EDIT', sub.id)}
                      className="text-slate-600 hover:text-white transition-colors"
                    >
                      <i className="fas fa-edit mr-3"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Class Management</h3>
        <button onClick={() => openModal('CLASSES', 'CREATE')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-lg">
          <i className="fas fa-plus mr-2"></i> Create Class
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map(cls => {
          const gradeTeacher = teachers.find(t => t.id === cls.gradeTeacherId);
          return (
            <div key={cls.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl hover:border-blue-500/30 transition-all group">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-black text-white uppercase group-hover:text-blue-400 transition-colors">{cls.name}</h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModal('CLASSES', 'EDIT', cls.id)} className="text-slate-600 hover:text-blue-400" title="Edit Class"><i className="fas fa-edit text-xs"></i></button>
                  <button onClick={() => handleDeleteClass(cls.id)} className="text-slate-600 hover:text-red-500" title="Delete Class"><i className="fas fa-trash-alt text-xs"></i></button>
                  <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded ml-2">{cls.id}</span>
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Grade Teacher</p>
                <p className="text-sm font-bold text-white">{gradeTeacher?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Curriculum Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {cls.subjectIds.map(sid => {
                    const s = subjects.find(sub => sub.id === sid);
                    return <span key={sid} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">{s?.name}</span>;
                  })}
                  {cls.subjectIds.length === 0 && <span className="text-[10px] text-slate-600 font-bold uppercase">No subjects assigned</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAllocations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Staff Allocations</h3>
        <button onClick={() => openModal('ALLOCATIONS', 'CREATE')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-lg">
          <i className="fas fa-link mr-2"></i> Assign Staff
        </button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="table-container">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Teacher</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Class</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Subject</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {allocations.map(alloc => {
              const teacher = teachers.find(t => t.id === alloc.teacherId);
              const cls = classes.find(c => c.id === alloc.classId);
              const sub = subjects.find(s => s.id === alloc.subjectId);
              return (
                <tr key={alloc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{teacher?.name || 'N/A'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{alloc.teacherId}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-blue-400 font-black uppercase">{cls?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-xs text-slate-300 font-bold uppercase">{sub?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openModal('ALLOCATIONS', 'EDIT', alloc.id)}
                      className="text-slate-600 hover:text-blue-400 transition-colors"
                      title="Edit Allocation"
                    >
                      <i className="fas fa-edit mr-3"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteAlloc(alloc.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Remove Allocation"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {allocations.length === 0 && (
          <div className="py-20 text-center">
            <i className="fas fa-link-slash text-4xl text-slate-800 mb-4"></i>
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No allocations found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderModalContent = () => {
    switch(showModal) {
      case 'DEPARTMENTS':
        if (modalMode === 'VIEW') {
          const hod = teachers.find(t => t.id === deptForm.hodId);
          return (
            <div className="space-y-6">
              <h3 className="text-white font-black uppercase mb-6 text-center tracking-widest">Department Insight</h3>
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Official Name</p>
                  <p className="text-lg font-black text-blue-400 uppercase">{deptForm.name}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Head of Department</p>
                  <p className="text-sm font-bold text-white uppercase">{hod?.name || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Staff Members</p>
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {deptForm.teacherIds?.map(tid => {
                        const t = teachers.find(te => te.id === tid);
                        return <span key={tid} className="text-xs text-slate-300 font-bold">• {t?.name}</span>;
                      })}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Departmental Subjects</p>
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {deptForm.subjectIds?.map(sid => {
                        const s = subjects.find(su => su.id === sid);
                        return <span key={sid} className="text-xs text-slate-300 font-bold">• {s?.name}</span>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex pt-4">
                 <button onClick={closeModal} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs">Close Details</button>
              </div>
            </div>
          );
        }
        return (
          <form onSubmit={handleDeptSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-white font-black uppercase mb-6 text-center tracking-widest">
              {modalMode === 'CREATE' ? 'Create New Department' : 'Edit Department'}
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department Name</label>
              <input required placeholder="e.g. Science Department" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Head of Department (HOD)</label>
              <select required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={deptForm.hodId} onChange={e => setDeptForm({...deptForm, hodId: e.target.value})}>
                <option value="">Select HOD</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Teachers</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto flex flex-col gap-2">
                {teachers.map(t => (
                  <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="form-checkbox bg-slate-800 border-slate-700 rounded text-blue-600"
                      checked={deptForm.teacherIds?.includes(t.id)}
                      onChange={() => setDeptForm({...deptForm, teacherIds: toggleSelection(deptForm.teacherIds || [], t.id)})}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Link Subjects</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto flex flex-col gap-2">
                {subjects.map(s => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="form-checkbox bg-slate-800 border-slate-700 rounded text-blue-600"
                      checked={deptForm.subjectIds?.includes(s.id)}
                      onChange={() => setDeptForm({...deptForm, subjectIds: toggleSelection(deptForm.subjectIds || [], s.id)})}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{s.name} ({s.code})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-black uppercase text-xs hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95">
                {modalMode === 'CREATE' ? 'Create Department' : 'Save Changes'}
              </button>
            </div>
          </form>
        );
      case 'SUBJECTS':
        return (
          <form onSubmit={handleSubjectSubmit} className="space-y-6">
            <h3 className="text-white font-black uppercase mb-4 text-center tracking-widest">
              {modalMode === 'CREATE' ? 'New Subject Definition' : 'Update Subject'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Name</label>
                <input required placeholder="e.g. Advanced Biology" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Code</label>
                <input required placeholder="e.g. BIO302" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono uppercase outline-none focus:ring-2 focus:ring-blue-600" value={subForm.code} onChange={e => setSubForm({...subForm, code: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600" value={subForm.departmentId} onChange={e => setSubForm({...subForm, departmentId: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-black uppercase text-xs">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg">
                {modalMode === 'CREATE' ? 'Save Subject' : 'Update Record'}
              </button>
            </div>
          </form>
        );
      case 'CLASSES':
        return (
          <form onSubmit={handleClassSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-white font-black uppercase mb-6 text-center tracking-widest">
              {modalMode === 'CREATE' ? 'Configure New Class' : 'Modify Class Group'}
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Class Identifier</label>
              <input required placeholder="e.g. Grade 11 Science A" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-blue-600" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade/Class Teacher</label>
              <select required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600" value={classForm.gradeTeacherId} onChange={e => setClassForm({...classForm, gradeTeacherId: e.target.value})}>
                <option value="">Select Grade Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Class Curriculum (Select Subjects)</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {subjects.map(s => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer py-1 border-b border-slate-900 last:border-0 hover:bg-slate-900 px-2 rounded transition-colors group">
                    <input 
                      type="checkbox" 
                      className="form-checkbox bg-slate-800 border-slate-700 text-blue-600 rounded"
                      checked={classForm.subjectIds?.includes(s.id)}
                      onChange={() => setClassForm({...classForm, subjectIds: toggleSelection(classForm.subjectIds || [], s.id)})}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-white group-hover:text-blue-400 transition-colors font-bold uppercase">{s.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono tracking-tighter">{s.code}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-black uppercase text-xs">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95">
                {modalMode === 'CREATE' ? 'Register Class' : 'Apply Updates'}
              </button>
            </div>
          </form>
        );
      case 'ALLOCATIONS':
        return (
          <form onSubmit={handleAllocSubmit} className="space-y-6">
            <h3 className="text-white font-black uppercase mb-4 text-center tracking-widest">
              {modalMode === 'CREATE' ? 'Assign Teacher to Class' : 'Modify Allocation'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Teacher</label>
                <select required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" value={allocForm.teacherId} onChange={e => setAllocForm({...allocForm, teacherId: e.target.value})}>
                  <option value="">Search Teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Target Class</label>
                <select required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" value={allocForm.classId} onChange={e => setAllocForm({...allocForm, classId: e.target.value})}>
                  <option value="">Search Class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Subject to Teach</label>
                <select required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" value={allocForm.subjectId} onChange={e => setAllocForm({...allocForm, subjectId: e.target.value})}>
                  <option value="">Search Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl text-center">
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-relaxed">
                  This allocation permits the teacher to record results and manage resources for the specified subject within this class.
               </p>
            </div>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-black uppercase text-xs">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95">
                {modalMode === 'CREATE' ? 'Finalize Allocation' : 'Update Allocation'}
              </button>
            </div>
          </form>
        );
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-8">
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'DEPARTMENTS', label: 'Departments', icon: 'fa-sitemap' },
          { id: 'SUBJECTS', label: 'Subjects', icon: 'fa-book' },
          { id: 'CLASSES', label: 'Classes', icon: 'fa-chalkboard' },
          { id: 'ALLOCATIONS', label: 'Allocations', icon: 'fa-link' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SubTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black transition-all uppercase tracking-widest ${
              activeTab === tab.id 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[500px]">
        {activeTab === 'DEPARTMENTS' && renderDepartments()}
        {activeTab === 'SUBJECTS' && renderSubjects()}
        {activeTab === 'CLASSES' && renderClasses()}
        {activeTab === 'ALLOCATIONS' && renderAllocations()}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
};