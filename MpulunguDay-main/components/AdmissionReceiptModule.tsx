
import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassInfo, Subject, UserRole } from '../types';

interface AdmissionReceiptModuleProps {
  students: Student[];
  classes: ClassInfo[];
  subjects: Subject[];
  schoolLogo?: string;
  schoolName: string;
  schoolMotto: string;
  schoolContact: string;
  userRole: UserRole;
  userId: string;
}

export const AdmissionReceiptModule: React.FC<AdmissionReceiptModuleProps> = ({ 
  students, classes, subjects, schoolLogo, schoolName, schoolMotto, schoolContact, userRole, userId 
}) => {
  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.id.localeCompare(b.id)), [students]);

  const [selectedStudentId, setSelectedStudentId] = useState(
    userRole === 'STUDENT' ? userId : (sortedStudents[0]?.id || '')
  );
  
  useEffect(() => {
    if (userRole === 'STUDENT') {
      setSelectedStudentId(userId);
    }
  }, [userRole, userId]);

  const student = sortedStudents.find(s => s.id === selectedStudentId);
  const classInfo = classes.find(c => c.name === student?.class);
  const assignedSubjects: Subject[] = classInfo 
    ? subjects.filter(s => classInfo.subjectIds.includes(s.id))
    : [];

  const handlePrint = () => {
    window.print();
  };

  const COAT_OF_ARMS_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Coat_of_arms_of_Zambia.svg/512px-Coat_of_arms_of_Zambia.svg.png";

  const renderReceiptContent = () => (
    <div className="bg-white text-black p-6 md:p-10 shadow-none mx-auto max-w-[850px] border border-slate-200 printable-card min-h-[1000px] flex flex-col font-sans animate-in fade-in duration-500">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { margin: 0; padding: 0; }
          .printable-card { 
            min-height: 0 !important; 
            height: auto !important; 
            padding: 5mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8 w-full border-b border-black pb-4">
        {/* Left: Correspondence Info */}
        <div className="w-1/3 text-[7px] font-black uppercase space-y-0.5 leading-tight">
          <div className="w-16 h-16 mb-2">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full border border-black flex items-center justify-center text-[6px] opacity-20">LOGO</div>
            )}
          </div>
          <p className="text-[6px] font-bold text-blue-800">EDUCATION IS THE KEY TO DEVELOPMENT</p>
          <p>ALL CORRESPONDENCE TO BE</p>
          <p>ADDRESSED TO THE HEADTEACHER</p>
          <p>NOT TO ANY INDIVIDUAL BY NAME</p>
          <p className="pt-1">CELL: {schoolContact || '+260977134049'}</p>
        </div>
        
        {/* Center: School Identity */}
        <div className="w-1/3 text-center pt-4">
          <h1 className="text-xl font-black uppercase tracking-tight leading-none mb-2">{schoolName || 'MPULUNGU DAY SECONDARY SCHOOL'}</h1>
          <p className="text-[10px] font-bold uppercase">P.O. BOX 124</p>
          <p className="text-[10px] font-bold uppercase">MPULUNGU</p>
        </div>

        {/* Right: Coat of Arms */}
        <div className="w-1/3 flex justify-end items-start pt-2">
           <img 
             src={COAT_OF_ARMS_URL} 
             alt="Coat of Arms" 
             className="w-20 h-20 object-contain"
           />
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-[0.1em]">
          OFFICIAL ADMISSION RECEIPT
        </h2>
      </div>

      {/* Student Details Grid */}
      <div className="w-full border-collapse mb-8 text-[11px] font-black">
        {/* Row 1 */}
        <div className="grid grid-cols-12 border-t border-black">
          <div className="col-span-3 border-l border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">STUDENT NO.</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center">{student?.id || '0'}</div>
          <div className="col-span-3 border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">DOA</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center">{student?.dateOfAdmission?.split('-').reverse().join('.') || '0'}</div>
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-12">
          <div className="col-span-3 border-l border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">NAME</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center uppercase">{student?.name || 'N/A'}</div>
          <div className="col-span-3 border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">CLUB</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center uppercase">{student?.club || 'NONE'}</div>
        </div>
        {/* Row 3 */}
        <div className="grid grid-cols-12">
          <div className="col-span-3 border-l border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">CLASS</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center uppercase">{student?.class || 'N/A'}</div>
          <div className="col-span-3 border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">GUARDIAN</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center uppercase">{student?.guardianName || 'N/A'}</div>
        </div>
        {/* Row 4 */}
        <div className="grid grid-cols-12">
          <div className="col-span-3 border-l border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">GENDER</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center uppercase">{student?.gender || 'N/A'}</div>
          <div className="col-span-3 border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">ADDRESS</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center uppercase">{student?.residentialAddress || 'N/A'}</div>
        </div>
        {/* Row 5 */}
        <div className="grid grid-cols-12">
          <div className="col-span-3 border-l border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">DOB</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center">{student?.dob?.split('-').reverse().join('.') || 'N/A'}</div>
          <div className="col-span-3 border-r border-b border-black bg-[#e5e7eb] p-2 uppercase">CONTACT</div>
          <div className="col-span-3 border-r border-b border-black p-2 text-center">{student?.contact || 'N/A'}</div>
        </div>
      </div>

      {/* Subjects Header */}
      <div className="text-center mb-8">
        <p className="text-xl font-black uppercase tracking-tight">You will be taking the following subjects:</p>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-2 gap-x-16 gap-y-4 mb-12 px-2">
        {assignedSubjects.length > 0 ? (
          assignedSubjects.map((sub, idx) => (
            <div key={idx} className="border border-black px-4 py-1 text-center font-bold text-xs md:text-[11px] uppercase tracking-wider">
              {sub.name}
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-slate-400 font-black uppercase italic py-8 border border-dashed border-black">
            No subjects assigned yet.
          </div>
        )}
        {/* Fill with empty boxes if less than 8 to maintain visual consistency if desired, or just show assigned */}
        {assignedSubjects.length > 0 && assignedSubjects.length < 8 && Array.from({ length: 8 - assignedSubjects.length }).map((_, i) => (
          <div key={`empty-${i}`} className="border border-black px-4 py-1 h-6"></div>
        ))}
      </div>

      {/* Signatures Section */}
      <div className="mt-auto grid grid-cols-2 gap-x-24 gap-y-8 pb-10">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase text-center mb-1">DEPUTY HEADTEACHER</p>
          <div className="h-10 border border-black w-full"></div>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase text-center mb-1">GRADE TEACHER</p>
          <div className="h-10 border border-black w-full"></div>
        </div>
        <div className="col-span-2 flex justify-end">
           <div className="w-1/2 space-y-1">
             <p className="text-[11px] font-black uppercase text-center mb-1">GUIDANCE TEACHER</p>
             <div className="h-10 border border-black w-full"></div>
           </div>
        </div>
      </div>

      {/* Footer System Branding */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-center text-[7px] font-black uppercase opacity-20 no-print">
        Official Digital Archive • Generated via MPULUNGU DAY SECONDARY SCHOOL SMS • {new Date().toLocaleDateString()}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {userRole !== 'STUDENT' ? (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center no-print shadow-lg gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Target Student</label>
            <select 
              value={selectedStudentId} 
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full md:w-64 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none uppercase"
            >
              {sortedStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handlePrint}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fas fa-print"></i> Generate Document
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 no-print shadow-xl gap-4">
           <div className="text-center md:text-left">
              <h3 className="text-white font-black uppercase tracking-widest text-lg">My Admission Receipt</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Official Institutional Document</p>
           </div>
           <button 
              onClick={handlePrint}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
           >
              <i className="fas fa-print"></i> Print Official Copy
           </button>
        </div>
      )}

      <div className="table-container pb-10 flex justify-center bg-slate-950/50 rounded-[40px] p-8 min-h-screen">
        {renderReceiptContent()}
      </div>
    </div>
  );
};
