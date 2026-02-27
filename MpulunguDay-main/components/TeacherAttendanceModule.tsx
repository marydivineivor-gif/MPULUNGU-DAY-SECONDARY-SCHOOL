import React, { useState, useMemo } from 'react';
import { Teacher, TeacherAttendance, Department, UserRole } from '../types';
import { Clock, CheckCircle, XCircle, FileText, Printer, Download, Calendar, Search } from 'lucide-react';

interface TeacherAttendanceModuleProps {
  teachers: Teacher[];
  attendance: TeacherAttendance[];
  setAttendance: React.Dispatch<React.SetStateAction<TeacherAttendance[]>>;
  departments: Department[];
  userRole: UserRole;
  userId: string;
  schoolName: string;
  schoolLogo?: string;
}

export const TeacherAttendanceModule: React.FC<TeacherAttendanceModuleProps> = ({
  teachers,
  attendance,
  setAttendance,
  departments,
  userRole,
  userId,
  schoolName,
  schoolLogo
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState<'WEEKLY' | 'MONTHLY' | 'TERMLY' | 'YEARLY'>('WEEKLY');
  const [stagedAttendance, setStagedAttendance] = useState<Record<string, Partial<TeacherAttendance>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isHoD = useMemo(() => departments.some(d => d.hodId === userId), [departments, userId]);
  const canManage = userRole === 'ADMIN' || isHoD;

  const dates = useMemo(() => {
    const d = new Date(selectedDate);
    const datesArr: string[] = [];
    if (reportType === 'WEEKLY') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      for (let i = 0; i < 5; i++) {
        const next = new Date(monday);
        next.setDate(monday.getDate() + i);
        datesArr.push(next.toISOString().split('T')[0]);
      }
    } else {
      // For MONTHLY, TERMLY, YEARLY in this view, we show the month of the selected date
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const date = new Date(year, month, i);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          datesArr.push(date.toISOString().split('T')[0]);
        }
      }
    }
    return datesArr;
  }, [selectedDate, reportType]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  const handleClockIn = (teacherId: string) => {
    if (!canManage) return;
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    setStagedAttendance(prev => ({
      ...prev,
      [teacherId]: { ...(prev[teacherId] || {}), clockIn: time, status: 'Reported', recordedBy: userId }
    }));
  };

  const handleClockOut = (teacherId: string) => {
    if (!canManage) return;
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    setStagedAttendance(prev => ({
      ...prev,
      [teacherId]: { ...(prev[teacherId] || {}), clockOut: time, status: 'Reported', recordedBy: userId }
    }));
  };

  const handleMarkAbsent = (teacherId: string) => {
    if (!canManage) return;
    setStagedAttendance(prev => ({
      ...prev,
      [teacherId]: { ...(prev[teacherId] || {}), status: 'Absent', clockIn: undefined, clockOut: undefined, recordedBy: userId }
    }));
  };

  const handleSaveRegisterAction = async () => {
    const teacherIds = Object.keys(stagedAttendance);
    if (teacherIds.length === 0) {
      alert('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      setAttendance(prev => {
        let updated = [...prev];
        teacherIds.forEach(teacherId => {
          const updates = stagedAttendance[teacherId];
          const existingIdx = updated.findIndex(a => a.teacherId === teacherId && a.date === selectedDate);
          if (existingIdx > -1) {
            updated[existingIdx] = { ...updated[existingIdx], ...updates };
          } else {
            updated.push({
              id: `TA-${teacherId}-${selectedDate}`,
              teacherId,
              date: selectedDate,
              ...updates
            } as TeacherAttendance);
          }
        });
        return updated;
      });
      setStagedAttendance({});
      alert('Teacher attendance register saved and synced to cloud!');
    } catch (error) {
      alert('Failed to save teacher attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const getAttendanceForTeacher = (teacherId: string) => {
    return attendance.find(a => a.teacherId === teacherId && a.date === selectedDate);
  };

  const triggerPrint = () => {
    window.print();
  };

  const renderReport = () => {
    const today = new Date();
    return (
      <div className="bg-white text-black p-10 font-sans border-2 border-black printable-card hidden print:block">
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          {schoolLogo && <img src={schoolLogo} className="w-20 h-20 mx-auto mb-4 object-contain" alt="Logo" />}
          <h1 className="text-3xl font-black uppercase tracking-tighter">{schoolName}</h1>
          <h2 className="text-xl font-bold uppercase mt-2">Staff Attendance Register ({reportType})</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-widest">Period: {dates[0]} to {dates[dates.length - 1]}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Generated: {today.toLocaleDateString()} {today.toLocaleTimeString()}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black px-4 py-2 text-[10px] font-black uppercase text-left">Staff Name</th>
                {dates.map(date => (
                  <th key={date} className="border border-black px-1 py-2 text-[8px] font-black uppercase text-center min-w-[50px]">
                    {new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  </th>
                ))}
                <th className="border border-black px-4 py-2 text-[10px] font-black uppercase text-right">Reported / Total</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => {
                let reportedCount = 0;
                return (
                  <tr key={teacher.id} className="h-10">
                    <td className="border border-black px-4 py-1 text-[11px] font-bold uppercase truncate max-w-[150px]">{teacher.name}</td>
                    {dates.map(date => {
                      const record = attendance.find(a => a.teacherId === teacher.id && a.date === date);
                      const isReported = record?.status === 'Reported';
                      if (isReported) reportedCount++;
                      return (
                        <td key={date} className="border border-black px-1 py-1 text-[9px] text-center font-mono">
                          {isReported ? (record.clockIn?.slice(0, 5) || 'P') : record?.status === 'Absent' ? 'A' : '-'}
                        </td>
                      );
                    })}
                    <td className="border border-black px-4 py-1 text-[11px] text-right font-black bg-slate-50">
                      {reportedCount} / {dates.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-12 flex justify-between items-end">
          <div className="text-[10px] font-black uppercase">
            <p>Report Verified By:</p>
            <div className="mt-8 border-t border-black pt-1 w-48">Signature / Stamp</div>
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase italic">MPULUNGU DAY SECONDARY SCHOOL SMS Attendance Engine</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Staff <span className="text-blue-500">Register</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Clock-In & Performance Tracking</p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
           <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-black outline-none uppercase"
              />
           </div>
           <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search Staff..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-none uppercase placeholder:text-slate-700"
              />
           </div>
           <div className="flex gap-2">
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-[10px] font-black text-white uppercase outline-none"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="TERMLY">Termly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              <button 
                onClick={triggerPrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Generate Report
              </button>
           </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl no-print">
        <div className="table-container">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Faculty Member</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Clock In</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Clock Out</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredTeachers.map(teacher => {
              const savedRecord = getAttendanceForTeacher(teacher.id);
              const stagedRecord = stagedAttendance[teacher.id] || {};
              const record = { ...savedRecord, ...stagedRecord };
              const isReported = record?.status === 'Reported';
              const isAbsent = record?.status === 'Absent';

              return (
                <tr key={teacher.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <i className="fas fa-user-tie"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-white uppercase tracking-tight">{teacher.name}</p>
                          <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${
                            teacher.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {teacher.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{teacher.subject || 'Staff Member'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {isReported ? (
                      <span className="px-3 py-1 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">Reported</span>
                    ) : isAbsent ? (
                      <span className="px-3 py-1 bg-rose-600/10 text-rose-400 border border-rose-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">Absent</span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-800 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">Pending</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-xs font-mono font-black text-slate-400">{record?.clockIn || '--:--:--'}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-xs font-mono font-black text-slate-400">{record?.clockOut || '--:--:--'}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       {!isReported && (
                         <button 
                           onClick={() => handleClockIn(teacher.id)}
                           disabled={!canManage}
                           className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
                         >
                           <CheckCircle className="w-3 h-3" /> Reported
                         </button>
                       )}
                       {isReported && !record?.clockOut && (
                         <button 
                           onClick={() => handleClockOut(teacher.id)}
                           disabled={!canManage}
                           className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
                         >
                           <Clock className="w-3 h-3" /> Clock Out
                         </button>
                       )}
                       {!isAbsent && !isReported && (
                         <button 
                           onClick={() => handleMarkAbsent(teacher.id)}
                           disabled={!canManage}
                           className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                         >
                           <XCircle className="w-3 h-3" /> Absent
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-8 bg-slate-950/50 border-t border-slate-800 flex justify-end items-center gap-4">
          {Object.keys(stagedAttendance).length > 0 && (
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
              {Object.keys(stagedAttendance).length} Unsaved Changes
            </span>
          )}
          <button 
            onClick={handleSaveRegisterAction}
            disabled={isSaving || Object.keys(stagedAttendance).length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 active:scale-95"
          >
            {isSaving ? <i className="fas fa-circle-notch animate-spin text-lg"></i> : <i className="fas fa-cloud-upload-alt text-lg"></i>}
            {isSaving ? 'Saving...' : 'Save & Sync Register'}
          </button>
        </div>
      </div>
    </div>

      {renderReport()}

      <div className="bg-blue-950/30 border border-blue-900/50 p-8 rounded-[32px] flex items-center justify-between no-print">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
               <FileText className="w-8 h-8" />
            </div>
            <div>
               <h3 className="text-lg font-black text-white uppercase tracking-tighter">Attendance Analytics</h3>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Review historical staff reporting patterns</p>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="text-center px-6 border-r border-blue-900/50">
               <p className="text-2xl font-black text-white">{attendance.filter(a => a.date === selectedDate && a.status === 'Reported').length}</p>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Present Today</p>
            </div>
            <div className="text-center px-6">
               <p className="text-2xl font-black text-rose-500">{attendance.filter(a => a.date === selectedDate && a.status === 'Absent').length}</p>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Absent Today</p>
            </div>
         </div>
      </div>
    </div>
  );
};
