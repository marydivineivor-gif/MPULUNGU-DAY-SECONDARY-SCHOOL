import React, { useState, useMemo } from 'react';
import { Student, ClassInfo } from '../types';

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

interface RegisterModuleProps {
  students: Student[];
  classes: ClassInfo[];
  schoolName: string;
  schoolLogo: string;
}

export const RegisterModule: React.FC<RegisterModuleProps> = ({ students, classes, schoolName, schoolLogo }) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('1');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const studentsInClass = useMemo(() => {
    return students
      .filter(s => s.class === selectedClass)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [students, selectedClass]);

  const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
  const dayInitials = ['M', 'T', 'W', 'T', 'F'];

  const handlePrint = () => { window.print(); };

  const renderRegisterTable = () => {
    return (
      <div className="space-y-0 text-black block w-full overflow-x-auto print:overflow-visible pb-20">
        <div className="bg-white p-4 md:p-10 font-sans shadow-2xl mx-auto border border-slate-200 block w-full landscape-sheet printable-card">
          <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {schoolLogo ? <img src={schoolLogo} className="w-full h-full object-contain" /> : <i className="fas fa-school text-xl"></i>}
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none">
                  {schoolName.toUpperCase()}
                </h1>
                <p className="text-sm font-bold uppercase mt-1 tracking-widest">Official Institutional Period Register</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-black uppercase bg-black text-white px-4 py-1.5 rounded shadow-lg">Cloud Synchronized Copy</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 mb-8 text-[11px] font-black uppercase text-black">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-b-2 border-black pb-4">
                <p>STAFF: <span className="underline decoration-2 underline-offset-4">{teacherName || '_________________________________'}</span></p>
                <p>CLASS: <span className="underline decoration-2 underline-offset-4">{selectedClass || '_______'}</span></p>
                <p>SUBJECT: <span className="underline decoration-2 underline-offset-4">{subject || '__________________________'}</span></p>
                <p>SESSION: <span className="underline decoration-2 underline-offset-4">{year} TERM {term}</span></p>
            </div>
          </div>

          <div className="table-container">
            <table className="w-full border-collapse border-4 border-black text-[8px] font-black uppercase text-black table-fixed min-w-[1000px]">
              <thead className="bg-slate-100">
                <tr>
                  <th rowSpan={2} className="border-2 border-black p-1 w-[4%] text-center">#</th>
                  <th rowSpan={2} className="border-2 border-black p-1 w-[18%] text-left">STUDENT NAME</th>
                  <th rowSpan={2} className="border-2 border-black p-1 w-[3%] text-center">G</th>
                  {weeks.map(w => (
                    <th key={w} colSpan={5} className="border-2 border-black p-0 text-center bg-slate-50 text-[7px]">WK {w}</th>
                  ))}
                </tr>
                <tr className="bg-white">
                  {weeks.map(w => dayInitials.map((d, di) => (
                    <th key={`${w}-${di}`} className="border border-black p-0 text-center text-[6px] align-middle h-5">{d}</th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {studentsInClass.map((student, idx) => (
                  <tr key={student.id} className="h-8 hover:bg-slate-50 transition-colors">
                    <td className="border-2 border-black text-center font-bold">{idx + 1}</td>
                    <td className="border-2 border-black px-2 text-left truncate text-[10px] font-black">{student.name}</td>
                    <td className="border-2 border-black text-center text-[8px]">{student.gender.charAt(0)}</td>
                    {weeks.map(w => dayInitials.map((_, di) => (
                      <td key={`${w}-${di}`} className="border border-black p-0"></td>
                    )))}
                  </tr>
                ))}
                {/* Add a few extra blank rows if the list is short, but don't force page fill */}
                {studentsInClass.length < 10 && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`extra-${i}`} className="h-8">
                    <td className="border-2 border-black"></td>
                    <td className="border-2 border-black"></td>
                    <td className="border-2 border-black"></td>
                    {weeks.map(w => dayInitials.map((_, di) => (
                      <td key={`empty-${i}-${w}-${di}`} className="border border-black"></td>
                    )))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-12 flex justify-between items-end text-[10px] font-black uppercase text-black">
             <div className="space-y-2">
               <p className="tracking-widest">{schoolName} Institutional Data Archive</p>
               <p className="text-[8px] text-slate-500">Document generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
             </div>
             <div className="flex gap-16">
               <div className="text-center w-48 border-t-2 border-black pt-2">Registering Staff</div>
               <div className="text-center w-48 border-t-2 border-black pt-2">Head of Department</div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-24 block">
      {!selectedClass && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 block">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-white uppercase tracking-[0.3em] border-b-4 border-sky-600 inline-block pb-3 mb-6">REGISTER PORTAL</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Select class to generate official period tracking roll</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
            {classes.map(cls => (
              <ClassButton key={cls.id} label={cls.name} color={getClassColor(cls.name)} onClick={() => setSelectedClass(cls.name)} />
            ))}
          </div>
        </div>
      )}

      {selectedClass && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 block">
          <div className="bg-blue-950/40 p-6 md:p-8 rounded-[40px] border border-sky-900/30 flex flex-col lg:flex-row justify-between items-center no-print shadow-2xl gap-8 mb-12">
            <div className="flex items-center gap-6 self-start md:self-center">
              <button onClick={() => setSelectedClass(null)} className="w-12 h-12 bg-black border border-sky-900/30 hover:bg-sky-600 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 shadow-lg"><i className="fas fa-arrow-left"></i></button>
              <div>
                <h3 className="text-white font-black uppercase text-xl tracking-[0.1em]">{selectedClass} Register</h3>
                <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest">Dynamic Flowing Layout Document</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Staff Name" className="flex-1 md:w-48 bg-black border border-sky-900/30 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none focus:border-sky-500" />
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="flex-1 md:w-48 bg-black border border-sky-900/30 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none focus:border-sky-500" />
              <button onClick={handlePrint} className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"><i className="fas fa-print"></i> Print Register</button>
            </div>
          </div>
          <div className="block">{renderRegisterTable()}</div>
        </div>
      )}
    </div>
  );
};