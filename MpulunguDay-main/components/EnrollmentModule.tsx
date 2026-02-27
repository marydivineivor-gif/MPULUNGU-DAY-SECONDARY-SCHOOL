
import React, { useEffect, useState } from 'react';
import { getEnrollmentInsights } from '../services/geminiService';
import { Student } from '../types';

interface EnrollmentData {
  gradeName: string;
  sections: {
    name: string;
    male: number;
    female: number;
    total: number;
  }[];
  gradeMaleTotal: number;
  gradeFemaleTotal: number;
  gradeOverallTotal: number;
}

export const EnrollmentModule: React.FC<{ students: Student[] }> = ({ students }) => {
  const [insights, setInsights] = useState<string>('Analyzing enrollment trends...');
  const [loading, setLoading] = useState(true);

  // Grouping logic for the specific table layout
  const processEnrollment = (studentList: Student[]): EnrollmentData[] => {
    const groups: Record<string, EnrollmentData> = {};

    studentList.forEach(s => {
      // Split class name to identify grade and stream (e.g., "Grade 10 A")
      const parts = s.class.trim().split(/\s+/);
      let grade = '';
      let section = '';

      if (parts.length >= 3) {
        grade = parts.slice(0, 2).join(' ');
        section = parts.slice(2).join(' ');
      } else if (parts.length === 2) {
        grade = parts[0];
        section = parts[1];
      } else {
        grade = parts[0] || 'Unassigned';
        section = ''; 
      }

      if (!groups[grade]) {
        groups[grade] = {
          gradeName: grade,
          sections: [],
          gradeMaleTotal: 0,
          gradeFemaleTotal: 0,
          gradeOverallTotal: 0
        };
      }

      let secObj = groups[grade].sections.find(sec => sec.name === section);
      if (!secObj) {
        secObj = { name: section, male: 0, female: 0, total: 0 };
        groups[grade].sections.push(secObj);
      }

      if (s.gender === 'Male') {
        secObj.male++;
        groups[grade].gradeMaleTotal++;
      } else if (s.gender === 'Female') {
        secObj.female++;
        groups[grade].gradeFemaleTotal++;
      }
      secObj.total++;
      groups[grade].gradeOverallTotal++;
    });

    // Define standard academic sorting order
    const order = ["Grade 12", "Grade 11", "Grade 10", "Grade 9", "Grade 8", "Form 1", "Form 2"];
    return Object.values(groups).sort((a, b) => {
      const idxA = order.indexOf(a.gradeName);
      const idxB = order.indexOf(b.gradeName);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.gradeName.localeCompare(b.gradeName);
    });
  };

  // Strictly include only 'Active' status students in current enrollment reports
  // Excludes 'Transferred', 'Alumni', and 'Dropped out' students as requested
  const activeStudents = students.filter(s => s.status === 'Active');
  const enrollmentData = processEnrollment(activeStudents);

  const grandTotalMale = enrollmentData.reduce((acc, g) => acc + g.gradeMaleTotal, 0);
  const grandTotalFemale = enrollmentData.reduce((acc, g) => acc + g.gradeFemaleTotal, 0);
  const grandTotalOverall = enrollmentData.reduce((acc, g) => acc + g.gradeOverallTotal, 0);

  useEffect(() => {
    const fetchInsights = async () => {
      if (activeStudents.length === 0) {
        setInsights("Register active students to receive AI enrollment insights.");
        setLoading(false);
        return;
      }
      const summary = enrollmentData.map(g => ({
        grade: g.gradeName,
        total: g.gradeOverallTotal,
        genderRatio: `${g.gradeMaleTotal}/${g.gradeFemaleTotal}`
      }));
      const result = await getEnrollmentInsights(summary);
      setInsights(result || 'No insights available.');
      setLoading(false);
    };
    fetchInsights();
  }, [activeStudents.length, enrollmentData]);

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `Institutional_Enrollment_Report_${new Date().toISOString().split('T')[0]}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-5 group hover:border-blue-500/30 transition-all">
          <div className="w-14 h-14 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 text-2xl group-hover:scale-110 transition-transform">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <h3 className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Active Enrollment</h3>
            <p className="text-3xl font-black text-white">{grandTotalOverall}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-5 group hover:border-green-500/30 transition-all">
          <div className="w-14 h-14 bg-green-600/10 rounded-xl flex items-center justify-center text-green-500 text-2xl group-hover:scale-110 transition-transform">
            <i className="fas fa-venus-mars"></i>
          </div>
          <div>
            <h3 className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Gender Balance</h3>
            <p className="text-3xl font-black text-white">{grandTotalOverall > 0 ? ((grandTotalFemale / grandTotalOverall) * 100).toFixed(0) : 0}% <span className="text-xs text-slate-500 font-bold tracking-normal">Female</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-2 border-slate-200 landscape-sheet printable-card">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center no-print gap-4">
           <h2 className="text-black font-black uppercase tracking-tight text-lg">Institutional Enrolment Report</h2>
           <div className="flex gap-3">
             <button onClick={handleDownloadPdf} className="bg-rose-600 text-white px-6 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg flex items-center gap-2">
               <i className="fas fa-file-pdf"></i> Download PDF
             </button>
             <button onClick={() => window.print()} className="bg-black text-white px-6 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
               <i className="fas fa-print"></i> Print Report
             </button>
           </div>
        </div>
        
        <div className="table-container p-4 md:p-8 bg-white">
          <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
             <h1 className="text-2xl font-black uppercase tracking-tighter">Official Institutional Roll</h1>
             <p className="text-[10px] font-bold uppercase tracking-widest">Report Date: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
          </div>

          <table className="w-full border-collapse text-black font-sans min-w-[800px]">
            <thead>
              <tr>
                <th rowSpan={2} className="border-2 border-black bg-slate-100 px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest">Grade / Stream</th>
                <th colSpan={3} className="border-2 border-black bg-slate-100 px-4 py-1 text-center text-[10px] font-black uppercase tracking-widest">Individual Count</th>
                <th colSpan={3} className="border-2 border-black bg-slate-100 px-4 py-1 text-center text-[10px] font-black uppercase tracking-widest">Grade Aggregate</th>
              </tr>
              <tr className="bg-slate-50">
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Male</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Female</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase bg-slate-100">Total</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Male</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Female</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50">
                <td colSpan={7} className="border-2 border-black px-4 py-2 font-black uppercase text-[12px] tracking-widest text-center">
                  Active Enrollment Summary
                </td>
              </tr>
              {enrollmentData.map((grade) => (
                <React.Fragment key={grade.gradeName}>
                  {grade.sections.map((section, idx) => (
                    <tr key={`${grade.gradeName}-${section.name}`} className="hover:bg-slate-50 transition-colors">
                      <td className="border-2 border-black px-4 py-2.5 font-black uppercase text-[11px] tracking-tighter">
                        {grade.gradeName} {section.name}
                      </td>
                      <td className="border-2 border-black px-4 py-2.5 text-center font-bold text-xs">{section.male}</td>
                      <td className="border-2 border-black px-4 py-2.5 text-center font-bold text-xs">{section.female}</td>
                      <td className="border-2 border-black px-4 py-2.5 text-center font-black text-xs bg-slate-50/50">{section.total}</td>
                      {idx === 0 && (
                        <>
                          <td rowSpan={grade.sections.length} className="border-2 border-black px-4 py-2.5 text-center font-black text-lg bg-white align-middle">
                            {grade.gradeMaleTotal}
                          </td>
                          <td rowSpan={grade.sections.length} className="border-2 border-black px-4 py-2.5 text-center font-black text-lg bg-white align-middle">
                            {grade.gradeFemaleTotal}
                          </td>
                          <td rowSpan={grade.sections.length} className="border-2 border-black px-4 py-2.5 text-center font-black text-5xl bg-slate-50/30 align-middle tracking-tighter">
                            {grade.gradeOverallTotal}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              
              {/* Refined 'Active Total' row for maximum print clarity */}
              <tr className="bg-slate-200 print:bg-slate-200 text-black">
                <td className="border-2 border-black px-4 py-6 text-left text-2xl font-black uppercase tracking-widest">Active Total</td>
                <td className="border-2 border-black px-4 py-6 text-center text-4xl font-black">{grandTotalMale}</td>
                <td className="border-2 border-black px-4 py-6 text-center text-4xl font-black">{grandTotalFemale}</td>
                <td className="border-2 border-black px-4 py-6 text-center text-7xl font-black tracking-tighter bg-slate-300 print:bg-slate-300 shadow-inner">
                  {grandTotalOverall}
                </td>
                <td className="border-2 border-black px-4 py-6 text-center text-2xl font-black">{grandTotalMale}</td>
                <td className="border-2 border-black px-4 py-6 text-center text-2xl font-black">{grandTotalFemale}</td>
                <td className="border-2 border-black px-4 py-6 text-center text-2xl font-black">{grandTotalOverall}</td>
              </tr>
            </tbody>
          </table>

          <div className="hidden print:flex justify-between items-center mt-10 text-[10px] font-black uppercase">
             <div className="space-y-1">
                <p>Generated via MPULUNGU DAY SECONDARY SCHOOL SMS</p>
                <p className="text-slate-500">Official Cloud Record Archive</p>
             </div>
             <div className="text-center w-64 border-t-2 border-black pt-2">
                Registrar's Signature & Seal
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-2xl border border-blue-500/20 shadow-2xl no-print">
        <h3 className="text-xl font-black text-white mb-6 flex items-center uppercase tracking-tight">
          <i className="fas fa-brain text-blue-400 mr-3"></i> AI Administrative Intelligence
        </h3>
        {loading ? (
          <div className="flex items-center gap-4 py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Processing enrollment patterns...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Executive Summary</p>
                <div className="prose prose-invert text-slate-300 text-sm leading-relaxed font-medium">
                  {insights.split('\n').map((line, i) => (
                    <p key={i} className="mb-3">{line}</p>
                  ))}
                </div>
             </div>
             <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-xs font-black text-slate-500 uppercase">System Recommendation</span>
                   <i className="fas fa-lightbulb text-amber-500"></i>
                </div>
                <p className="text-white text-sm font-bold italic leading-relaxed">
                  "Current enrollment is strictly monitored. Total active student count is {grandTotalOverall}."
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
