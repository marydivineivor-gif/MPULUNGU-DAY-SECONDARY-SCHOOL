import React, { useState, useEffect, useMemo } from 'react';
import { StudentMark, GradeScale, ExamSession, Student, Subject, ClassInfo, UserRole, ClassAllocation } from '../types';

type SubModule = 'MARKS' | 'SETTINGS' | 'SHEET' | 'REPORT' | 'PROMOTIONS';

interface ExamManagementModuleProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  sessions: ExamSession[];
  setSessions: React.Dispatch<React.SetStateAction<ExamSession[]>>;
  marks: StudentMark[];
  setMarks: React.Dispatch<React.SetStateAction<StudentMark[]>>;
  subjects: Subject[];
  classes: ClassInfo[];
  allocations: ClassAllocation[];
  schoolName: string;
  schoolLogo?: string;
  gradeScales: GradeScale[];
  setGradeScales: React.Dispatch<React.SetStateAction<GradeScale[]>>;
  userRole: UserRole;
  userId: string;
}

export const ExamManagementModule: React.FC<ExamManagementModuleProps> = ({ 
  students, setStudents, sessions, setSessions, marks, setMarks, subjects: availableSubjects, classes: availableClasses, allocations, schoolName, schoolLogo, gradeScales, setGradeScales, userRole, userId
}) => {
  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.id.localeCompare(b.id)), [students]);

  const myAllocations = useMemo(() => 
    userRole === 'TEACHER' ? allocations.filter(a => a.teacherId === userId) : [], 
  [allocations, userRole, userId]);

  const permittedClasses = useMemo(() => {
    if (userRole === 'ADMIN') return availableClasses;
    if (userRole === 'TEACHER') {
      return availableClasses.filter(c => myAllocations.some(a => a.classId === c.id));
    }
    return availableClasses;
  }, [availableClasses, myAllocations, userRole]);

  const initialClassId = permittedClasses[0]?.id || '';
  const initialSubjectId = userRole === 'TEACHER' 
    ? availableSubjects.find(s => myAllocations.some(a => a.classId === initialClassId && a.subjectId === s.id))?.id || ''
    : availableSubjects[0]?.id || '';

  const [activeSub, setActiveSub] = useState<SubModule>(userRole === 'STUDENT' ? 'REPORT' : 'MARKS');
  const [selectedSession, setSelectedSession] = useState(sessions[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);
  const [selectedStudentId, setSelectedStudentId] = useState(userRole === 'STUDENT' ? userId : sortedStudents[0]?.id || '');
  const [stagedMarks, setStagedMarks] = useState<Record<string, Partial<StudentMark>>>({});
  const [isSavingMarks, setIsSavingMarks] = useState(false);
  
  const [promoSourceClass, setPromoSourceClass] = useState(availableClasses[0]?.name || '');
  const [promoTargetClass, setPromoTargetClass] = useState('');
  const [selectedForPromo, setSelectedForPromo] = useState<string[]>([]);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState({ name: '', year: new Date().getFullYear().toString(), term: 'Term 1', isTwoWayEntry: false });
  const [localSessions, setLocalSessions] = useState<ExamSession[]>(sessions);
  const [localGradeScales, setLocalGradeScales] = useState<GradeScale[]>(gradeScales);
  const [isSavingAll, setIsSavingAll] = useState(false);

  useEffect(() => {
    setLocalSessions(sessions);
    setLocalGradeScales(gradeScales);
  }, [sessions, gradeScales]);

  const currentClass = availableClasses.find(c => c.id === selectedClassId);
  const currentSubject = availableSubjects.find(s => s.id === selectedSubjectId);

  const permittedSubjectsForClass = useMemo(() => {
    if (userRole === 'ADMIN') return availableSubjects;
    if (userRole === 'TEACHER') {
      return availableSubjects.filter(s => myAllocations.some(a => a.classId === selectedClassId && a.subjectId === s.id));
    }
    return availableSubjects;
  }, [availableSubjects, myAllocations, selectedClassId, userRole]);

  useEffect(() => {
    if (userRole === 'TEACHER') {
      const isStillPermitted = permittedSubjectsForClass.some(s => s.id === selectedSubjectId);
      if (!isStillPermitted) {
        setSelectedSubjectId(permittedSubjectsForClass[0]?.id || '');
      }
    }
  }, [selectedClassId, permittedSubjectsForClass, selectedSubjectId, userRole]);

  const handleMarkChange = (studentId: string, value: number, field: 'score' | 'midTermMark' | 'endOfTermMark' = 'score') => {
    if (userRole === 'STUDENT') return;
    setStagedMarks(prev => {
      const currentStaged = prev[studentId] || {};
      const session = sessions.find(s => s.id === selectedSession);
      const existingMark = marks.find(m => m.studentId === studentId && m.sessionId === selectedSession && m.subjectId === selectedSubjectId);
      
      let newStaged = { ...currentStaged, [field]: value };
      
      if (session?.isTwoWayEntry) {
         const mid = field === 'midTermMark' ? value : (newStaged.midTermMark ?? existingMark?.midTermMark ?? 0);
         const end = field === 'endOfTermMark' ? value : (newStaged.endOfTermMark ?? existingMark?.endOfTermMark ?? 0);
         newStaged.score = mid + end;
      }
      
      return { ...prev, [studentId]: newStaged };
    });
  };

  const handleSaveMarksAction = async () => {
    const studentIds = Object.keys(stagedMarks);
    if (studentIds.length === 0) {
      alert('No changes to save.');
      return;
    }

    setIsSavingMarks(true);
    try {
      setMarks(prev => {
        let updated = [...prev];
        studentIds.forEach(studentId => {
          const updates = stagedMarks[studentId];
          const existingIdx = updated.findIndex(m => m.studentId === studentId && m.sessionId === selectedSession && m.subjectId === selectedSubjectId);
          if (existingIdx > -1) {
            updated[existingIdx] = { ...updated[existingIdx], ...updates };
          } else {
            updated.push({
              id: `M-${studentId}-${selectedSession}-${selectedSubjectId}`,
              studentId,
              sessionId: selectedSession,
              subjectId: selectedSubjectId,
              score: updates.score ?? 0,
              midTermMark: updates.midTermMark ?? 0,
              endOfTermMark: updates.endOfTermMark ?? 0,
              ...updates
            } as StudentMark);
          }
        });
        return updated;
      });
      setStagedMarks({});
      alert('Marks saved and synced to cloud!');
    } catch (error) {
      alert('Failed to save marks.');
    } finally {
      setIsSavingMarks(false);
    }
  };

  const getGradeInfo = (score: number) => {
    if (score === -1) return localGradeScales.find(g => g.label === 'X');
    return localGradeScales.find(g => score >= g.minMark && score <= g.maxMark && g.label !== 'X');
  };

  const calculateStudentAvg = (studentId: string, sessionId: string) => {
    const studentMarks = marks.filter(m => m.studentId === studentId && m.sessionId === sessionId && m.score >= 0);
    if (studentMarks.length === 0) return 0;
    return studentMarks.reduce((acc, m) => acc + m.score, 0) / studentMarks.length;
  };

  const handlePromotion = () => {
    if (!promoTargetClass) {
      alert("Please select a target class for promotion.");
      return;
    }
    if (selectedForPromo.length === 0) {
      alert("No students selected for promotion.");
      return;
    }

    if (confirm(`Promote ${selectedForPromo.length} students to ${promoTargetClass}?`)) {
      setStudents(prev => {
        const promoted = prev.map(s => {
          if (selectedForPromo.includes(s.id)) {
            const isGraduating = promoTargetClass === 'ALUMNI';
            return {
              ...s,
              class: isGraduating ? s.class : promoTargetClass,
              status: (isGraduating ? 'Alumni' : 'Active') as Student['status']
            };
          }
          return s;
        });
        return promoted.sort((a, b) => a.id.localeCompare(b.id));
      });
      setSelectedForPromo([]);
      alert("Promotion cycle completed successfully.");
    }
  };

  const handleAddOrEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'ADMIN') return;
    if (editingSessionId) {
      setLocalSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, ...sessionForm } : s));
      setEditingSessionId(null);
    } else {
      const id = `ES${Date.now()}`;
      setLocalSessions([...localSessions, { ...sessionForm, id }]);
    }
    setSessionForm({ name: '', year: new Date().getFullYear().toString(), term: 'Term 1', isTwoWayEntry: false });
  };

  const handleDeleteSessionLocal = (id: string) => {
    if (userRole !== 'ADMIN') return;
    setLocalSessions(prev => prev.filter(s => s.id !== id));
  };

  const updateLocalGradeScale = (id: string, field: keyof GradeScale, value: string | number) => {
    setLocalGradeScales(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleSaveAllSettings = () => {
    setIsSavingAll(true);
    setSessions(localSessions);
    setGradeScales(localGradeScales);
    setTimeout(() => {
      setIsSavingAll(false);
      alert("Institutional Exam Configuration (Sessions & Grading) successfully synchronized.");
    }, 800);
  };

  const triggerActualPrint = () => window.print();

  const renderPromotions = () => {
    const studentsInSource = sortedStudents.filter(s => s.class === promoSourceClass && s.status === 'Active');
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500 block">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-8 block">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Source Class</label>
                    <select value={promoSourceClass} onChange={e => setPromoSourceClass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none font-bold uppercase">
                       {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Class / Status</label>
                    <select value={promoTargetClass} onChange={e => setPromoTargetClass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none font-bold uppercase">
                       <option value="">Select Destination...</option>
                       <optgroup label="Active Classes">
                          {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </optgroup>
                       <optgroup label="graduation">
                          <option value="ALUMNI">Mark as Alumni (Graduated)</option>
                       </optgroup>
                    </select>
                 </div>
              </div>
              <button 
                onClick={handlePromotion}
                disabled={selectedForPromo.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all h-fit"
              >
                Promote Selected ({selectedForPromo.length})
              </button>
           </div>

           <div className="overflow-hidden border border-slate-800 rounded-2xl block">
              <table className="w-full text-left">
                 <thead className="bg-slate-950/50 border-b border-slate-800">
                    <tr>
                       <th className="px-6 py-4 w-12 no-print">
                          <input 
                            type="checkbox" 
                            className="form-checkbox bg-slate-800 border-slate-700 text-blue-600 rounded" 
                            checked={selectedForPromo.length === studentsInSource.length && studentsInSource.length > 0}
                            onChange={(e) => {
                               if(e.target.checked) setSelectedForPromo(studentsInSource.map(s => s.id));
                               else setSelectedForPromo([]);
                            }}
                          />
                       </th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Student Name</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center">Identity</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center">Session Avg (%)</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                    {studentsInSource.map(student => {
                      const avg = calculateStudentAvg(student.id, selectedSession);
                      const isSelected = selectedForPromo.includes(student.id);
                      return (
                        <tr key={student.id} className={`${isSelected ? 'bg-blue-600/5' : ''} hover:bg-slate-800/30 transition-colors`}>
                           <td className="px-6 py-4 no-print">
                              <input 
                                type="checkbox" 
                                className="form-checkbox bg-slate-800 border-slate-700 text-blue-600 rounded"
                                checked={isSelected}
                                onChange={() => {
                                   setSelectedForPromo(prev => 
                                      prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]
                                   );
                                }}
                              />
                           </td>
                           <td className="px-6 py-4 text-sm font-bold text-white uppercase">{student.name}</td>
                           <td className="px-6 py-4 text-xs font-mono text-center text-slate-400">{student.id}</td>
                           <td className="px-6 py-4 text-center">
                              <span className={`text-sm font-black ${avg >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{avg.toFixed(1)}%</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">{student.status}</span>
                           </td>
                        </tr>
                      );
                    })}
                    {studentsInSource.length === 0 && (
                      <tr>
                         <td colSpan={5} className="py-20 text-center text-slate-600 font-black uppercase text-xs">No active students found in this class</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  const renderMarksEntry = () => (
    <div className="space-y-6 block">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 no-print">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Active Session</label>
          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 font-bold"
          >
            <option value="">Select Session...</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Class</label>
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 font-bold uppercase"
          >
            <option value="">Select Class...</option>
            {permittedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Subject</label>
          <select 
            value={selectedSubjectId} 
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={!selectedClassId}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 font-bold"
          >
            <option value="">Select Subject...</option>
            {permittedSubjectsForClass.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl block">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-950/20 gap-2">
           <h3 className="text-sm font-black text-white uppercase tracking-widest">Mark Entry: <span className="text-blue-400">{currentSubject?.name || '---'}</span></h3>
           <p className="text-[10px] text-slate-500 font-bold uppercase">Class: {currentClass?.name || '---'}</p>
        </div>
        <div className="table-container">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Student Name</th>
              {sessions.find(s => s.id === selectedSession)?.isTwoWayEntry ? (
                <>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24">Mid (40)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24">End (60)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24">Total</th>
                </>
              ) : (
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-32">Score</th>
              )}
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedStudents.filter(s => s.class === currentClass?.name).map(student => {
              const savedMark = marks.find(m => m.studentId === student.id && m.sessionId === selectedSession && m.subjectId === selectedSubjectId);
              const stagedMark = stagedMarks[student.id] || {};
              const studentMark = { ...savedMark, ...stagedMark };
              const gInfo = getGradeInfo(studentMark?.score ?? -2);
              const isTwoWay = sessions.find(s => s.id === selectedSession)?.isTwoWayEntry;

              return (
                <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white uppercase">{student.name}</td>
                  {isTwoWay ? (
                    <>
                      <td className="px-6 py-4">
                        <input 
                          type="number" min="0" max="40"
                          disabled={!selectedSubjectId || !selectedSession}
                          value={studentMark?.midTermMark ?? ''}
                          onChange={(e) => handleMarkChange(student.id, parseInt(e.target.value) || 0, 'midTermMark')}
                          className="w-20 bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-center text-slate-900 font-black outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" min="0" max="60"
                          disabled={!selectedSubjectId || !selectedSession}
                          value={studentMark?.endOfTermMark ?? ''}
                          onChange={(e) => handleMarkChange(student.id, parseInt(e.target.value) || 0, 'endOfTermMark')}
                          className="w-20 bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-center text-slate-900 font-black outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-blue-400">{studentMark?.score ?? 0}</span>
                      </td>
                    </>
                  ) : (
                    <td className="px-6 py-4">
                      <input 
                        type="number" min="-1" max="100"
                        disabled={!selectedSubjectId || !selectedSession}
                        value={studentMark?.score === -1 ? -1 : (studentMark?.score ?? '')}
                        onChange={(e) => handleMarkChange(student.id, parseInt(e.target.value) || -1)}
                        className="w-24 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-center text-slate-900 font-black outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:opacity-50 shadow-sm"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-slate-500">{gInfo?.label || '--'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end items-center gap-4 bg-slate-950/20">
          {Object.keys(stagedMarks).length > 0 && (
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
              {Object.keys(stagedMarks).length} Unsaved Changes
            </span>
          )}
          <button 
            onClick={handleSaveMarksAction}
            disabled={isSavingMarks || Object.keys(stagedMarks).length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
          >
            {isSavingMarks ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
            {isSavingMarks ? 'Saving...' : 'Save & Sync Marks'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => {
    if (userRole !== 'ADMIN') return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 text-center block">
         <i className="fas fa-lock text-4xl text-slate-700 mb-4"></i>
         <h3 className="text-white font-black uppercase tracking-widest">Administrative Lock</h3>
         <p className="text-slate-500 text-xs mt-2 uppercase font-bold">Only institutional administrators can modify sessions or grade scales.</p>
      </div>
    );
    
    return (
      <div className="space-y-10 animate-in fade-in duration-500 block">
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl no-print">
           <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Exam System Configuration</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Setup grading logic and active sessions</p>
           </div>
           <div className="flex items-center gap-4">
             {localSessions.length !== sessions.length || localGradeScales !== gradeScales ? (
               <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Changes Pending Save</span>
             ) : null}
             <button 
               onClick={handleSaveAllSettings} 
               disabled={isSavingAll}
               className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
             >
               {isSavingAll ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
               {isSavingAll ? 'Saving Changes...' : 'Save & Publish All Settings'}
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 block">
          <div className="space-y-6 block">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl block">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <i className="fas fa-calendar-check text-blue-500"></i> Manage Exam Sessions
              </h3>
              
              <form onSubmit={handleAddOrEditSession} className="space-y-4 mb-8 bg-slate-950 p-4 rounded-xl border border-slate-800 no-print">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Session Title</label>
                        <input required value={sessionForm.name} onChange={e => setSessionForm({...sessionForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white" placeholder="e.g. End of Term 1" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Year</label>
                        <input required value={sessionForm.year} onChange={e => setSessionForm({...sessionForm, year: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white" placeholder={new Date().getFullYear().toString()} />
                    </div>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Term</label>
                        <select value={sessionForm.term} onChange={e => setSessionForm({...sessionForm, term: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-bold">
                          <option>Term 1</option>
                          <option>Term 2</option>
                          <option>Term 3</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="checkbox" 
                          id="isTwoWayEntry"
                          checked={sessionForm.isTwoWayEntry} 
                          onChange={e => setSessionForm({...sessionForm, isTwoWayEntry: e.target.checked})} 
                          className="w-4 h-4 rounded border-slate-800 bg-slate-900"
                        />
                        <label htmlFor="isTwoWayEntry" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Two-Way (Mid/End)</label>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-xs font-black uppercase shadow-lg transition-all">
                        {editingSessionId ? 'Update' : 'Add to List'}
                    </button>
                    {editingSessionId && (
                      <button type="button" onClick={() => { setEditingSessionId(null); setSessionForm({ name: '', year: new Date().getFullYear().toString(), term: 'Term 1', isTwoWayEntry: false }); }} className="text-slate-500 text-xs font-bold uppercase hover:text-white transition-colors">Cancel</button>
                    )}
                  </div>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2 block">
                  {localSessions.map(s => (
                    <div key={s.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                      <div>
                          <p className="text-xs font-black text-white uppercase">{s.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{s.term} • {s.year}</p>
                      </div>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                          <button onClick={() => { setEditingSessionId(s.id); setSessionForm({ name: s.name, year: s.year, term: s.term, isTwoWayEntry: !!s.isTwoWayEntry }); }} className="text-slate-500 hover:text-blue-400 transition-colors"><i className="fas fa-edit text-xs"></i></button>
                          <button onClick={() => handleDeleteSessionLocal(s.id)} className="text-slate-500 hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 block">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl block">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <i className="fas fa-sliders-h text-blue-500"></i> Numerical Grading Scale (1-9)
              </h3>
              
              <div className="overflow-x-auto block">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-800">
                        <tr>
                          <th className="py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
                          <th className="py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Min %</th>
                          <th className="py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Max %</th>
                          <th className="py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {localGradeScales.map(g => (
                          <tr key={g.id} className="hover:bg-slate-950/50 transition-colors">
                            <td className="py-2 pr-4 font-black text-blue-400 text-sm">{g.label}</td>
                            <td className="py-2 pr-4">
                              {g.label !== 'X' ? (
                                <input type="number" value={g.minMark} onChange={e => updateLocalGradeScale(g.id, 'minMark', parseInt(e.target.value) || 0)} className="w-14 bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-bold no-print" />
                              ) : <span className="text-[10px] text-slate-600 font-bold uppercase italic">Special</span>}
                              <span className="hidden print:inline text-xs font-bold text-black">{g.minMark}</span>
                            </td>
                            <td className="py-2 pr-4">
                              {g.label !== 'X' ? (
                                <input type="number" value={g.maxMark} onChange={e => updateLocalGradeScale(g.id, 'maxMark', parseInt(e.target.value) || 0)} className="w-14 bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-bold no-print" />
                              ) : <span className="text-[10px] text-slate-600 font-bold uppercase italic">-1 Marker</span>}
                              <span className="hidden print:inline text-xs font-bold text-black">{g.maxMark}</span>
                            </td>
                            <td className="py-2">
                              <input value={g.description} onChange={e => updateLocalGradeScale(g.id, 'description', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-medium italic no-print" />
                              <span className="hidden print:inline text-xs italic text-black">{g.description}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMarkSheetContent = () => {
    const studentsInClass = sortedStudents.filter(s => s.class === currentClass?.name);
    const filteredSubjects = currentClass 
      ? availableSubjects.filter(sub => currentClass.subjectIds.includes(sub.id))
      : [];

    const isTwoWay = sessions.find(s => s.id === selectedSession)?.isTwoWayEntry;

    return (
      <div className="bg-white text-black p-10 font-sans border-2 border-black flex flex-col box-border block shadow-xl">
        <div className="text-center mb-6 pb-4 border-b-2 border-black block">
          <div className="flex items-center justify-center gap-6 mb-4">
            {schoolLogo ? <img src={schoolLogo} className="w-20 h-20 object-contain" alt="Logo" /> : <div className="w-16 h-16 border border-black/10 opacity-20 italic">LOGO</div>}
            <div className="text-left">
              <h1 className="font-black uppercase tracking-tight text-2xl text-black">{schoolName}</h1>
              <h2 className="font-bold uppercase text-lg text-black">OFFICIAL PERFORMANCE SHEET</h2>
              <p className="text-[10px] font-black uppercase text-slate-600">Class: {currentClass?.name} | Session: {sessions.find(s => s.id === selectedSession)?.name}</p>
            </div>
          </div>
        </div>
        
        <table className="w-full text-left border-2 border-black">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-[9px] font-black uppercase border border-black text-black">Student Name</th>
              {filteredSubjects.map(sub => (
                <th key={sub.id} className="px-1 py-2 text-[8px] font-black uppercase text-center border border-black text-black whitespace-normal leading-tight">
                  {sub.name}
                  {isTwoWay && <div className="flex justify-around text-[6px] border-t border-black mt-1"><span>M</span><span>E</span><span>T</span></div>}
                </th>
              ))}
              <th className="px-4 py-2 text-[9px] font-black uppercase text-center border border-black text-black">AVG</th>
            </tr>
          </thead>
          <tbody>
            {studentsInClass.map(student => {
              let total = 0, count = 0;
              return (
                <tr key={student.id} className="h-7">
                  <td className="px-3 py-1 text-[10px] font-black border border-black text-black">{student.name}</td>
                  {filteredSubjects.map(sub => {
                    const m = marks.find(mk => mk.studentId === student.id && mk.sessionId === selectedSession && mk.subjectId === sub.id);
                    const score = m?.score ?? -2;
                    if (score >= 0) { total += score; count++; }
                    return (
                      <td key={sub.id} className="px-1 py-1 text-center text-[10px] font-black border border-black text-black">
                        {isTwoWay ? (
                          <div className="flex justify-around text-[8px]">
                            <span>{m?.midTermMark ?? '-'}</span>
                            <span>{m?.endOfTermMark ?? '-'}</span>
                            <span className="font-black">{score === -1 ? 'X' : (score >= 0 ? score : '-')}</span>
                          </div>
                        ) : (
                          score === -1 ? 'X' : (score >= 0 ? score : '-')
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-1 text-center text-[10px] font-black border border-black bg-slate-50 text-black">
                    {count > 0 ? (total / count).toFixed(1) : '0.0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between items-center text-[9px] font-black uppercase text-slate-500 block">
           <p>Generated via MPULUNGU DAY SECONDARY SCHOOL SMS &bull; {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    );
  };

  const renderReportCardContent = (studentId: string) => {
    const student = sortedStudents.find(s => s.id === studentId);
    const session = sessions.find(s => s.id === selectedSession);
    const studentMarks = marks.filter(m => m.studentId === studentId && m.sessionId === selectedSession);
    if (!student) return null;

    const studentClassInfo = availableClasses.find(c => c.name === student.class);
    const filteredSubjects = studentClassInfo 
      ? availableSubjects.filter(sub => studentClassInfo.subjectIds.includes(sub.id))
      : [];

    const isTwoWay = session?.isTwoWayEntry;

    return (
      <div className="bg-white text-black p-8 md:p-12 rounded shadow-2xl space-y-8 font-serif border-8 border-slate-200 mx-auto max-w-4xl mb-8 printable-card block" key={studentId}>
        {/* Headings kept on report cards per exception */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4 block">
           <div className="w-20 h-20 shrink-0 flex items-center justify-center">
             {schoolLogo ? <img src={schoolLogo} className="w-full h-full object-contain" alt="School Logo" /> : <div className="border border-black/10 w-full h-full flex items-center justify-center italic opacity-30 text-[10px]">No Logo</div>}
           </div>

           <div className="text-center flex-1 px-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black leading-tight">{schoolName}</h2>
              <p className="text-xs italic font-sans font-black text-slate-700 mt-0.5 uppercase tracking-widest">Official Academic Achievement Report</p>
           </div>

           <div className="w-24 h-24 shrink-0 border-2 border-black rounded-lg overflow-hidden bg-slate-50 shadow-sm">
             {student.photo ? <img src={student.photo} className="w-full h-full object-cover" alt="Student Profile" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><i className="fas fa-user text-3xl"></i></div>}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm font-sans text-black mt-4 bg-slate-50 p-4 border border-black/20 rounded-xl block">
          <div className="space-y-2 block">
            <p className="text-base font-black uppercase tracking-tight">Student: <span className="underline">{student.name}</span></p>
            <div className="space-y-0.5 block">
               <p className="font-mono font-black text-slate-800 text-[10px] tracking-widest uppercase">Identity No: {student.id}</p>
               <p className="font-black text-[10px] uppercase tracking-widest">Academic Group: {student.class}</p>
               <p className="font-bold text-[10px] uppercase text-slate-500">Gender: {student.gender}</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-center block">
            <p className="text-lg font-black uppercase tracking-widest text-blue-900">{session?.name}</p>
            <p className="font-black text-[10px] uppercase tracking-widest text-slate-600">{session?.term} Session &bull; {session?.year}</p>
          </div>
        </div>

        <div className="flex-1 mt-6 block">
          <table className="w-full border-collapse font-sans border-2 border-black">
            <thead>
              <tr className="bg-slate-200">
                <th className="border-2 border-black px-3 py-2 text-left text-[10px] uppercase font-black text-black tracking-widest">Subject Curriculum</th>
                {isTwoWay && (
                  <>
                    <th className="border-2 border-black px-1 py-2 text-center text-[10px] uppercase font-black w-14 text-black tracking-widest">Mid (40)</th>
                    <th className="border-2 border-black px-1 py-2 text-center text-[10px] uppercase font-black w-14 text-black tracking-widest">End (60)</th>
                  </>
                )}
                <th className="border-2 border-black px-3 py-2 text-center text-[10px] uppercase font-black w-20 text-black tracking-widest">{isTwoWay ? 'Total' : 'Mark'}</th>
                <th className="border-2 border-black px-3 py-2 text-center text-[10px] uppercase font-black w-20 text-black tracking-widest">Grade</th>
                <th className="border-2 border-black px-3 py-2 text-center text-[10px] uppercase font-black w-32 text-black tracking-widest">Achievement Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map(sub => {
                const m = studentMarks.find(mark => mark.subjectId === sub.id);
                const score = m?.score ?? -2;
                const gInfo = getGradeInfo(score);
                return (
                  <tr key={sub.id} className="h-9 hover:bg-slate-50 transition-colors">
                    <td className="border-2 border-black px-3 py-1.5 text-xs font-black text-black uppercase tracking-tight">{sub.name}</td>
                    {isTwoWay && (
                      <>
                        <td className="border-2 border-black px-3 py-1.5 text-center text-sm font-black text-black">{m?.midTermMark ?? '-'}</td>
                        <td className="border-2 border-black px-3 py-1.5 text-center text-sm font-black text-black">{m?.endOfTermMark ?? '-'}</td>
                      </>
                    )}
                    <td className="border-2 border-black px-3 py-1.5 text-center text-sm font-black text-black">{score === -1 ? 'X' : (score >= 0 ? score : '-')}</td>
                    <td className="border-2 border-black px-3 py-1.5 text-center text-base font-black text-blue-700">{gInfo?.label || '-'}</td>
                    <td className="border-2 border-black px-3 py-1.5 text-center text-[9px] font-black text-slate-700 uppercase tracking-tighter">{gInfo?.description || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 flex justify-between items-end border-t border-black/10 block">
           <div className="text-[9px] font-black block">
              <p className="underline uppercase mb-1">Grading Reference:</p>
              <div className="grid grid-cols-5 gap-1.5 block">
                 {localGradeScales.filter(g => g.label !== 'X').map(g => (
                    <div key={g.label} className="flex flex-col border border-black/10 p-1 rounded min-w-[45px] text-center">
                       <span className="font-black text-blue-900 text-xs">{g.label}</span>
                       <span className="scale-[0.7] origin-center text-slate-500 font-bold whitespace-nowrap">{g.minMark}-{g.maxMark}</span>
                    </div>
                 ))}
              </div>
           </div>
           <div className="text-right block">
              <div className="border-t-2 border-black pt-1 min-w-[180px]">
                 <p className="text-[10px] font-black uppercase">Institutional Head</p>
                 <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase italic">Signature and Seal</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'MARKS', label: 'Marks Entry', icon: 'fa-edit', allowed: ['ADMIN', 'TEACHER'] },
    { id: 'SETTINGS', label: 'Exam Settings', icon: 'fa-cog', allowed: ['ADMIN'] },
    { id: 'SHEET', label: 'Mark Sheets', icon: 'fa-table', allowed: ['ADMIN', 'TEACHER'] },
    { id: 'REPORT', label: 'Report Cards', icon: 'fa-file-alt', allowed: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { id: 'PROMOTIONS', label: 'Promotions', icon: 'fa-user-check', allowed: ['ADMIN'] }
  ].filter(t => t.allowed.includes(userRole));

  return (
    <div className="p-4 space-y-8 block">
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 no-print">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveSub(tab.id as SubModule)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all ${activeSub === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 block">
        {activeSub === 'MARKS' && renderMarksEntry()}
        {activeSub === 'SETTINGS' && renderSettings()}
        {activeSub === 'PROMOTIONS' && renderPromotions()}
        
        {activeSub === 'SHEET' && (
          <div className="space-y-4 block">
            <div className="flex justify-between items-center no-print">
              <h3 className="text-sm font-black text-white uppercase">{schoolName} Class Sheet</h3>
              <button onClick={triggerActualPrint} className="bg-blue-600 text-white text-xs px-5 py-2 rounded-lg font-black uppercase">
                <i className="fas fa-print mr-2"></i> Print Sheet
              </button>
            </div>
            <div className="block overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {renderMarkSheetContent()}
            </div>
          </div>
        )}
        
        {activeSub === 'REPORT' && (
          <div className="space-y-6 block">
            {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
              <div className="flex gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800 no-print">
                <div className="flex-1">
                  <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white font-bold uppercase">
                    {sortedStudents.filter(s => s.class === currentClass?.name).map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                  </select>
                </div>
                <button onClick={triggerActualPrint} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase">
                   <i className="fas fa-print mr-2"></i> Print Report Card
                </button>
              </div>
            )}
            
            <div className="block overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {renderReportCardContent(selectedStudentId)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};