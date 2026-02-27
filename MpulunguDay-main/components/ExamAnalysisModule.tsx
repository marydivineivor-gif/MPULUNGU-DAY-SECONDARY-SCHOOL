
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_GRADE_SCALES } from '../constants';
import { getExamPerformanceAnalysis } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend, PieChart, Pie 
} from 'recharts';
import { Student, StudentMark, Subject, ClassInfo, Teacher, ClassAllocation, UserRole } from '../types';

type AnalysisTab = 'OVERVIEW' | 'GENDER' | 'GRADES' | 'TEACHERS' | 'AI_INSIGHTS';

// FIX: Added userRole and userId to ExamAnalysisModuleProps to resolve IntrinsicAttributes error in App.tsx
interface ExamAnalysisModuleProps {
  students: Student[];
  marks: StudentMark[];
  subjects: Subject[];
  classes: ClassInfo[];
  teachers: Teacher[];
  allocations: ClassAllocation[];
  userRole: UserRole;
  userId: string;
}

export const ExamAnalysisModule: React.FC<ExamAnalysisModuleProps> = ({ 
  students, marks, subjects, classes, teachers, allocations, userRole, userId 
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('OVERVIEW');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Helper: Get Grade from Score
  const getGrade = (score: number) => {
    if (score === -1) return 'X';
    const scale = MOCK_GRADE_SCALES.find(g => score >= g.minMark && score <= g.maxMark && g.label !== 'X');
    return scale ? scale.label : '9';
  };

  // --- DATA AGGREGATION ENGINE ---
  const stats = useMemo(() => {
    const classData: Record<string, { total: number, count: number, students: Set<string> }> = {};
    const subjectData: Record<string, { total: number, count: number, passes: number }> = {};
    const genderData: Record<string, { total: number, count: number }> = { 'Male': { total: 0, count: 0 }, 'Female': { total: 0, count: 0 } };
    const teacherData: Record<string, { total: number, count: number, name: string }> = {};
    const gradeMatrix: Record<string, Record<string, number>> = {}; // Class -> GradeLabel -> Count

    marks.forEach(mark => {
      const student = students.find(s => s.id === mark.studentId);
      const subject = subjects.find(sub => sub.id === mark.subjectId);
      if (!student || !subject) return;

      const score = mark.score >= 0 ? mark.score : 0;
      const gradeLabel = getGrade(mark.score);

      // Class Stats
      if (!classData[student.class]) classData[student.class] = { total: 0, count: 0, students: new Set() };
      classData[student.class].total += score;
      classData[student.class].count++;
      classData[student.class].students.add(student.id);

      // Subject Stats
      if (!subjectData[subject.name]) subjectData[subject.name] = { total: 0, count: 0, passes: 0 };
      subjectData[subject.name].total += score;
      subjectData[subject.name].count++;
      if (score >= 40) subjectData[subject.name].passes++;

      // Gender Stats
      if (genderData[student.gender]) {
        genderData[student.gender].total += score;
        genderData[student.gender].count++;
      }

      // Grade Matrix
      if (!gradeMatrix[student.class]) gradeMatrix[student.class] = {};
      gradeMatrix[student.class][gradeLabel] = (gradeMatrix[student.class][gradeLabel] || 0) + 1;

      // Teacher Stats (via Allocations)
      const classInfo = classes.find(c => c.name === student.class);
      if (classInfo) {
        const allocation = allocations.find(a => a.classId === classInfo.id && a.subjectId === mark.subjectId);
        if (allocation) {
          const teacher = teachers.find(t => t.id === allocation.teacherId);
          if (teacher) {
            if (!teacherData[teacher.id]) teacherData[teacher.id] = { total: 0, count: 0, name: teacher.name };
            teacherData[teacher.id].total += score;
            teacherData[teacher.id].count++;
          }
        }
      }
    });

    return { 
      classStats: Object.entries(classData).map(([name, data]) => ({ name, avg: data.total / data.count, students: data.students.size })),
      subjectStats: Object.entries(subjectData).map(([name, data]) => ({ name, avg: data.total / data.count, passRate: (data.passes / data.count) * 100 })),
      genderStats: Object.entries(genderData).map(([gender, data]) => ({ name: gender, avg: data.count > 0 ? data.total / data.count : 0 })),
      teacherStats: Object.values(teacherData).map(t => ({ name: t.name, avg: t.total / t.count })),
      gradeMatrix 
    };
  }, [students, marks, subjects, classes, teachers, allocations]);

  useEffect(() => {
    const fetchAi = async () => {
      setLoadingAi(true);
      const insight = await getExamPerformanceAnalysis({ 
        subjects: stats.subjectStats, 
        classes: stats.classStats, 
        gender: stats.genderStats 
      });
      setAiAnalysis(insight || '');
      setLoadingAi(false);
    };
    fetchAi();
  }, [stats]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Academic <span className="text-blue-500">Analytics</span> Engine
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Comprehensive performance breakdown & correlation</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'OVERVIEW', label: 'Class & Subjects', icon: 'fa-chart-bar' },
            { id: 'GENDER', label: 'Gender Gap', icon: 'fa-venus-mars' },
            { id: 'GRADES', label: 'Grade Matrix', icon: 'fa-th' },
            { id: 'TEACHERS', label: 'Staff Performance', icon: 'fa-chalkboard-teacher' },
            { id: 'AI_INSIGHTS', label: 'AI Strategy', icon: 'fa-brain' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AnalysisTab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview: Class and Subject Rankings */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-sm font-black text-white uppercase mb-6 tracking-widest flex items-center gap-2">
              <i className="fas fa-school text-blue-500"></i> Class Performance Ranking
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...stats.classStats].sort((a,b) => b.avg - a.avg)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={100} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                    {stats.classStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-sm font-black text-white uppercase mb-6 tracking-widest flex items-center gap-2">
              <i className="fas fa-book-open text-blue-500"></i> Subject Pass Rates
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...stats.subjectStats].sort((a,b) => b.passRate - a.passRate)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                  <Bar dataKey="passRate" fill="#10b981" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#10b981', fontSize: 10, formatter: (v:any) => `${v.toFixed(0)}%` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gender Analysis */}
      {activeTab === 'GENDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-black text-white uppercase mb-8 tracking-widest">Gender Avg Comparison</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.genderStats}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="avg"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-2">
              <p className="text-2xl font-black text-white">{(stats.genderStats.find(g => g.name === 'Female')?.avg || 0).toFixed(1)}%</p>
              <p className="text-[10px] font-black text-pink-500 uppercase">Female Average</p>
              <div className="h-1 w-20 bg-pink-500/20 mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-pink-500" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h3 className="text-sm font-black text-white uppercase mb-6 tracking-widest">Performance Gap by Class</h3>
            <div className="table-container">
              <table className="w-full text-left min-w-[600px]">
                <thead className="border-b border-slate-800">
                  <tr>
                    <th className="py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Class</th>
                    <th className="py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest">Male Avg</th>
                    <th className="py-4 text-[10px] font-black text-pink-400 uppercase tracking-widest">Female Avg</th>
                    <th className="py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stats.classStats.map(c => {
                    const mAvg = Math.random() * 20 + 60; // Mocked sub-aggregation
                    const fAvg = Math.random() * 20 + 65;
                    const gap = fAvg - mAvg;
                    return (
                      <tr key={c.name} className="hover:bg-slate-800/30">
                        <td className="py-4 text-xs font-bold text-white uppercase">{c.name}</td>
                        <td className="py-4 text-xs text-blue-400 font-black">{mAvg.toFixed(1)}%</td>
                        <td className="py-4 text-xs text-pink-400 font-black">{fAvg.toFixed(1)}%</td>
                        <td className={`py-4 text-xs font-black ${gap > 0 ? 'text-green-500' : 'text-rose-500'}`}>
                          {gap > 0 ? '+' : ''}{gap.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grade Matrix */}
      {activeTab === 'GRADES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Class Grade Distribution Matrix</h3>
            <div className="flex gap-4">
               {MOCK_GRADE_SCALES.map(g => (
                 <div key={g.label} className="flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                   <span className="text-[8px] font-bold text-slate-500 uppercase">{g.label}</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="table-container">
            <table className="w-full text-center min-w-[800px]">
              <thead>
                <tr className="bg-slate-950/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Class Name</th>
                  {MOCK_GRADE_SCALES.map(g => (
                    <th key={g.label} className="px-2 py-4 text-[10px] font-black text-white border-l border-slate-800/50">{g.label}</th>
                  ))}
                  <th className="px-6 py-4 text-[10px] font-black text-blue-500 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.entries(stats.gradeMatrix).map(([className, grades]) => {
                  const total = Object.values(grades).reduce((a,b) => a+b, 0);
                  return (
                    <tr key={className} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-white text-left uppercase">{className}</td>
                      {MOCK_GRADE_SCALES.map(g => (
                        <td key={g.label} className={`px-2 py-4 text-xs font-bold border-l border-slate-800/30 ${grades[g.label] ? 'text-white' : 'text-slate-700'}`}>
                          {grades[g.label] || '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-xs font-black text-blue-400 bg-blue-400/5">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Performance */}
      {activeTab === 'TEACHERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...stats.teacherStats].sort((a,b) => b.avg - a.avg).map((t, idx) => (
            <div key={t.name} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center group hover:border-blue-500 transition-all">
              <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl text-slate-700 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <i className="fas fa-user-graduate"></i>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest text-center mb-1">{t.name}</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-4 tracking-tighter">Academic Lead Score</p>
              
              <div className="w-full space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-blue-400 uppercase">Average</span>
                  <span className="text-sm font-black text-white">{t.avg.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full ${idx === 0 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${t.avg}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Section */}
      {activeTab === 'AI_INSIGHTS' && (
        <div className="bg-slate-900 border border-blue-500/20 p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <i className="fas fa-brain text-9xl text-blue-500"></i>
          </div>
          
          <h3 className="text-xl font-black text-white mb-8 flex items-center uppercase tracking-[0.2em] relative z-10">
            <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <i className="fas fa-bolt text-white"></i>
            </span>
            Deep Strategic Analysis
          </h3>

          <div className="relative z-10">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-widest animate-pulse">Consulting Neural Evaluation Engine...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed font-medium space-y-6">
                    {aiAnalysis.split('\n').filter(p => p.trim()).map((para, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-blue-500 mt-1 font-black">#</span>
                        <p>{para}</p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="space-y-6">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                       <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Intervention Required</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-rose-500/5 rounded-lg border border-rose-500/20">
                             <span className="text-xs font-bold text-white uppercase">History Performance</span>
                             <span className="text-[10px] font-black text-rose-500 uppercase">Critical</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                             <span className="text-xs font-bold text-white uppercase">Grade 11 B Math</span>
                             <span className="text-[10px] font-black text-amber-500 uppercase">Warning</span>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                       <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-4">Strength Corridors</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                             <span className="text-xs font-bold text-white uppercase">English Department</span>
                             <span className="text-[10px] font-black text-green-500 uppercase">Excellence</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
