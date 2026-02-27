import React, { useState, useMemo, useEffect } from 'react';
import { Student, ClassInfo, UserRole, AttendanceRecord } from '../types';

interface ClassButtonProps {
  label: string;
  color: 'green' | 'blue' | 'orange' | 'yellow';
  onClick: () => void;
}

const getClassColor = (name: string): 'green' | 'blue' | 'orange' | 'yellow' => {
  const n = name.toUpperCase();
  if (n.includes('A') || n.includes('GREEN')) return 'green';
  if (n.includes('B') || n.includes('BLUE')) return 'blue';
  if (n.includes('C') || n.includes('ORANGE')) return 'orange';
  if (n.includes('YELLOW')) return 'yellow';
  return 'blue';
};

const ClassButton: React.FC<ClassButtonProps> = ({ label, color, onClick }) => {
  const colorClasses = {
    green: "from-green-500 to-green-700 border-green-400 shadow-green-900/50",
    blue: "from-blue-500 to-blue-700 border-blue-400 shadow-blue-900/50",
    orange: "from-orange-400 to-orange-600 border-orange-300 shadow-orange-900/50",
    yellow: "from-yellow-400 to-yellow-600 border-yellow-300 shadow-yellow-900/50",
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full py-5 px-6 rounded-2xl border-2 bg-gradient-to-b 
        shadow-[0_12px_24px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.5)]
        transition-all duration-200 active:scale-95 active:translate-y-1
        ${colorClasses[color]}
        flex items-center justify-center text-center
      `}
    >
      <span className="text-black font-black text-base uppercase tracking-widest drop-shadow-md">
        {label}
      </span>
    </button>
  );
};

type ViewMode = 'SELECTOR' | 'MARKING' | 'REPORTS' | 'STUDENT_VIEW';
type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TERMLY' | 'YEARLY';
type ConductType = 'E' | 'G' | 'F' | 'P' | null;

interface AttendanceModuleProps {
  students: Student[];
  classes: ClassInfo[];
  schoolName: string;
  userRole: UserRole;
  userId: string;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({ 
  students, classes, schoolName, userRole, userId, attendance, setAttendance 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(userRole === 'STUDENT' ? 'STUDENT_VIEW' : 'SELECTOR');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<ReportType>('WEEKLY');
  const [stagedAttendance, setStagedAttendance] = useState<Record<string, Partial<AttendanceRecord>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userRole === 'STUDENT') {
      const student = students.find(s => s.id === userId);
      if (student) setSelectedClass(student.class);
    }
  }, [userRole, userId, students]);

  const studentsInClass = useMemo(() => 
    students
      .filter(s => s.class === selectedClass)
      .sort((a, b) => a.id.localeCompare(b.id)), 
    [students, selectedClass]
  );

  const getDateRange = (type: ReportType, anchorDate: string): string[] => {
    const dates: string[] = [];
    const d = new Date(anchorDate);

    if (type === 'WEEKLY') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      for (let i = 0; i < 5; i++) {
        const next = new Date(monday);
        next.setDate(monday.getDate() + i);
        dates.push(next.toISOString().split('T')[0]);
      }
    } else if (type === 'MONTHLY') {
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const date = new Date(year, month, i);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          dates.push(date.toISOString().split('T')[0]);
        }
      }
    } else if (type === 'TERMLY') {
      const year = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1);
      for (let i = 0; i < 90; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          dates.push(date.toISOString().split('T')[0]);
        }
      }
    }
    return dates;
  };

  const updateStudentDay = (studentId: string, updates: Partial<AttendanceRecord>) => {
    if (userRole === 'STUDENT') return;
    setStagedAttendance(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), ...updates }
    }));
  };

  const handleSaveRegister = async () => {
    const studentIds = Object.keys(stagedAttendance);
    if (studentIds.length === 0) {
      alert('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      setAttendance(prev => {
        let updated = [...prev];
        studentIds.forEach(studentId => {
          const updates = stagedAttendance[studentId];
          const existingIdx = updated.findIndex(r => r.date === currentDate && r.studentId === studentId);
          if (existingIdx > -1) {
            updated[existingIdx] = { ...updated[existingIdx], ...updates };
          } else {
            updated.push({
              id: `ATT-${studentId}-${currentDate}`,
              date: currentDate,
              studentId,
              status: null,
              conduct: null,
              ...updates as any
            });
          }
        });
        return updated;
      });
      setStagedAttendance({});
      alert('Attendance register saved and synced to cloud!');
    } catch (error) {
      alert('Failed to save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getConductColor = (conduct: ConductType) => {
    switch (conduct) {
      case 'E': return 'bg-emerald-600 text-white border-emerald-400';
      case 'G': return 'bg-blue-600 text-white border-blue-400';
      case 'F': return 'bg-amber-600 text-white border-amber-400';
      case 'P': return 'bg-rose-600 text-white border-rose-400';
      default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const renderSelector = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-[0.3em] border-b-4 border-blue-600 inline-block pb-3 mb-6">
          ATTENDANCE & CONDUCT
        </h2>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Select an active class to manage daily records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 max-w-7xl mx-auto px-4">
        {classes.map(cls => (
          <ClassButton 
            key={cls.id}
            label={cls.name} 
            color={getClassColor(cls.name)} 
            onClick={() => { setSelectedClass(cls.name); setViewMode('MARKING'); }} 
          />
        ))}
      </div>
    </div>
  );

  const renderMarking = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col lg:flex-row justify-between items-center no-print shadow-2xl gap-8 mb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setViewMode('SELECTOR')}
            className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center text-white border border-slate-700 transition-all shadow-lg active:scale-95"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <div>
            <h3 className="text-white font-black uppercase text-xl tracking-[0.2em]">{selectedClass}</h3>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Daily Log: Attendance & Behavior</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Marking Date</label>
            <input 
              type="date" 
              value={currentDate} 
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => setViewMode('REPORTS')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3"
          >
            <i className="fas fa-file-alt text-blue-400"></i> Analytics
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl max-w-6xl mx-auto">
          <div className="table-container">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-64">Attendance Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-80">Conduct Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {studentsInClass.map(student => {
                const savedRecord = attendance.find(r => r.date === currentDate && r.studentId === student.id) || { status: null, conduct: null };
                const stagedRecord = stagedAttendance[student.id] || {};
                const record = { ...savedRecord, ...stagedRecord };
                return (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white uppercase">{student.name}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">ID: {student.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => updateStudentDay(student.id, { status: 'P' })}
                          className={`
                            px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex-1
                            ${record.status === 'P' 
                              ? 'bg-green-600 text-white shadow-[0_4px_12px_rgba(22,163,74,0.4)]' 
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }
                          `}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => updateStudentDay(student.id, { status: 'A' })}
                          className={`
                            px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex-1
                            ${record.status === 'A' 
                              ? 'bg-rose-600 text-white shadow-[0_4px_12px_rgba(225,29,72,0.4)]' 
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }
                          `}
                        >
                          A
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-1.5">
                        {(['E', 'G', 'F', 'P'] as ConductType[]).map(c => (
                           <button 
                             key={c}
                             onClick={() => updateStudentDay(student.id, { conduct: c })}
                             className={`
                               w-10 h-10 rounded-lg text-[10px] font-black transition-all border
                               ${record.conduct === c ? getConductColor(c) : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'}
                             `}
                             title={c === 'E' ? 'Excellent' : c === 'G' ? 'Good' : c === 'F' ? 'Fair' : 'Poor'}
                           >
                             {c}
                           </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-950/50 border-t border-slate-800 flex justify-end items-center gap-4">
          {Object.keys(stagedAttendance).length > 0 && (
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
              {Object.keys(stagedAttendance).length} Unsaved Changes
            </span>
          )}
          <button 
            onClick={handleSaveRegister}
            disabled={isSaving || Object.keys(stagedAttendance).length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 active:scale-95"
          >
            {isSaving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt text-lg"></i>}
            {isSaving ? 'Saving...' : 'Save & Sync Register'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStudentView = () => {
    const studentRecords = attendance.filter(r => r.studentId === userId);
    let presentCount = 0;
    let totalTracked = 0;
    let conductScores = { E: 0, G: 0, F: 0, P: 0 };
    
    studentRecords.forEach(record => {
      if (record.status) {
        totalTracked++;
        if (record.status === 'P') presentCount++;
      }
      if (record.conduct && record.conduct in conductScores) {
        conductScores[record.conduct as keyof typeof conductScores]++;
      }
    });

    const percentage = totalTracked > 0 ? (presentCount / totalTracked) * 100 : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter">My Attendance & Conduct</h2>
           <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Institutional cloud record overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 flex flex-col items-center text-center shadow-2xl">
              <p className="text-4xl font-black text-emerald-500 mb-2">{presentCount}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Days Present</p>
           </div>
           <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 flex flex-col items-center text-center shadow-2xl">
              <p className="text-4xl font-black text-white mb-2">{percentage.toFixed(1)}%</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Participation Rate</p>
           </div>
           <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 flex flex-col items-center text-center shadow-2xl">
              <p className="text-4xl font-black text-blue-500 mb-2">{conductScores.E}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Excellent Marks</p>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden">
           <div className="p-6 border-b border-slate-800 bg-slate-950/20">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Activity Log</h3>
           </div>
           <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...studentRecords].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 20).map(record => (
                  <div key={record.date} className={`p-4 rounded-2xl border flex flex-col items-center gap-1 ${record.status === 'P' ? 'bg-green-600/10 border-green-500/20 text-green-400' : 'bg-rose-600/10 border-rose-500/20 text-rose-400'}`}>
                     <span className="text-[8px] font-black uppercase">{record.date}</span>
                     <div className="flex items-center gap-2">
                        <i className={`fas ${record.status === 'P' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {record.conduct && <span className="font-black text-xs">[{record.conduct}]</span>}
                     </div>
                  </div>
              ))}
              {totalTracked === 0 && <p className="col-span-full text-center text-slate-600 uppercase font-black text-[10px]">No synchronized records found</p>}
           </div>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const dates = getDateRange(reportType, currentDate);
    
    const getYearlyPercentage = (studentId: string) => {
      const year = new Date(currentDate).getFullYear();
      let p = 0, total = 0;
      attendance.forEach(record => {
        if (record.studentId === studentId && record.date.startsWith(`${year}-`)) {
          if (record.status) {
            total++;
            if (record.status === 'P') p++;
          }
        }
      });
      return total > 0 ? (p / total) * 100 : 0;
    };

    return (
      <div className="animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col lg:flex-row justify-between items-center no-print shadow-2xl gap-8 mb-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setViewMode('MARKING')}
              className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center text-white border border-slate-700 transition-all shadow-lg active:scale-95"
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <div>
              <h3 className="text-white font-black uppercase text-xl tracking-[0.2em]">Institutional Register</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">{reportType} Official Cloud Records</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['WEEKLY', 'MONTHLY', 'TERMLY', 'YEARLY'] as ReportType[]).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  reportType === type 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className={`bg-white p-12 rounded-3xl shadow-2xl border-2 border-slate-200 printable-card text-black font-sans ${reportType !== 'YEARLY' ? 'overflow-x-auto' : ''}`}>
          <div className="text-center mb-10 border-b-2 border-black pb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{schoolName}</h2>
            <h3 className="text-lg font-black uppercase tracking-widest mt-2 text-slate-900">CLASS ATTENDANCE & CONDUCT REGISTER</h3>
            <p className="text-[11px] font-black uppercase text-slate-800 mt-2">Target Class: {selectedClass} | Period: {reportType}</p>
            <p className="text-[10px] font-black text-slate-700">Cloud Archive Ref: {new Date().toLocaleDateString()}</p>
          </div>

          {reportType === 'YEARLY' ? (
            <table className="w-full border-collapse border-2 border-black">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border-2 border-black p-3 text-left text-[11px] font-black uppercase text-black">#</th>
                  <th className="border-2 border-black p-3 text-left text-[11px] font-black uppercase text-black">Student Name</th>
                  <th className="border-2 border-black p-3 text-center text-[11px] font-black uppercase text-black">Identity</th>
                  <th className="border-2 border-black p-3 text-center text-[11px] font-black uppercase text-black">Yearly Presence %</th>
                  <th className="border-2 border-black p-3 text-center text-[11px] font-black uppercase text-black">Rating</th>
                </tr>
              </thead>
              <tbody>
                {studentsInClass.map((student, idx) => {
                  const pct = getYearlyPercentage(student.id);
                  return (
                    <tr key={student.id} className="h-10 text-[11px] font-bold text-black">
                      <td className="border-2 border-black px-4 text-center font-black">{idx + 1}</td>
                      <td className="border-2 border-black px-4 uppercase font-black text-slate-900">{student.name}</td>
                      <td className="border-2 border-black px-4 text-center font-mono font-black">{student.id}</td>
                      <td className="border-2 border-black text-center font-black bg-slate-50 text-slate-900">{pct.toFixed(1)}%</td>
                      <td className="border-2 border-black text-center">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${pct > 80 ? 'bg-green-100 text-green-900 border-green-300' : 'bg-rose-100 text-rose-900 border-rose-300'}`}>
                          {pct > 80 ? 'OPTIMAL' : 'BELOW AVG'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse border-2 border-black text-[10px]">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border-2 border-black p-2 text-left w-32 font-black uppercase text-black sticky left-0 bg-slate-200">Name</th>
                  {dates.map(date => (
                    <th key={date} className="border-2 border-black p-1 text-center min-w-[20px] font-black vertical-header h-24 text-black">
                       <div className="rotate-[-90deg] whitespace-nowrap">{date.split('-').slice(1).join('/')}</div>
                    </th>
                  ))}
                  <th className="border-2 border-black p-2 text-center font-black uppercase text-black bg-slate-200">Avg</th>
                </tr>
              </thead>
              <tbody>
                {studentsInClass.map(student => {
                  let p = 0, total = 0;
                  return (
                    <tr key={student.id} className="h-9 group hover:bg-slate-100 transition-colors">
                      <td className="border-2 border-black px-2 font-black uppercase truncate sticky left-0 bg-white group-hover:bg-slate-100 text-slate-900">{student.name}</td>
                      {dates.map(date => {
                        const record = attendance.find(r => r.date === date && r.studentId === student.id);
                        if (record?.status) {
                          total++;
                          if (record.status === 'P') p++;
                        }
                        return (
                          <td key={date} className="border-2 border-black text-center p-0 align-middle">
                            {record?.status === 'P' ? (
                              <i className="fas fa-check text-green-800 text-sm"></i>
                            ) : record?.status === 'A' ? (
                              <i className="fas fa-times text-rose-800 text-sm"></i>
                            ) : null}
                          </td>
                        );
                      })}
                      <td className="border-2 border-black text-center font-black bg-slate-100 text-slate-900">
                        {total > 0 ? ((p / total) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          
          <div className="mt-12 flex justify-between items-end">
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-900 underline">Register Legend:</p>
                <div className="flex gap-6 text-[10px] font-black uppercase text-slate-900">
                   <div className="flex items-center gap-2"><i className="fas fa-check text-green-800"></i> PRESENT</div>
                   <div className="flex items-center gap-2"><i className="fas fa-times text-rose-800"></i> ABSENT</div>
                </div>
                <div className="flex gap-6 text-[9px] font-black uppercase text-slate-800 italic">
                   <p>CONDUCT: [E] EXCELLENT [G] GOOD [F] FAIR [P] POOR</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[11px] font-black uppercase border-t-2 border-black pt-2 min-w-[220px] text-slate-900">Head of Institution Verification</p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {viewMode === 'SELECTOR' && renderSelector()}
      {viewMode === 'MARKING' && renderMarking()}
      {viewMode === 'REPORTS' && renderReports()}
      {viewMode === 'STUDENT_VIEW' && renderStudentView()}
    </div>
  );
};