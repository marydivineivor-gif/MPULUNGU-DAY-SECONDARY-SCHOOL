
import React, { useState, useMemo } from 'react';
import { PeriodAllocation, PeriodSession, PeriodAttendance, Teacher, ClassInfo, Subject, UserRole, Student } from '../types';

interface PeriodmeterModuleProps {
  allocations: PeriodAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<PeriodAllocation[]>>;
  sessions: PeriodSession[];
  setSessions: React.Dispatch<React.SetStateAction<PeriodSession[]>>;
  attendance: PeriodAttendance[];
  setAttendance: React.Dispatch<React.SetStateAction<PeriodAttendance[]>>;
  teachers: Teacher[];
  classes: ClassInfo[];
  subjects: Subject[];
  userRole: UserRole;
  userId: string;
  students: Student[];
  schoolName: string;
}

type Tab = 'TRACKING' | 'TARGETS' | 'REPORTS' | 'CLASS_AUDIT' | 'STUDENT_VIEW';

const getGlossyColor = (name: string): string => {
  const n = name.toUpperCase();
  if (n.includes(' A') || n.includes('GREEN')) return "from-green-400 via-green-500 to-green-700 border-green-300 shadow-green-900/40";
  if (n.includes(' B') || n.includes('BLUE')) return "from-blue-400 via-blue-500 to-blue-700 border-blue-300 shadow-blue-900/40";
  if (n.includes(' C') || n.includes('ORANGE')) return "from-orange-300 via-orange-400 to-orange-600 border-orange-200 shadow-orange-900/40";
  if (n.includes('YELLOW')) return "from-yellow-300 via-yellow-400 to-yellow-600 border-yellow-200 shadow-yellow-900/40";
  return "from-sky-400 via-sky-500 to-sky-700 border-sky-300 shadow-sky-900/40";
};

const GlossyButton: React.FC<{ label: string; onClick: () => void; colorClass: string }> = ({ label, onClick, colorClass }) => (
  <button
    onClick={onClick}
    className={`
      relative w-full py-6 px-4 rounded-[24px] border-t-2 border-l border-r-2 border-b-4 bg-gradient-to-b 
      ${colorClass}
      shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6),inset_0_4px_8px_rgba(255,255,255,0.6),inset_0_-4px_8px_rgba(0,0,0,0.2)]
      transition-all duration-200 active:scale-95 active:translate-y-2
      flex items-center justify-center text-center group overflow-hidden
    `}
  >
    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-[20px] pointer-events-none"></div>
    <span className="text-black font-black text-lg uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)] z-10">
      {label}
    </span>
  </button>
);

export const PeriodmeterModule: React.FC<PeriodmeterModuleProps> = ({
  allocations, setAllocations, sessions, setSessions, attendance, setAttendance, teachers, classes, subjects, userRole, userId, students, schoolName
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(userRole === 'STUDENT' ? 'STUDENT_VIEW' : 'TRACKING');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAuditClassId, setSelectedAuditClassId] = useState('');
  const [activePupilLogId, setActivePupilLogId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  const [stagedPeriods, setStagedPeriods] = useState<Record<string, number>>({});
  const [stagedAttendance, setStagedAttendance] = useState<Record<string, Record<string, 'P' | 'A'>>>({});

  const canManageTargets = userRole === 'ADMIN';
  
  const teacherMap = useMemo(() => Object.fromEntries(teachers.map(t => [t.id, t.name])), [teachers]);
  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects]);

  const handleStagePeriod = (allocId: string, count: number) => {
    setStagedPeriods(prev => ({ ...prev, [allocId]: count }));
  };

  const handleStagePupil = (allocId: string, studentId: string, status: 'P' | 'A') => {
    setStagedAttendance(prev => {
      const classAtt = prev[allocId] || {};
      return { ...prev, [allocId]: { ...classAtt, [studentId]: status } };
    });
  };

  const handleSaveLogs = () => {
    const affectedAllocIds = new Set([...Object.keys(stagedPeriods), ...Object.keys(stagedAttendance)]);
    if (affectedAllocIds.size === 0) return;

    setSessions(prevSessions => {
      let updatedSessions = [...prevSessions];
      setAttendance(prevAtt => {
        let updatedAttendance = [...prevAtt];
        affectedAllocIds.forEach(allocId => {
          const alloc = allocations.find(a => a.id === allocId);
          if (!alloc) return;
          const existingSessionIdx = updatedSessions.findIndex(s => s.allocationId === allocId && s.date === selectedDate);
          const periods = stagedPeriods[allocId] !== undefined ? stagedPeriods[allocId] : (existingSessionIdx > -1 ? updatedSessions[existingSessionIdx].periodsHeld : 0);
          let sessionId: string;
          if (existingSessionIdx > -1) {
            if (periods === 0 && stagedPeriods[allocId] === 0) {
              sessionId = updatedSessions[existingSessionIdx].id;
              updatedSessions.splice(existingSessionIdx, 1);
              updatedAttendance = updatedAttendance.filter(a => a.sessionId !== sessionId);
              return; 
            } else {
              updatedSessions[existingSessionIdx] = { ...updatedSessions[existingSessionIdx], periodsHeld: periods, recordedBy: userId };
              sessionId = updatedSessions[existingSessionIdx].id;
            }
          } else if (periods > 0) {
            sessionId = `PS-${allocId}-${selectedDate}`;
            updatedSessions.push({ id: sessionId, allocationId: allocId, date: selectedDate, periodsHeld: periods, recordedBy: userId });
          } else { return; }
          const classInfo = classes.find(c => c.id === alloc.classId);
          const classStudents = students.filter(s => s.class === classInfo?.name);
          const currentStagedAtt = stagedAttendance[allocId] || {};
          classStudents.forEach(student => {
            const existingAttIdx = updatedAttendance.findIndex(a => a.sessionId === sessionId && a.studentId === student.id);
            const studentStatus = currentStagedAtt[student.id] || (existingAttIdx > -1 ? updatedAttendance[existingAttIdx].status : 'P');
            if (existingAttIdx > -1) {
              updatedAttendance[existingAttIdx] = { ...updatedAttendance[existingAttIdx], status: studentStatus };
            } else {
              updatedAttendance.push({ id: `PA-${sessionId}-${student.id}`, sessionId, studentId: student.id, status: studentStatus });
            }
          });
        });
        return updatedAttendance;
      });
      return updatedSessions;
    });
    setStagedPeriods({});
    setStagedAttendance({});
    alert("Commit complete. Institutional logs updated.");
  };

  const renderClassGrid = () => {
    // Logic: Only show classes where the user has an allocation if user is a teacher
    const myPermittedClasses = classes.filter(cls => {
      if (userRole === 'ADMIN' || userRole === 'ATTENDANCE_OFFICER') return true;
      return allocations.some(a => a.classId === cls.id && a.teacherId === userId);
    });

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center">
          <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] mb-4">SELECT CLASS UNIT</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Identify active stream for period logging</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 max-w-7xl mx-auto px-4 pb-20">
          {myPermittedClasses.map(cls => (
            <GlossyButton 
              key={cls.id} 
              label={cls.name} 
              onClick={() => setSelectedClassId(cls.id)} 
              colorClass={getGlossyColor(cls.name)} 
            />
          ))}
          {myPermittedClasses.length === 0 && (
            <div className="col-span-full py-32 text-center bg-blue-950/10 border-4 border-dashed border-sky-900/20 rounded-[50px]">
              <i className="fas fa-school text-5xl text-sky-900/20 mb-6"></i>
              <p className="text-slate-600 uppercase font-black tracking-widest">No classes assigned to your profile</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTracking = () => {
    if (!selectedClassId) return renderClassGrid();

    const classInfo = classes.find(c => c.id === selectedClassId);
    // Logic: "let only teachers assigned to a particular appear in this class"
    const classAllocations = allocations.filter(a => {
      const isCorrectClass = a.classId === selectedClassId;
      if (userRole === 'ADMIN' || userRole === 'ATTENDANCE_OFFICER') return isCorrectClass;
      return isCorrectClass && a.teacherId === userId;
    });

    const hasUnsavedChanges = Object.keys(stagedPeriods).length > 0 || Object.keys(stagedAttendance).length > 0;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500">
        <div className="bg-blue-950/40 p-8 rounded-[40px] border border-sky-900/30 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl no-print">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedClassId(null)} className="w-14 h-14 bg-black border-2 border-sky-900/30 rounded-2xl flex items-center justify-center text-white hover:bg-sky-600 transition-all shadow-xl active:scale-90">
               <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{classInfo?.name}</h3>
              <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest mt-1">Class Attendance & Period Log Terminal</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end justify-center">
             <div className="flex flex-col gap-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Log Date</label>
               <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-black border-2 border-sky-900/30 rounded-2xl px-6 py-3 text-sm text-white font-bold outline-none focus:border-sky-500 transition-all" />
             </div>
             {hasUnsavedChanges && (
               <button 
                 onClick={handleSaveLogs}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transition-all flex items-center gap-3 animate-pulse"
               >
                 <i className="fas fa-save"></i> Save Period Logs
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
           {classAllocations.map(alloc => {
                const sessionRecord = sessions.find(s => s.allocationId === alloc.id && s.date === selectedDate);
                const currentCount = stagedPeriods[alloc.id] !== undefined ? stagedPeriods[alloc.id] : (sessionRecord?.periodsHeld || 0);
                const classStudents = students.filter(s => s.class === classMap[alloc.classId]);
                
                const presentCount = stagedAttendance[alloc.id] 
                  ? Object.values(stagedAttendance[alloc.id]).filter(v => v === 'P').length 
                  : attendance.filter(a => a.sessionId === sessionRecord?.id && a.status === 'P').length;

                return (
                  <div key={alloc.id} className="bg-blue-950/20 border border-sky-900/30 rounded-[32px] p-8 shadow-xl relative group hover:border-sky-500/30 transition-all">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">{subjectMap[alloc.subjectId]}</p>
                           <h4 className="text-xl font-black text-white uppercase leading-tight">{teacherMap[alloc.teacherId]}</h4>
                        </div>
                        <button 
                          onClick={() => setActivePupilLogId(alloc.id)}
                          className={`bg-black border border-sky-900/30 hover:bg-sky-600 text-slate-300 hover:text-white p-4 rounded-2xl transition-all flex flex-col items-center gap-1 group shadow-lg ${currentCount === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                          disabled={currentCount === 0}
                        >
                           <i className="fas fa-users text-lg"></i>
                           <span className="text-[8px] font-black uppercase">Roll Call</span>
                        </button>
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                           <span className="text-[10px] font-black text-slate-600 uppercase">Load Today</span>
                           <span className="text-2xl font-black text-white">{currentCount} <span className="text-[10px] text-slate-500">PDS</span></span>
                        </div>
                        <div className="flex gap-2">
                           {[0, 1, 2, 3, 4, 5].map(num => (
                             <button
                               key={num}
                               onClick={() => handleStagePeriod(alloc.id, num)}
                               className={`flex-1 py-4 rounded-xl text-sm font-black transition-all border-2 ${
                                 currentCount === num 
                                 ? 'bg-sky-600 border-sky-400 text-white shadow-xl' 
                                 : 'bg-black border-sky-900/20 text-slate-700 hover:border-sky-800'
                               }`}
                             >
                               {num}
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="mt-8 pt-6 border-t border-sky-900/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-xl bg-black flex items-center justify-center text-sm border border-sky-900/30 ${currentCount > 0 ? 'text-sky-500' : 'text-slate-800'}`}>
                              <i className="fas fa-user-check"></i>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Pupils Logged</p>
                              <p className="text-sm font-black text-white">
                                {currentCount > 0 
                                  ? (presentCount > 0 || stagedAttendance[alloc.id] ? `${presentCount} / ${classStudents.length}` : `Default: ${classStudents.length} Present`) 
                                  : 'Zero Logged'
                                }
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
                );
             })}
           {classAllocations.length === 0 && (
             <div className="col-span-full py-20 text-center bg-blue-950/10 border-2 border-dashed border-sky-900/20 rounded-[40px]">
                <p className="text-slate-600 uppercase font-black tracking-widest text-xs">No active allocations found for this stream.</p>
             </div>
           )}
        </div>

        {activePupilLogId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-blue-950 border border-sky-900/50 rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-8 border-b border-sky-900/30 flex justify-between items-center bg-black/50">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Pupil Session Log</h3>
                    <p className="text-xs text-sky-400 font-bold uppercase tracking-widest mt-1">
                      {classInfo?.name} • {subjectMap[allocations.find(a => a.id === activePupilLogId)?.subjectId || '']}
                    </p>
                 </div>
                 <button onClick={() => setActivePupilLogId(null)} className="w-12 h-12 rounded-2xl bg-black border border-sky-900/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                   <i className="fas fa-times"></i>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar">
                {students.filter(s => s.class === classInfo?.name).map(student => {
                  const staged = stagedAttendance[activePupilLogId!]?.[student.id];
                  const sessionRecord = sessions.find(s => s.allocationId === activePupilLogId && s.date === selectedDate);
                  const existing = attendance.find(a => a.sessionId === sessionRecord?.id && a.studentId === student.id)?.status;
                  const status = staged || existing || 'P';
                  return (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-black/40 border border-sky-900/20 rounded-2xl group hover:border-sky-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-black border border-sky-900/30 flex items-center justify-center overflow-hidden">
                           {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user text-sky-900"></i>}
                        </div>
                        <p className="text-sm font-black text-white uppercase">{student.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleStagePupil(activePupilLogId!, student.id, 'P')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all border ${status === 'P' ? 'bg-sky-500 border-sky-400 text-white' : 'bg-black border-sky-900/30 text-slate-600'}`}>PRESENT</button>
                        <button onClick={() => handleStagePupil(activePupilLogId!, student.id, 'A')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all border ${status === 'A' ? 'bg-rose-600 border-rose-400 text-white' : 'bg-black border-sky-900/30 text-slate-600'}`}>ABSENT</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-6 bg-black/50 border-t border-sky-900/30">
                 <button onClick={() => setActivePupilLogId(null)} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Apply Log</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTargets = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-blue-950/20 p-8 rounded-[40px] border border-sky-900/30 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <i className="fas fa-bullseye text-sky-500"></i> Load Definitions
        </h3>
        {canManageTargets && (
          <div className="bg-black/40 p-8 rounded-3xl border border-sky-900/20 mb-10">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Create Academic Target</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Staff</label>
                  <select id="t-id" className="w-full bg-black border-2 border-sky-900/30 rounded-2xl p-4 text-xs text-white outline-none focus:border-sky-600 transition-all uppercase">
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Group</label>
                  <select id="c-id" className="w-full bg-black border-2 border-sky-900/30 rounded-2xl p-4 text-xs text-white outline-none focus:border-sky-600 transition-all uppercase">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Subject</label>
                  <select id="s-id" className="w-full bg-black border-2 border-sky-900/30 rounded-2xl p-4 text-xs text-white outline-none focus:border-sky-600 transition-all uppercase">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Weekly Target</label>
                  <div className="flex gap-3">
                     <input id="w-target" type="number" defaultValue="5" className="flex-1 bg-black border-2 border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none" />
                     <button onClick={() => {
                        const tid = (document.getElementById('t-id') as HTMLSelectElement).value;
                        const cid = (document.getElementById('c-id') as HTMLSelectElement).value;
                        const sid = (document.getElementById('s-id') as HTMLSelectElement).value;
                        const wt = parseInt((document.getElementById('w-target') as HTMLInputElement).value) || 0;
                        if(!tid || !cid || !sid) return alert("Fields mandatory.");
                        setAllocations([...allocations, { id: `PT-${Date.now()}`, teacherId: tid, classId: cid, subjectId: sid, weeklyTarget: wt }]);
                       }} className="bg-sky-500 hover:bg-sky-600 text-white px-8 rounded-2xl"><i className="fas fa-plus"></i></button>
                  </div>
               </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allocations.map(alloc => (
            <div key={alloc.id} className="bg-black/20 border border-sky-900/30 p-8 rounded-[32px] hover:border-sky-500/30 transition-all">
              <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">{subjectMap[alloc.subjectId]}</p>
              <h4 className="text-white font-black uppercase text-base mb-1">{teacherMap[alloc.teacherId]}</h4>
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-6">{classMap[alloc.classId]}</p>
              <div className="flex justify-between items-center pt-4 border-t border-sky-900/10">
                <span className="text-[10px] font-black text-slate-400 uppercase">Target: {alloc.weeklyTarget} WKLY</span>
                {canManageTargets && (
                  <button onClick={() => setAllocations(allocations.filter(a => a.id !== alloc.id))} className="text-slate-700 hover:text-rose-500 transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="bg-blue-950/40 p-8 rounded-[40px] border border-sky-900/30 flex justify-between items-center no-print shadow-2xl">
         <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Academic Load Analytics</h3>
            <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest mt-1">Staff Coverage Performance Metrics</p>
         </div>
         <button onClick={() => window.print()} className="bg-white text-black px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 flex items-center gap-3"><i className="fas fa-file-pdf"></i> Export Audit</button>
      </div>
      <div className="bg-white p-12 rounded-[40px] shadow-2xl border-2 border-slate-100 printable-card text-black font-sans">
         <div className="text-center mb-10 border-b-4 border-black pb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{schoolName}</h2>
            <h3 className="text-xl font-black uppercase tracking-widest mt-2">ACADEMIC PERIOD AUDIT</h3>
         </div>
         <div className="table-container">
           <table className="w-full border-collapse border-4 border-black min-w-[600px]">
              <thead>
               <tr className="bg-black text-white">
                  <th className="border-2 border-black p-5 text-left text-[11px] font-black uppercase">Staff</th>
                  <th className="border-2 border-black p-5 text-left text-[11px] font-black uppercase">Curriculum Allocation</th>
                  <th className="border-2 border-black p-5 text-center text-[11px] font-black uppercase w-24">Held</th>
                  <th className="border-2 border-black p-5 text-center text-[11px] font-black uppercase w-32">Yield %</th>
               </tr>
            </thead>
            <tbody>
               {allocations.map(alloc => {
                  const held = sessions.filter(s => s.allocationId === alloc.id).reduce((sum, s) => sum + s.periodsHeld, 0);
                  const yieldPct = alloc.weeklyTarget > 0 ? (held / alloc.weeklyTarget) * 100 : 0;
                  return (
                     <tr key={alloc.id} className="h-16 text-[13px] font-bold text-black border-2 border-black">
                        <td className="border-2 border-black px-6 uppercase font-black">{teacherMap[alloc.teacherId]}</td>
                        <td className="border-2 border-black px-6 uppercase font-bold text-slate-600">{subjectMap[alloc.subjectId]} / {classMap[alloc.classId]}</td>
                        <td className="border-2 border-black text-center font-black">{held}</td>
                        <td className="border-2 border-black text-center">
                           <span className={`px-4 py-1.5 rounded-full border-2 font-black ${yieldPct >= 80 ? 'bg-green-100 text-green-900' : 'bg-rose-100 text-rose-900'}`}>{yieldPct.toFixed(0)}%</span>
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

  const renderClassAudit = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="bg-blue-950/40 p-8 rounded-[40px] border border-sky-900/30 flex flex-col md:flex-row justify-between items-center no-print shadow-2xl gap-6">
         <div className="flex-1 w-full md:w-auto">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Audit Class Selection</label>
            <select value={selectedAuditClassId} onChange={e => setSelectedAuditClassId(e.target.value)} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-sm text-white font-bold outline-none uppercase">
              <option value="">Select Stream...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
         </div>
         <button onClick={() => window.print()} disabled={!selectedAuditClassId} className="bg-white text-black px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-3"><i className="fas fa-print"></i> Generate Class Audit</button>
      </div>
      {selectedAuditClassId && (
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border-2 border-slate-100 printable-card text-black font-sans">
           <div className="text-center mb-10 border-b-4 border-black pb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{schoolName}</h2>
              <h3 className="text-xl font-black uppercase tracking-widest mt-2 underline decoration-sky-500">CLASS PARTICIPATION AUDIT</h3>
           </div>
           <table className="w-full border-collapse border-4 border-black">
              <thead>
                 <tr className="bg-black text-white">
                    <th className="border-2 border-black p-5 text-left text-[11px] font-black uppercase w-12">#</th>
                    <th className="border-2 border-black p-5 text-left text-[11px] font-black uppercase">Student Identity</th>
                    <th className="border-2 border-black p-5 text-center text-[11px] font-black uppercase w-32">Aggregate %</th>
                 </tr>
              </thead>
              <tbody>
                 {students.filter(s => s.class === classMap[selectedAuditClassId]).map((student, idx) => (
                    <tr key={student.id} className="h-14 text-[12px] font-bold text-black border-2 border-black">
                       <td className="border-2 border-black text-center font-black">{idx + 1}</td>
                       <td className="border-2 border-black px-6 uppercase"><span className="font-black text-sm">{student.name}</span><span className="ml-4 text-[10px] font-mono text-slate-500">{student.id}</span></td>
                       <td className="border-2 border-black text-center font-black">---%</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );

  const renderStudentView = () => {
    const student = students.find(s => s.id === userId);
    if (!student) return null;
    const myClassId = classes.find(c => c.name === student.class)?.id;
    const mySessions = sessions.filter(s => allocations.find(a => a.id === s.allocationId)?.classId === myClassId);
    const totalHeld = mySessions.reduce((sum, s) => sum + s.periodsHeld, 0);
    const myAttendanceCount = attendance.filter(a => mySessions.some(s => s.id === a.sessionId) && a.studentId === userId && a.status === 'P').length;
    return (
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
        <div className="text-center space-y-2"><h2 className="text-4xl font-black text-white uppercase tracking-tighter">Academic Pulse</h2><p className="text-sky-500 text-[12px] font-black uppercase tracking-[0.4em]">Personal Participation Metrics</p></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-blue-950/20 p-12 rounded-[50px] border border-sky-900/30 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-chart-line text-9xl text-sky-500"></i></div>
              <p className="text-5xl font-black text-white tracking-tighter">{totalHeld}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sessions Held</p>
           </div>
           <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <div className="bg-blue-950/20 p-8 rounded-[32px] border border-sky-900/30 shadow-xl border-l-4 border-l-emerald-500">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Presence Count</p>
                 <p className="text-4xl font-black text-white uppercase tracking-tighter">{myAttendanceCount}</p>
              </div>
              <div className="bg-blue-950/20 p-8 rounded-[32px] border border-sky-900/30 shadow-xl border-l-4 border-l-amber-500">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Subjects</p>
                 <p className="text-4xl font-black text-white tracking-tighter">{new Set(mySessions.map(s => allocations.find(a => a.id === s.allocationId)?.subjectId)).size}</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap gap-2 border-b border-sky-900/30 pb-6 no-print">
        {[
          { id: 'TRACKING', label: 'PERIOD LOG', icon: 'fa-bolt', roles: ['ADMIN', 'ATTENDANCE_OFFICER', 'TEACHER'] },
          { id: 'TARGETS', label: 'LOAD SETTINGS', icon: 'fa-cog', roles: ['ADMIN'] },
          { id: 'REPORTS', label: 'TEACHER AUDIT', icon: 'fa-chalkboard-teacher', roles: ['ADMIN', 'TEACHER'] },
          { id: 'CLASS_AUDIT', label: 'CLASS AUDIT', icon: 'fa-users', roles: ['ADMIN', 'TEACHER'] },
          { id: 'STUDENT_VIEW', label: 'PARTICIPATION', icon: 'fa-wave-square', roles: ['STUDENT'] }
        ]
        .filter(tab => tab.roles.includes(userRole))
        .map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); if(tab.id === 'TRACKING') setSelectedClassId(null); }}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black transition-all uppercase tracking-[0.1em] ${
              activeTab === tab.id ? 'bg-sky-500 text-white shadow-2xl' : 'bg-black text-slate-500 border border-sky-900/30'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'TRACKING' && renderTracking()}
        {activeTab === 'TARGETS' && renderTargets()}
        {activeTab === 'REPORTS' && renderReports()}
        {activeTab === 'CLASS_AUDIT' && renderClassAudit()}
        {activeTab === 'STUDENT_VIEW' && renderStudentView()}
      </div>
    </div>
  );
};
