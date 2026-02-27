import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_GRADE_SCALES } from '../constants';
import { getExamPerformanceAnalysis } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend, PieChart, Pie 
} from 'recharts';
import { Student, StudentMark, Subject, ClassInfo, Teacher, ClassAllocation, UserRole } from '../types';

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

type AnalysisTab = 'OVERVIEW' | 'GENDER' | 'GRADES' | 'TEACHERS' | 'AI_INSIGHTS';

export const ExamAnalysisModule: React.FC<ExamAnalysisModuleProps> = ({ 
  students, marks, subjects, classes, teachers, allocations, userRole, userId 
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('OVERVIEW');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const getGrade = (score: number) => {
    if (score === -1) return 'X';
    const scale = MOCK_GRADE_SCALES.find(g => score >= g.minMark && score <= g.maxMark && g.label !== 'X');
    return scale ? scale.label : '9';
  };

  const stats = useMemo(() => {
    const classData: Record<string, { total: number, count: number, students: Set<string> }> = {};
    const subjectData: Record<string, { total: number, count: number, passes: number }> = {};
    const genderData: Record<string, { total: number, count: number }> = { 'Male': { total: 0, count: 0 }, 'Female': { total: 0, count: 0 } };
    const teacherData: Record<string, { total: number, count: number, name: string }> = {};
    const gradeMatrix: Record<string, Record<string, number>> = {};

    marks.forEach(mark => {
      const student = students.find(s => s.id === mark.studentId);
      const subject = subjects.find(sub => sub.id === mark.subjectId);
      if (!student || !subject) return;

      const score = mark.score >= 0 ? mark.score : 0;
      const gradeLabel = getGrade(mark.score);

      if (!classData[student.class]) classData[student.class] = { total: 0, count: 0, students: new Set() };
      classData[student.class].total += score;
      classData[student.class].count++;
      classData[student.class].students.add(student.id);

      if (!subjectData[subject.name]) subjectData[subject.name] = { total: 0, count: 0, passes: 0 };
      subjectData[subject.name].total += score;
      subjectData[subject.name].count++;
      if (score >= 40) subjectData[subject.name].passes++;

      if (genderData[student.gender]) {
        genderData[student.gender].total += score;
        genderData[student.gender].count++;
      }

      if (!gradeMatrix[student.class]) gradeMatrix[student.class] = {};
      gradeMatrix[student.class][gradeLabel] = (gradeMatrix[student.class][gradeLabel] || 0) + 1;

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
        </div>
        <div className="flex flex-wrap gap-2">
          {['OVERVIEW', 'GENDER', 'GRADES', 'TEACHERS', 'AI_INSIGHTS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as AnalysisTab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
        {activeTab === 'OVERVIEW' && (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.classStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === 'AI_INSIGHTS' && (
          <div className="prose prose-invert max-w-none">
            {loadingAi ? <p>Consulting AI analyst...</p> : <p className="whitespace-pre-wrap">{aiAnalysis}</p>}
          </div>
        )}
      </div>
    </div>
  );
};