import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { Printer, Download, Users, GraduationCap, Heart } from 'lucide-react';

interface BursaryModuleProps {
  students: Student[];
}

export const BursaryModule: React.FC<BursaryModuleProps> = ({ students }) => {
  const [filter, setFilter] = useState<'ALL' | 'OVC' | 'KGS' | 'CAMFED'>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  const bursaryStudents = useMemo(() => {
    return students.filter(s => {
      const matchesType = 
        filter === 'ALL' ? (s.isOVC || s.isKGS || s.isCAMFED) :
        filter === 'OVC' ? s.isOVC :
        filter === 'KGS' ? s.isKGS :
        filter === 'CAMFED' ? s.isCAMFED : false;
      
      const matchesGrade = gradeFilter === 'ALL' || (s.class && s.class.startsWith(gradeFilter));
      
      return matchesType && matchesGrade;
    });
  }, [students, filter, gradeFilter]);

  const stats = useMemo(() => {
    const counts = {
      total: bursaryStudents.length,
      male: bursaryStudents.filter(s => s.gender === 'Male').length,
      female: bursaryStudents.filter(s => s.gender === 'Female').length,
      ovc: bursaryStudents.filter(s => s.isOVC).length,
      kgs: bursaryStudents.filter(s => s.isKGS).length,
      camfed: bursaryStudents.filter(s => s.isCAMFED).length,
    };
    return counts;
  }, [bursaryStudents]);

  const grades = useMemo(() => {
    const uniqueGrades = Array.from(new Set(students.map(s => (s.class || '').split(' ')[0] || s.class || 'Unknown'))).sort();
    return uniqueGrades;
  }, [students]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = "ID,Name,Class,Gender,OVC,KGS,CAMFED\n";
    const rows = bursaryStudents.map(s => 
      `${s.id},"${s.name}","${s.class}",${s.gender},${s.isOVC ? 'Yes' : 'No'},${s.isKGS ? 'Yes' : 'No'},${s.isCAMFED ? 'Yes' : 'No'}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bursary_ovc_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-blue-950/40 p-4 rounded-2xl border border-sky-900/30 shadow-lg no-print">
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Bursaries & OVC Tracking</h2>
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-1">Vulnerability Support Program</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="flex-1 sm:flex-none bg-black border border-sky-900/30 rounded-xl px-4 py-2 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="ALL">All Support Types</option>
            <option value="OVC">OVC Only</option>
            <option value="KGS">KGS Only</option>
            <option value="CAMFED">CAMFED Only</option>
          </select>

          <select 
            value={gradeFilter} 
            onChange={(e) => setGradeFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-black border border-sky-900/30 rounded-xl px-4 py-2 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="ALL">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <button onClick={handlePrint} className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-900/50 text-sky-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-sky-900/30 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          
          <button onClick={handleDownloadCSV} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div className="bg-blue-950/40 p-4 rounded-2xl border border-sky-900/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Tagged</p>
            <p className="text-xl font-black text-white">{stats.total}</p>
          </div>
        </div>
        <div className="bg-blue-950/40 p-4 rounded-2xl border border-sky-900/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Female</p>
            <p className="text-xl font-black text-white">{stats.female}</p>
          </div>
        </div>
        <div className="bg-blue-950/40 p-4 rounded-2xl border border-sky-900/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Male</p>
            <p className="text-xl font-black text-white">{stats.male}</p>
          </div>
        </div>
        <div className="bg-blue-950/40 p-4 rounded-2xl border border-sky-900/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OVC Count</p>
            <p className="text-xl font-black text-white">{stats.ovc}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-blue-950/20 rounded-3xl border border-sky-900/30 overflow-hidden shadow-2xl printable-card">
        <div className="p-6 border-b border-sky-900/30 flex justify-between items-center bg-black/20">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Vulnerable Students Registry</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase no-print">Showing {bursaryStudents.length} records</p>
        </div>
        
        <div className="table-container">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-black/50 border-b border-sky-900/30">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">OVC</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">KGS</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">CAMFED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/20">
              {bursaryStudents.map(student => (
                <tr key={student.id} className="hover:bg-sky-500/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-white uppercase group-hover:text-sky-400 transition-colors">{student.name}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-sky-400">{student.id}</td>
                  <td className="px-6 py-4 text-xs text-slate-300 uppercase font-bold">{student.class}</td>
                  <td className="px-6 py-4 text-xs text-slate-300 uppercase font-bold">{student.gender}</td>
                  <td className="px-6 py-4 text-center">
                    {student.isOVC ? <span className="text-emerald-400 font-black text-[10px]">YES</span> : <span className="text-slate-700 text-[10px]">--</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.isKGS ? <span className="text-sky-400 font-black text-[10px]">YES</span> : <span className="text-slate-700 text-[10px]">--</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.isCAMFED ? <span className="text-purple-400 font-black text-[10px]">YES</span> : <span className="text-slate-700 text-[10px]">--</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bursaryStudents.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <Heart className="w-12 h-12 text-sky-900/20" />
            <p className="text-slate-600 font-black uppercase text-xs tracking-widest">No vulnerable student records found for this filter</p>
          </div>
        )}
      </div>

      {/* Grade/Gender Summary Table */}
      <div className="bg-blue-950/20 rounded-3xl border border-sky-900/30 overflow-hidden shadow-2xl printable-card mt-8">
        <div className="p-6 border-b border-sky-900/30 bg-black/20">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">OVC Summary by Grade & Gender</h3>
        </div>
        <div className="table-container">
          <table className="w-full text-left">
            <thead className="bg-black/50 border-b border-sky-900/30">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Female OVC</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Male OVC</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Total OVC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/20">
              {grades.map(grade => {
                const gradeOVC = students.filter(s => s.isOVC && (s.class.startsWith(grade)));
                const female = gradeOVC.filter(s => s.gender === 'Female').length;
                const male = gradeOVC.filter(s => s.gender === 'Male').length;
                if (gradeOVC.length === 0) return null;
                return (
                  <tr key={grade} className="hover:bg-sky-500/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-white uppercase">{grade}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-pink-400">{female}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-blue-400">{male}</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-emerald-400">{gradeOVC.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
