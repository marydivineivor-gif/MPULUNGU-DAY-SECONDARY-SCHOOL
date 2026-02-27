
import React, { useState, useMemo } from 'react';
import { Subject, Student, ClassInfo, StudentMark, ExamSession, GradeScale } from '../types';

interface TransferFormModuleProps {
  students: Student[];
  classes: ClassInfo[];
  subjects: Subject[];
  schoolName: string;
  marks: StudentMark[];
  sessions: ExamSession[];
  gradeScales: GradeScale[];
}

export const TransferFormModule: React.FC<TransferFormModuleProps> = ({ 
  students, classes, subjects, schoolName, marks, sessions, gradeScales 
}) => {
  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.id.localeCompare(b.id)), [students]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [destinationSchool, setDestinationSchool] = useState('Any School');

  const student = sortedStudents.find(s => s.id === selectedStudentId);
  const classInfo = classes.find(c => c.name === student?.class);
  
  const assignedSubjects: Subject[] = useMemo(() => {
    if (!classInfo) return [];
    return subjects.filter(s => classInfo.subjectIds.includes(s.id));
  }, [classInfo, subjects]);

  const studentPerformance = useMemo(() => {
    if (!selectedStudentId) return null;
    
    const studentMarks = marks.filter(m => m.studentId === selectedStudentId);
    if (studentMarks.length === 0) return null;

    const activeSessionIds = new Set(studentMarks.map(m => m.sessionId));
    const activeSessions = sessions.filter(s => activeSessionIds.has(s.id));
    
    const latestSession = [...activeSessions].sort((a, b) => b.id.localeCompare(a.id))[0];
    
    if (!latestSession) return null;

    const latestMarks = studentMarks.filter(m => m.sessionId === latestSession.id);
    
    return {
      session: latestSession,
      marks: latestMarks
    };
  }, [selectedStudentId, marks, sessions]);

  const getGradeLabel = (score: number) => {
    if (score === -1) return 'X';
    const scale = gradeScales.find(g => score >= g.minMark && score <= g.maxMark && g.label !== 'X');
    return scale ? scale.label : '-';
  };

  const COAT_OF_ARMS_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Coat_of_arms_of_Zambia.svg/512px-Coat_of_arms_of_Zambia.svg.png";

  const handlePrint = () => window.print();

  const renderTransferForm = (isPrint: boolean = false) => {
    if (!student) return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
        <i className="fas fa-file-import text-4xl text-slate-700 mb-4"></i>
        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Select a student to generate transfer request</p>
      </div>
    );

    return (
      <div className={`bg-white text-black p-6 md:p-10 ${isPrint ? 'w-full' : 'shadow-2xl mx-auto max-w-[800px] border-2 border-slate-200'} printable-card min-h-[1000px] flex flex-col font-sans relative overflow-hidden`}>
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
        <div className="text-center space-y-2 mb-6 relative z-10">
          <img src={COAT_OF_ARMS_URL} alt="Zambia" className="w-16 h-16 mx-auto mb-2 object-contain" />
          <h1 className="text-lg font-black uppercase tracking-widest leading-none">REPUBLIC OF ZAMBIA</h1>
          <h2 className="text-base font-black uppercase tracking-widest leading-none">MINISTRY OF EDUCATION</h2>
        </div>

        <div className="flex justify-end mb-8 relative z-10">
          <div className="text-right font-black uppercase text-sm space-y-0.5">
            <p className="text-lg font-black mb-1">{schoolName}</p>
            <p>P.O. BOX 124</p>
            <p>MPULUNGU</p>
            <p>DATE: {new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}</p>
          </div>
        </div>

        <div className="mb-8 relative z-10">
          <div className="font-black uppercase text-sm space-y-1">
            <p>The Headteacher</p>
            <div className="flex items-center gap-2">
               <span className="hidden print:inline-block border-b-2 border-black min-w-[250px]">{destinationSchool}</span>
               <input 
                 value={destinationSchool} 
                 onChange={(e) => setDestinationSchool(e.target.value)} 
                 className="print:hidden border-b-2 border-black outline-none font-black text-sm uppercase px-1 w-72 placeholder:text-slate-300"
                 placeholder="Enter Destination School..."
               />
            </div>
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <p className="font-black text-sm">Dear Sir/Madam,</p>
        </div>

        <div className="mb-4 relative z-10">
           <p className="font-black text-base underline uppercase tracking-tight">RE: TRANSFER OF STUDENT: {student.name}</p>
        </div>

        <div className="grid grid-cols-12 border-2 border-black mb-6 relative z-10 overflow-hidden rounded-sm">
          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">STUDENT NO.</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black p-2 font-black text-xs text-center">{student.id}</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">DOA</div>
          <div className="col-span-3 border-b-2 border-black p-2 font-black text-xs text-center">{student.dateOfAdmission.split('-').reverse().join('.')}</div>

          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">FULL NAME</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black p-2 font-black text-xs text-center uppercase">{student.name}</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">CLUB/SOCIETY</div>
          <div className="col-span-3 border-b-2 border-black p-2 font-black text-xs text-center uppercase">{student.club || 'NONE'}</div>

          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">CLASS</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black p-2 font-black text-xs text-center uppercase">{student.class}</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">GUARDIAN</div>
          <div className="col-span-3 border-b-2 border-black p-2 font-black text-xs text-center uppercase">{student.guardianName}</div>

          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">GENDER</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black p-2 font-black text-xs text-center uppercase">{student.gender}</div>
          <div className="col-span-3 border-r-2 border-b-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">ADDRESS</div>
          <div className="col-span-3 border-b-2 border-black p-2 font-black text-xs text-center uppercase truncate">{student.residentialAddress}</div>

          <div className="col-span-3 border-r-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">DOB</div>
          <div className="col-span-3 border-r-2 border-black p-2 font-black text-xs text-center">{student.dob.split('-').reverse().join('.')}</div>
          <div className="col-span-3 border-r-2 border-black bg-slate-50 p-2 font-black uppercase text-[10px]">PHONE</div>
          <div className="col-span-3 p-2 font-black text-xs text-center">{student.contact}</div>
        </div>

        <div className="mb-6 relative z-10">
          <p className="font-black text-xs mb-4 underline uppercase tracking-widest text-center bg-slate-50 py-1.5 border-y-2 border-black">
            Official Academic Record & Curriculum Profile {studentPerformance ? `(${studentPerformance.session.name} - ${studentPerformance.session.year})` : ''}
          </p>
          
        <div className="table-container">
          <table className="w-full border-collapse border-2 border-black text-xs min-w-[600px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border-2 border-black p-2 text-left uppercase font-black">Registered Subject Curriculum</th>
                <th className="border-2 border-black p-2 text-center uppercase w-24 font-black">Score (%)</th>
                <th className="border-2 border-black p-2 text-center uppercase w-24 font-black">Grade</th>
              </tr>
            </thead>
            <tbody>
              {assignedSubjects.length > 0 ? (
                assignedSubjects.map(sub => {
                  const mark = studentPerformance?.marks.find(m => m.subjectId === sub.id);
                  return (
                    <tr key={sub.id} className="h-8">
                      <td className="border-2 border-black p-2 font-black uppercase">{sub.name}</td>
                      <td className="border-2 border-black p-2 text-center font-black text-sm">
                        {mark ? (mark.score === -1 ? 'X' : mark.score) : '---'}
                      </td>
                      <td className="border-2 border-black p-2 text-center font-black text-base">
                        {mark ? getGradeLabel(mark.score) : '---'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="border-2 border-black p-8 text-center text-slate-400 font-black uppercase italic text-sm">
                    No curriculum subjects associated with current class profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          
          {!studentPerformance && assignedSubjects.length > 0 && (
            <p className="text-[10px] font-black text-slate-600 mt-4 uppercase italic text-center">
              Notice: The data above reflects the standard institutional curriculum. Examination results for this session are pending or not recorded.
            </p>
          )}
        </div>

        <div className="mt-auto pt-8 relative z-10 grid grid-cols-2 gap-16 items-end">
           <div className="border-t-2 border-black pt-2 text-center text-[10px] font-black uppercase">
             HEADTEACHER'S SIGNATURE
           </div>
           <div className="border-2 border-black h-28 flex items-center justify-center italic text-slate-200 text-[10px] font-black uppercase relative overflow-hidden">
              <span className="opacity-10 scale-125 rotate-[-45deg] whitespace-nowrap">OFFICIAL INSTITUTIONAL SEAL</span>
              <span className="relative z-10">OFFICIAL STAMP</span>
           </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[8px] font-black uppercase opacity-30 no-print">
          Generated via MPULUNGU DAY SECONDARY SCHOOL SMS • Official Transfer Document Ref: TR-{student.id}-{new Date().getFullYear()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center no-print shadow-2xl gap-8">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 text-2xl">
             <i className="fas fa-file-signature"></i>
          </div>
          <div className="w-full md:w-80">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1">Select Student Record</label>
            <select 
              value={selectedStudentId} 
              onChange={(e) => setSelectedStudentId(e.target.value)} 
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white font-black outline-none uppercase focus:border-blue-600 transition-all"
            >
              <option value="">Select Target...</option>
              {sortedStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={handlePrint} 
            disabled={!selectedStudentId} 
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:opacity-50 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <i className="fas fa-print"></i> Generate & Print Letter
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center">
        {renderTransferForm(false)}
      </div>
    </div>
  );
};
