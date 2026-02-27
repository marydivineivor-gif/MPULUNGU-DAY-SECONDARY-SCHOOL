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

interface ClassModuleProps {
  students: Student[];
  classes: ClassInfo[];
  schoolName: string;
  schoolLogo: string;
}

export const ClassModule: React.FC<ClassModuleProps> = ({ students, classes, schoolName, schoolLogo }) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const studentsInClass = useMemo(() => {
    return students
      .filter(s => s.class === selectedClass)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [students, selectedClass]);

  const maleCount = useMemo(() => studentsInClass.filter(s => s.gender === 'Male').length, [studentsInClass]);
  const femaleCount = useMemo(() => studentsInClass.filter(s => s.gender === 'Female').length, [studentsInClass]);
  const totalCount = studentsInClass.length;

  const handlePrint = () => {
    window.print();
  };

  const renderClassList = () => {
    return (
      <div className="table-container space-y-0 text-black font-sans max-w-[1000px] mx-auto block pb-10">
        <div className="bg-white p-4 md:p-8 shadow-2xl border border-slate-200 block min-w-[700px] printable-card">
          <div className="flex justify-between items-start mb-2 relative border-b-2 border-black pb-4">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                {schoolLogo ? <img src={schoolLogo} className="w-full h-full object-contain" alt="Logo" /> : <i className="fas fa-school opacity-20"></i>}
            </div>
            <div className="text-center flex-1">
                <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none mb-1">
                  {schoolName.toUpperCase()}
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Nominal Class Roll: {selectedClass?.toUpperCase()}</p>
            </div>
            <div className="w-16 h-16 shrink-0 flex justify-end">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Coat_of_arms_of_Zambia.svg/512px-Coat_of_arms_of_Zambia.svg.png" className="w-full h-full object-contain" alt="" />
            </div>
          </div>

          <div className="flex justify-between items-center my-6">
            <div className="text-[10px] font-black uppercase text-slate-500">
               Document Ref: CR-{selectedClass?.replace(/\s+/g, '')}-{new Date().getFullYear()}
            </div>
            <table className="border-collapse border-2 border-black text-[9px] font-black uppercase">
                <thead>
                  <tr className="bg-slate-50">
                      <th className="border border-black px-4 py-1.5">MALE</th>
                      <th className="border border-black px-4 py-1.5">FEMALE</th>
                      <th className="border border-black px-4 py-1.5 bg-slate-200">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center">
                      <td className="border border-black px-4 py-1.5 text-base">{maleCount}</td>
                      <td className="border border-black px-4 py-1.5 text-base">{femaleCount}</td>
                      <td className="border border-black px-4 py-1.5 text-base font-black bg-slate-50">{totalCount}</td>
                  </tr>
                </tbody>
            </table>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[10px] uppercase font-black text-black">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-black p-2 w-14 text-center">S/N</th>
                <th className="border border-black p-2 text-left">STUDENT NAME</th>
                <th className="border border-black p-2 w-40 text-left">IDENTITY NUMBER</th>
                <th className="border border-black p-2 w-24 text-center">GENDER</th>
              </tr>
            </thead>
            <tbody>
              {studentsInClass.map((student, idx) => (
                <tr key={student.id} className="h-9 hover:bg-slate-50 transition-colors border-b border-slate-200">
                  <td className="border-x border-black px-2 text-center font-bold">{idx + 1}</td>
                  <td className="border-x border-black px-4 text-left font-black text-sm">{student.name}</td>
                  <td className="border-x border-black px-4 text-left font-mono">{student.id}</td>
                  <td className="border-x border-black px-2 text-center font-bold">{student.gender}</td>
                </tr>
              ))}
              {/* Add blank rows for consistency if list is short */}
              {studentsInClass.length < 15 && Array.from({ length: 15 - studentsInClass.length }).map((_, i) => (
                <tr key={`extra-${i}`} className="h-9 border-b border-slate-200">
                  <td className="border-x border-black"></td>
                  <td className="border-x border-black"></td>
                  <td className="border-x border-black"></td>
                  <td className="border-x border-black"></td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-8 flex justify-between items-end text-[9px] font-black uppercase text-slate-500">
             <div className="space-y-1">
               <p>Certified Official Copy &bull; {schoolName} Registry</p>
               <p className="text-[8px] italic">System Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
             </div>
             <div className="text-center min-w-[200px] border-t-2 border-black pt-2 text-black">
               Registrar's Signature & Seal
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
            <h2 className="text-3xl font-black text-white uppercase tracking-[0.3em] border-b-4 border-blue-600 inline-block pb-3 mb-6">
              ROLL GENERATOR
            </h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Select an active class to produce nominal list</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 max-w-7xl mx-auto px-4">
            {classes.map(cls => (
              <ClassButton key={cls.id} label={cls.name} color={getClassColor(cls.name)} onClick={() => setSelectedClass(cls.name)} />
            ))}
          </div>
        </div>
      )}

      {selectedClass && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 block">
          <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col lg:flex-row justify-between items-center no-print shadow-2xl gap-8 mb-12">
            <div className="flex items-center gap-6 self-start md:self-center">
              <button onClick={() => setSelectedClass(null)} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center text-white border border-slate-700 transition-all active:scale-90 shadow-lg"><i className="fas fa-arrow-left"></i></button>
              <div>
                <h3 className="text-white font-black uppercase text-xl tracking-[0.1em]">{selectedClass}</h3>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Nominal Roll Document</p>
              </div>
            </div>
            <button onClick={handlePrint} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"><i className="fas fa-print"></i> Generate List</button>
          </div>
          <div className="block">{renderClassList()}</div>
        </div>
      )}
    </div>
  );
};