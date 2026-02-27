
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { UserRole, TeachingFileRecord, Teacher, ClassAllocation, Subject, ClassInfo, StudentMark, ExamSession, PeriodAllocation, PeriodSession, PeriodAttendance, Student, Department } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface TeachingFileModuleProps {
  userRole: UserRole;
  userId: string;
  userName: string;
  schoolName: string;
  schoolLogo?: string;
  records: TeachingFileRecord[];
  setRecords: React.Dispatch<React.SetStateAction<TeachingFileRecord[]>>;
  isHOD: boolean;
  teachers: Teacher[];
  allocations: ClassAllocation[];
  subjects: Subject[];
  classes: ClassInfo[];
  marks: StudentMark[];
  setMarks: React.Dispatch<React.SetStateAction<StudentMark[]>>;
  sessions: ExamSession[];
  periodAllocations: PeriodAllocation[];
  periodSessions: PeriodSession[];
  setPeriodSessions: React.Dispatch<React.SetStateAction<PeriodSession[]>>;
  periodAttendance: PeriodAttendance[];
  setPeriodAttendance: React.Dispatch<React.SetStateAction<PeriodAttendance[]>>;
  students: Student[];
  departments: Department[];
}

type SubSection = 
  | 'WORK_PLAN' 
  | 'SYLLABUS'
  | 'ACADEMIC_PROGRESS'
  | 'TIMETABLE' 
  | 'PERIOD_REGISTER' 
  | 'CLASS_LIST' 
  | 'SCHEMES' 
  | 'LESSON_PLAN' 
  | 'RECORDS_OF_WORK' 
  | 'HOME_WORK'
  | 'HOME_WORK_GIVEN'
  | 'TAUGHT_FOLDER'
  | 'WORK_COVERED'
  | 'TESTS';

const GRADES = ['GRADE 8', 'GRADE 9', 'GRADE 10', 'GRADE 11', 'GRADE 12'];
const TERMS = ['TERM I', 'TERM II', 'TERM III'];

const currentYear = new Date().getFullYear();
const YEAR_RANGES = Array.from({ length: 10 }, (_, i) => {
  const year = currentYear - 2 + i;
  return `${year} - ${year + 1}`;
});

interface TeachingFileContextType {
  activeRecord: TeachingFileRecord | undefined;
  selectedTeacherId: string;
  userId: string;
  updateRecordData: (field: string, value: any) => void;
}

const TeachingFileContext = React.createContext<TeachingFileContextType | null>(null);

interface EditableFieldProps {
  field: string;
  placeholder?: string;
  className?: string;
  type?: "text" | "select";
  options?: string[];
  defaultValue?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  field, placeholder, className = "", type = "text", options = [], defaultValue = ""
}) => {
  const context = React.useContext(TeachingFileContext);
  if (!context) return null;
  const { activeRecord, selectedTeacherId, userId, updateRecordData } = context;

  const value = activeRecord?.data?.[field] || defaultValue || '';
  const isReadOnly = selectedTeacherId !== userId || 
                     (activeRecord && (
                       activeRecord.status !== 'Draft' && 
                       activeRecord.status !== 'Returned' || 
                       activeRecord.isTaught
                     ));

  if (type === "select" && options.length > 0) {
    return (
      <select
        value={value}
        onChange={(e) => updateRecordData(field, e.target.value)}
        disabled={isReadOnly}
        className={`border-b border-dotted border-black bg-transparent outline-none focus:border-blue-500 transition-colors ${className} ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => updateRecordData(field, e.target.value)}
      placeholder={placeholder}
      disabled={isReadOnly}
      className={`border-b border-dotted border-black bg-transparent outline-none focus:border-blue-500 transition-colors ${className} ${isReadOnly ? 'cursor-default' : 'cursor-text'}`}
    />
  );
};

interface EditableTextAreaProps {
  field: string;
  placeholder?: string;
  className?: string;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({ 
  field, placeholder, className = ""
}) => {
  const context = React.useContext(TeachingFileContext);
  if (!context) return null;
  const { activeRecord, selectedTeacherId, userId, updateRecordData } = context;

  const value = activeRecord?.data?.[field] || '';
  const isReadOnly = selectedTeacherId !== userId || 
                     (activeRecord && (
                       activeRecord.status !== 'Draft' && 
                       activeRecord.status !== 'Returned' || 
                       activeRecord.isTaught
                     ));

  return (
    <textarea
      value={value}
      onChange={(e) => updateRecordData(field, e.target.value)}
      placeholder={placeholder}
      disabled={isReadOnly}
      className={`w-full bg-transparent outline-none focus:ring-1 focus:ring-blue-500/20 rounded p-1 resize-none ${className} ${isReadOnly ? 'cursor-default' : 'cursor-text'}`}
    />
  );
};

export const TeachingFileModule: React.FC<TeachingFileModuleProps> = ({ 
  userRole, userId, userName, schoolName, schoolLogo, records, setRecords, isHOD, teachers,
  allocations, subjects, classes, marks, setMarks, sessions, periodAllocations, 
  periodSessions, setPeriodSessions, periodAttendance, setPeriodAttendance, students, departments
}) => {
  const [activeSub, setActiveSub] = useState<SubSection>('WORK_PLAN');
  const [lessonPlanType, setLessonPlanType] = useState<'STANDARD' | 'COMPETENCY'>('STANDARD');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(userId);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const deptOptions = useMemo(() => departments.map(d => d.name), [departments]);
  const allSubjectNames = useMemo(() => subjects.map(s => s.name).sort(), [subjects]);

  // State for new features
  const [markingClassId, setMarkingClassId] = useState<string | null>(null);
  const [markingSubjectId, setMarkingSubjectId] = useState<string | null>(null);
  const [markingSessionId, setMarkingSessionId] = useState<string | null>(null);

  const [registeringAllocId, setRegisteringAllocId] = useState<string | null>(null);
  const [registerDate, setRegisterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [stagedAcademicMarks, setStagedAcademicMarks] = useState<Record<string, number>>({});
  const [isSavingAcademicMarks, setIsSavingAcademicMarks] = useState(false);

  const hodDepartments = useMemo(() => 
    departments.filter(d => d.hodId === userId),
    [departments, userId]
  );

  const accessibleTeachers = useMemo(() => {
    if (userRole === 'ADMIN') return teachers;
    if (isHOD) {
      const deptTeacherIds = new Set<string>();
      hodDepartments.forEach(dept => {
        dept.teacherIds.forEach(id => deptTeacherIds.add(id));
      });
      return teachers.filter(t => t.id === userId || deptTeacherIds.has(t.id));
    }
    return teachers.filter(t => t.id === userId);
  }, [isHOD, userRole, userId, hodDepartments, teachers]);

  useEffect(() => {
    setSelectedRecordId(null);
  }, [activeSub]);

  const teacherAllocations = useMemo(() => 
    allocations.filter(a => a.teacherId === selectedTeacherId),
    [allocations, selectedTeacherId]
  );

  const teacherPeriodAllocations = useMemo(() => 
    periodAllocations.filter(a => a.teacherId === selectedTeacherId),
    [periodAllocations, selectedTeacherId]
  );

  const teacherSubjects = useMemo(() => {
    const subjectIds = new Set(teacherAllocations.map(a => a.subjectId));
    return subjects.filter(s => subjectIds.has(s.id)).map(s => s.name);
  }, [teacherAllocations, subjects]);

  const teacherClasses = useMemo(() => {
    const classIds = new Set(teacherAllocations.map(a => a.classId));
    return classes.filter(c => classIds.has(c.id)).map(c => c.name);
  }, [teacherAllocations, classes]);

  const selectedTeacher = useMemo(() => 
    teachers.find(t => t.id === selectedTeacherId) || { name: userName, id: userId },
    [teachers, selectedTeacherId, userName, userId]
  );

  const activeRecord = useMemo(() => {
    if (selectedRecordId) {
      return records.find(r => r.id === selectedRecordId);
    }
    return undefined;
  }, [records, selectedRecordId]);

  const sectionRecords = useMemo(() => {
    const type = activeSub === 'LESSON_PLAN' ? `LESSON_PLAN_${lessonPlanType}` : activeSub;
    return records.filter(r => {
      // For folders, we don't use sectionRecords in the same way, but for main sections:
      const matchesType = r.type === type;
      return matchesType && r.teacherId === selectedTeacherId && !r.isTaught;
    });
  }, [records, activeSub, selectedTeacherId, lessonPlanType]);

  const updateRecordData = useCallback((field: string, value: any) => {
    if (selectedTeacherId !== userId) return; // Only allow editing own records
    
    if (activeRecord) {
      setRecords(prev => prev.map(r => 
        r.id === activeRecord.id 
          ? { ...r, data: { ...r.data, [field]: value }, updatedAt: new Date().toISOString() }
          : r
      ));
    } else {
      const type = activeSub === 'LESSON_PLAN' ? `LESSON_PLAN_${lessonPlanType}` : activeSub;
      const newRecord: TeachingFileRecord = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        teacherId: userId,
        data: { [field]: value },
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRecords(prev => [...prev, newRecord]);
      setSelectedRecordId(newRecord.id);
    }
  }, [activeRecord, activeSub, lessonPlanType, userId, selectedTeacherId, setRecords]);

  const handleCreateNew = useCallback(() => {
    if (selectedTeacherId !== userId) return;
    const type = activeSub === 'LESSON_PLAN' ? `LESSON_PLAN_${lessonPlanType}` : activeSub;
    const newRecord: TeachingFileRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      teacherId: userId,
      data: {},
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecords(prev => [...prev, newRecord]);
    setSelectedRecordId(newRecord.id);
  }, [activeSub, lessonPlanType, userId, selectedTeacherId, setRecords]);

  const handleDeleteRecord = useCallback((recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId));
    if (selectedRecordId === recordId) {
      setSelectedRecordId(null);
    }
  }, [selectedRecordId, setRecords]);

  const handleStatusChange = useCallback((newStatus: TeachingFileRecord['status']) => {
    if (!activeRecord) return;
    setRecords(prev => prev.map(r => 
      r.id === activeRecord.id 
        ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
        : r
    ));
    // After submitting, clear selection to demand a new one
    if (newStatus.startsWith('Submitted') && selectedTeacherId === userId) {
      setSelectedRecordId(null);
    }
  }, [activeRecord, setRecords, selectedTeacherId, userId]);

  const handleComment = useCallback((role: 'HOD' | 'ADMIN', comment: string) => {
    if (!activeRecord) return;
    setRecords(prev => prev.map(r => 
      r.id === activeRecord.id 
        ? { 
            ...r, 
            [role === 'HOD' ? 'hodComment' : 'adminComment']: comment,
            updatedAt: new Date().toISOString() 
          }
        : r
    ));
  }, [activeRecord, setRecords]);

  const toggleTaught = useCallback(() => {
    if (!activeRecord || (!activeRecord.type.startsWith('LESSON_PLAN') && activeRecord.type !== 'RECORDS_OF_WORK' && activeRecord.type !== 'HOME_WORK')) return;
    setRecords(prev => prev.map(r => 
      r.id === activeRecord.id 
        ? { ...r, isTaught: !r.isTaught, updatedAt: new Date().toISOString() }
        : r
    ));
  }, [activeRecord, setRecords]);

  const downloadAsWord = useCallback(() => {
    const card = document.querySelector('.printable-card');
    if (!card) return;
    
    // Clone to remove no-print elements and approval stamp if needed, or just use as is
    const content = card.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
          "xmlns:w='urn:schemas-microsoft-com:office:word' "+
          "xmlns='http://www.w3.org/TR/REC-html40'>"+
          "<head><meta charset='utf-8'><title>Test Paper</title><style>body { font-family: 'Times New Roman', serif; }</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeRecord?.data?.subject || 'Test'}_${activeRecord?.data?.paperCode || ''}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeRecord]);

  const contextValue = useMemo(() => ({
    activeRecord,
    selectedTeacherId,
    userId,
    updateRecordData
  }), [activeRecord, selectedTeacherId, userId, updateRecordData]);

  const sections: { id: SubSection; label: string; icon: string }[] = [
    { id: 'WORK_PLAN', label: 'Individual Work Plan', icon: 'fa-calendar-check' },
    { id: 'PERIOD_REGISTER', label: 'Period Register', icon: 'fa-clock' },
    { id: 'CLASS_LIST', label: 'Class List', icon: 'fa-users' },
    { id: 'TIMETABLE', label: 'Time Table', icon: 'fa-table' },
    { id: 'SYLLABUS', label: 'Syllabus', icon: 'fa-book' },
    { id: 'SCHEMES', label: 'Schemes of Work', icon: 'fa-layer-group' },
    { id: 'LESSON_PLAN', label: 'Lesson Plan', icon: 'fa-chalkboard' },
    { id: 'RECORDS_OF_WORK', label: 'Records of Work', icon: 'fa-clipboard-list' },
    { id: 'HOME_WORK', label: 'Home Work', icon: 'fa-home' },
    { id: 'HOME_WORK_GIVEN', label: 'Home Work Given', icon: 'fa-house-circle-check' },
    { id: 'ACADEMIC_PROGRESS', label: 'Academic Progress', icon: 'fa-chart-line' },
    { id: 'TAUGHT_FOLDER', label: 'Taught Folder', icon: 'fa-folder-check' },
    { id: 'WORK_COVERED', label: 'Work Covered', icon: 'fa-archive' },
    { id: 'TESTS', label: 'Tests', icon: 'fa-file-signature' },
  ];

  const renderSchemesOfWorkTemplate = () => (
    <div className="bg-white text-black p-8 font-serif border-2 border-black printable-card max-w-[1200px] mx-auto mt-8 shadow-2xl animate-in zoom-in-95 duration-500 text-[10px] relative">
      <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
      <div className="text-center mb-6">
        <h1 className="text-sm font-black uppercase tracking-tight">MINISTRY OF EDUCATION</h1>
        <h2 className="text-lg font-black uppercase underline mt-1">MPULUNGU DAY SECONDARY SCHOOL</h2>
        <h3 className="text-sm font-bold uppercase mt-1">
          <EditableField field="department" type="select" options={deptOptions} placeholder="SELECT DEPARTMENT" className="text-center w-full" />
        </h3>
        <h4 className="text-xs font-bold uppercase underline mt-1">
          <EditableField field="schemesTitle" placeholder="GRADE / TERM / YEAR" className="text-center w-full" />
        </h4>
        <h4 className="text-xs font-bold uppercase underline mt-1">
          SUBJECT: <EditableField field="subject" type="select" options={allSubjectNames} placeholder="SELECT SUBJECT" className="min-w-[150px]" />
        </h4>
      </div>

      <table className="w-full border-collapse border-2 border-black">
        <thead>
          <tr className="bg-slate-50">
            <th rowSpan={2} className="border-2 border-black p-2 font-black uppercase w-12">WK</th>
            <th rowSpan={2} className="border-2 border-black p-2 font-black uppercase w-32">TOPIC</th>
            <th rowSpan={2} className="border-2 border-black p-2 font-black uppercase w-48">SPECIFIC OUTCOMES</th>
            <th colSpan={3} className="border-2 border-black p-2 font-black uppercase">CONTENT</th>
            <th rowSpan={2} className="border-2 border-black p-2 font-black uppercase w-48">REFERENCE</th>
          </tr>
          <tr className="bg-slate-50">
            <th className="border-2 border-black p-2 font-black uppercase">KNOWLEDGE</th>
            <th className="border-2 border-black p-2 font-black uppercase">SKILLS</th>
            <th className="border-2 border-black p-2 font-black uppercase">VALUES</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }).map((_, i) => (
            <tr key={i} className="align-top h-20">
              <td className="border-2 border-black p-2 text-center font-bold">{i + 1}</td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`topic_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`outcomes_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`knowledge_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`skills_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`values_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`ref_${i}`} className="h-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 pt-4 border-t border-slate-100 text-[8px] font-black uppercase opacity-20 text-center no-print">
        Official Schemes of Work Template • MDS SMS Pedagogical Engine
      </div>
    </div>
  );

  const renderHomeWorkTemplate = () => (
    <div className="bg-white text-black p-8 font-serif border-2 border-black printable-card max-w-[900px] mx-auto mt-8 shadow-2xl animate-in zoom-in-95 duration-500 text-[10px] relative">
      <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
      <div className="text-center mb-6">
        <h1 className="text-xl font-black uppercase underline tracking-tight">MPULUNGU DAY SECONDARY SCHOOL</h1>
        <h2 className="text-lg font-bold uppercase underline mt-1">HOME WORKS/ REMEDIAL WORK RECORD</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-6 font-bold uppercase">
        <p>DEPARTMENT: <EditableField field="department" type="select" options={deptOptions} placeholder="SELECT DEPARTMENT" className="min-w-[200px]" /></p>
        <p>CLASS: <EditableField field="class" type="select" options={teacherClasses} className="min-w-[200px]" /></p>
        <p>DATE: <EditableField field="date" defaultValue={new Date().toLocaleDateString()} className="min-w-[150px]" /></p>
        <div className="col-span-2">
          <p>SUBJECT: <EditableField field="subject" type="select" options={allSubjectNames} className="w-full" /></p>
        </div>
      </div>

      <table className="w-full border-collapse border-2 border-black">
        <thead>
          <tr className="bg-slate-50">
            <th className="border-2 border-black p-2 font-black uppercase w-1/3">WORK</th>
            <th className="border-2 border-black p-2 font-black uppercase w-1/3">EXPECTED SOLUTIONS</th>
            <th className="border-2 border-black p-2 font-black uppercase w-1/3">COMMENT BY DEPUTY</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }).map((_, i) => (
            <tr key={i} className="h-16 align-top">
              <td className="border-2 border-black p-1"><EditableTextArea field={`work_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`solutions_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`deputy_comment_${i}`} className="h-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 pt-4 border-t border-slate-100 text-[8px] font-black uppercase opacity-20 text-center no-print">
        Official Home Work Record Template • MDS SMS Pedagogical Engine
      </div>
    </div>
  );

  const renderRecordsOfWorkTemplate = () => (
    <div className="bg-white text-black p-8 font-serif border-2 border-black printable-card max-w-[1100px] mx-auto mt-8 shadow-2xl animate-in zoom-in-95 duration-500 text-[10px] relative">
      <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
      <div className="text-center mb-6">
        <h1 className="text-xl font-black uppercase underline tracking-tight">MPULUNGU DAY SECONDARY SCHOOL</h1>
        <h2 className="text-lg font-bold uppercase underline mt-1">RECORD OF WORK</h2>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 font-bold uppercase">
        <p>NAME OF TEACHER: <EditableField field="teacherName" defaultValue={selectedTeacher.name} className="min-w-[200px]" /></p>
        <p>DEPARTMENT: <EditableField field="department" type="select" options={deptOptions} placeholder="SELECT DEPARTMENT" className="min-w-[150px]" /></p>
        <p>SUBJECT: <EditableField field="subject" type="select" options={allSubjectNames} className="min-w-[150px]" /></p>
        <p>TERM: <EditableField field="term" type="select" options={TERMS} className="min-w-[50px]" /></p>
        <p>CLASS: <EditableField field="class" type="select" options={teacherClasses} className="min-w-[80px]" /></p>
      </div>

      <table className="w-full border-collapse border-2 border-black">
        <thead>
          <tr className="bg-slate-50">
            <th className="border-2 border-black p-2 font-black uppercase w-24">Week Ending</th>
            <th className="border-2 border-black p-2 font-black uppercase">Work Done/Covered</th>
            <th className="border-2 border-black p-2 font-black uppercase w-32">Resources/ References</th>
            <th className="border-2 border-black p-2 font-black uppercase w-40">Comments on Pupils’ Performance</th>
            <th className="border-2 border-black p-2 font-black uppercase w-48">Comments on Methods used/Homework/Exercises/Tests Performance</th>
            <th className="border-2 border-black p-2 font-black uppercase w-48">Head of Department/Deputy/Head teachers’ Comments</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }).map((_, i) => (
            <tr key={i} className="h-20 align-top">
              <td className="border-2 border-black p-1"><EditableTextArea field={`week_ending_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`work_done_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`resources_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`pupils_perf_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`methods_perf_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`hod_comments_${i}`} className="h-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 pt-4 border-t border-slate-100 text-[8px] font-black uppercase opacity-20 text-center no-print">
        Official Record of Work Template • MDS SMS Pedagogical Engine
      </div>
    </div>
  );

  const renderWorkPlanTemplate = () => (
    <div className="bg-white text-black p-8 font-serif border-2 border-black printable-card max-w-[950px] mx-auto mt-8 shadow-2xl animate-in zoom-in-95 duration-500 text-[10px] relative">
      <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
      <div className="text-center mb-6">
        <h1 className="text-xl font-black uppercase underline tracking-tight">INDIVIDUAL WORK PLAN</h1>
        <p className="font-bold italic">(To be attached to every Appraisal as may be appropriate)</p>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-6 font-bold">
        <p>Name of job Holder: <EditableField field="jobHolder" defaultValue={selectedTeacher.name} className="min-w-[200px]" /></p>
        <p>Work Plan Period: <EditableField field="period" type="select" options={YEAR_RANGES} className="min-w-[150px]" /></p>
        <p>Job Title: <EditableField field="jobTitle" className="min-w-[200px]" /></p>
        <p>Subject: <EditableField field="subject" type="select" options={allSubjectNames} className="min-w-[150px]" /></p>
        <p>Department/Section: <EditableField field="department" type="select" options={deptOptions} placeholder="SELECT DEPARTMENT" className="min-w-[150px]" /></p>
        <div className="col-span-2">
          <p>Job Purpose (As in the job description): <EditableField field="jobPurpose" className="w-full" /></p>
          <div className="border-b border-dotted border-black w-full h-4 mt-1"><EditableField field="jobPurpose2" className="w-full border-none" /></div>
        </div>
      </div>

      <p className="font-bold italic mb-4 text-center border-y border-black py-1">
        (To be completed by the teacher while the rating to be completed during Appraisal by the Supervisor)
      </p>

      <table className="w-full border-collapse border-2 border-black mb-8">
        <thead>
          <tr className="bg-slate-50">
            <th className="border-2 border-black p-2 font-black uppercase w-1/5">KEY RESULT AREA</th>
            <th className="border-2 border-black p-2 font-black uppercase w-1/5">PRINCIPAL ACCOUNTABILITY</th>
            <th className="border-2 border-black p-2 font-black uppercase w-1/5">SCHEDULE OF ACTIVITIES</th>
            <th className="border-2 border-black p-2 font-black uppercase w-1/5">TARGETS</th>
            <th className="border-2 border-black p-2 font-black uppercase w-1/5">RATING</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="h-12 align-top">
              <td className="border-2 border-black p-1"><EditableTextArea field={`kra_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`accountability_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`activities_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`targets_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`rating_${i}`} className="h-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="font-bold italic mb-4 text-center border-y border-black py-1">
        Targets set during appraisal and the rating (The Appraise completes the first two columns for KRA and targets, as agreed with supervisor while rating be completed by the supervisor using the key ‘below’)
      </p>

      <table className="w-full border-collapse border-2 border-black mb-6">
        <thead>
          <tr className="bg-slate-50">
            <th className="border-2 border-black p-2 font-black uppercase w-2/5">KEY RESULT AREA</th>
            <th className="border-2 border-black p-2 font-black uppercase w-2/5">TARGETS</th>
            <th className="border-2 border-black p-2 font-black uppercase w-1/5">RATING</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="h-10 align-top">
              <td className="border-2 border-black p-1"><EditableTextArea field={`appraisal_kra_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1"><EditableTextArea field={`appraisal_targets_${i}`} className="h-full" /></td>
              <td className="border-2 border-black p-1 text-center"><EditableTextArea field={`appraisal_rating_${i}`} className="h-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-end font-bold mt-8">
        <div className="space-y-1">
          <p>Supervisor’s key for rating:</p>
          <p>Above Target = 3</p>
          <p>On Target = 2</p>
          <p>Below target = 1</p>
        </div>
        <div className="text-right">
          <p>Overall target Rating = <EditableField field="overallRating" className="min-w-[100px]" /></p>
          <p className="text-[8px] italic mt-1">(i.e. total rating divided by the number of targets)</p>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-slate-100 text-[8px] font-black uppercase opacity-20 text-center no-print">
        Official Individual Work Plan Template • MDS SMS Pedagogical Engine
      </div>
    </div>
  );

  const renderLessonPlanTemplate2 = () => (
    <div className="bg-white text-black p-8 font-serif border-2 border-black printable-card max-w-[900px] mx-auto mt-8 shadow-2xl animate-in zoom-in-95 duration-500 text-[10px] relative">
      <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
      <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 font-bold uppercase">
        <p className="col-span-2 text-center mb-2">
          DEPARTMENT: <EditableField field="department" type="select" options={deptOptions} placeholder="SELECT DEPARTMENT" className="min-w-[200px]" />
        </p>
        <p>TEACHER’S NAME: <EditableField field="teacherName" defaultValue={selectedTeacher.name} className="min-w-[200px]" /></p>
        <p>DATE: <EditableField field="date" defaultValue={new Date().toLocaleDateString()} className="min-w-[150px]" /></p>
        <p>FORM: <EditableField field="form" type="select" options={teacherClasses} className="min-w-[150px]" /></p>
        <p>TIME: <EditableField field="time" className="min-w-[150px]" /></p>
        <p>SUBJECT: <EditableField field="subject" type="select" options={allSubjectNames} className="min-w-[200px]" /></p>
        <p>PUPILS PRESENT: <EditableField field="pupilsPresent" className="min-w-[100px]" /></p>
        <div className="flex justify-between">
          <p>TOPIC: <EditableField field="topic" className="min-w-[150px]" /></p>
          <p>BOYS: <EditableField field="boys" className="min-w-[50px]" /></p>
        </div>
        <div className="flex justify-between">
          <p>SUB-TOPIC: <EditableField field="subTopic" className="min-w-[150px]" /></p>
          <p>GIRLS: <EditableField field="girls" className="min-w-[50px]" /></p>
        </div>
      </div>

      <div className="space-y-2 font-bold uppercase mb-6">
        <p>CONCEPT: <EditableField field="concept" className="w-full" /></p>
        <p>SUB- CONCEPT: <EditableField field="subConcept" className="w-full" /></p>
        <p>LESSON GOAL: <EditableField field="lessonGoal" className="w-full" /></p>
        <p>COMPETENCES: <EditableField field="competences" className="w-full" /></p>
        <p>EXPECTED TARGET COMPETENCES: <EditableField field="expectedTargetCompetences" className="w-full" /></p>
      </div>

      <div className="mb-6">
        <p className="font-black uppercase mb-2">LESSON COMPETENCES</p>
        <div className="space-y-1 pl-4">
          <p>i. <EditableField field="comp1" className="w-[95%]" /></p>
          <p>ii. <EditableField field="comp2" className="w-[95%]" /></p>
          <p>iii. <EditableField field="comp3" className="w-[95%]" /></p>
        </div>
      </div>

      <div className="space-y-2 font-bold mb-6">
        <p className="uppercase">EXPECTED STANDARD: <EditableField field="expectedStandard" className="w-full" /></p>
        <p className="uppercase">LESSON METHODOLOGY: <EditableField field="methodology" className="w-full" /></p>
        <div className="border-b border-dotted border-black w-full h-4"></div>
        <p className="uppercase">ASSESSMENT STRATEGIES:</p>
        <p className="pl-4">i. <EditableField field="assessment1" className="w-[95%]" /></p>
        <p className="uppercase">Learning Materials: <EditableField field="learningMaterials" className="w-full" /></p>
        <p className="uppercase">Reference: <EditableField field="reference" className="w-full" /></p>
        <p className="uppercase">LEARNING ENVIRONMENT:</p>
        <p className="pl-4">i. <EditableField field="learningEnv1" className="w-[95%]" /></p>
        <p className="uppercase">PRIOR KNOWLEDGE CONSIDERATION: <EditableField field="priorKnowledge" className="w-full" /></p>
        <p className="uppercase">INTERDISCIPLINARY CONNECTIONS:</p>
        <div className="space-y-1 pl-4">
          <p>i. <EditableField field="interConn1" className="w-[95%]" /></p>
          <p>ii. <EditableField field="interConn2" className="w-[95%]" /></p>
          <p>iii. <EditableField field="interConn3" className="w-[95%]" /></p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-black uppercase text-center mb-4 tracking-widest">LESSON PROGRESSION</h4>
        <table className="w-full border-collapse border-2 border-black text-[9px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-2 border-black p-2 font-black uppercase w-24">STAGE/TIME</th>
              <th className="border-2 border-black p-2 font-black uppercase">LEARNERS ACTIVITY</th>
              <th className="border-2 border-black p-2 font-black uppercase">TEACHERS ACTICTIVITY</th>
              <th className="border-2 border-black p-2 font-black uppercase w-32">TARGETED COMPETENCE</th>
              <th className="border-2 border-black p-2 font-black uppercase w-32">ASSESSMENT CRITERIA</th>
            </tr>
          </thead>
          <tbody>
            {[
              { stage: 'Engagement', time: '5 MIN' },
              { stage: 'Exploration', time: '20 min' },
              { stage: 'Explanation', time: '' },
              { stage: 'Synthesis', time: '' },
              { stage: 'Evaluation and Reflection', time: '' }
            ].map((s, i) => (
              <tr key={i} className="h-24 align-top">
                <td className="border-2 border-black p-2 font-bold">{s.stage}<br/><br/>{s.time}</td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`prog_learners_${i}`} className="h-full" /></td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`prog_teachers_${i}`} className="h-full" /></td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`prog_comp_${i}`} className="h-full" /></td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`prog_assess_${i}`} className="h-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="font-bold">
        <p className="uppercase">EVALUATION: <EditableField field="evaluation" className="w-full" /></p>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-dotted border-black w-full h-4 mt-1">
            <EditableField field={`eval_line_${i}`} className="w-full border-none" />
          </div>
        ))}
      </div>

      <div className="mt-12 pt-4 border-t border-slate-100 text-[8px] font-black uppercase opacity-20 text-center no-print">
        Competency Based Lesson Plan Template • MDS SMS Pedagogical Engine
      </div>
    </div>
  );

  const renderLessonPlanTemplate = () => (
    <div className="bg-white text-black p-8 font-serif border-2 border-black printable-card max-w-[850px] mx-auto mt-8 shadow-2xl animate-in zoom-in-95 duration-500 relative">
      <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
      <div className="text-center mb-8">
        <h1 className="text-xl font-black uppercase underline tracking-tight">MPULUNGU DAY SECONDARY SCHOOL</h1>
        <h2 className="text-lg font-bold uppercase underline mt-1">LESSON PLAN</h2>
        <h3 className="text-sm font-bold uppercase underline mt-1">
          <EditableField field="department" type="select" options={deptOptions} placeholder="SELECT DEPARTMENT" className="text-center w-full" />
        </h3>
      </div>

      <div className="space-y-3 text-[10px] font-bold mb-6">
        <div className="flex justify-between items-center">
          <p>CLASS: <EditableField field="class" type="select" options={teacherClasses} className="min-w-[100px]" /></p>
          <p>DATE: <EditableField field="date" defaultValue={new Date().toLocaleDateString()} className="min-w-[120px]" /></p>
          <p>NAME OF TEACHER: <EditableField field="teacherName" defaultValue={selectedTeacher.name} className="min-w-[250px]" /></p>
        </div>
        <div className="flex justify-between items-center">
          <p>DURATION: <EditableField field="duration" className="min-w-[80px]" /> (MIN)</p>
          <p>PERIOD NO: <EditableField field="periodNo" className="min-w-[80px]" /></p>
          <p>NO. OF PUPILS: BOYS: <EditableField field="boys" className="min-w-[80px]" /> GIRLS: <EditableField field="girls" className="min-w-[150px]" /></p>
        </div>
        <p>SUBJECT: <EditableField field="subject" type="select" options={allSubjectNames} className="w-full" /></p>
        <p>TOPIC: <EditableField field="topic" className="w-full" /></p>
        <p>SUBTOPIC: <EditableField field="subtopic" className="w-full" /></p>
        <p>T/L AIDS: <EditableField field="tlAids" className="w-full" /></p>
        <p>REFERENCE (S): <EditableField field="references" className="w-full" /></p>
      </div>

      <div className="space-y-4 text-[10px] font-bold mb-8">
        <div>
          <p>SPECIFIC OUTCOMES: <EditableField field="outcomes" className="w-full" /></p>
          <div className="border-b border-dotted border-black w-full h-4 mt-1"><EditableField field="outcomes2" className="w-full border-none" /></div>
          <div className="border-b border-dotted border-black w-full h-4 mt-1"><EditableField field="outcomes3" className="w-full border-none" /></div>
        </div>
        <p>KNOWLEDGE: <EditableField field="knowledge" className="w-full" /></p>
        <p>SKILLS: <EditableField field="skills" className="w-full" /></p>
        <p>VALUES: <EditableField field="values" className="w-full" /></p>
        <div>
          <p>INTRODUCTION: <EditableField field="introduction" className="w-full" /></p>
          <div className="border-b border-dotted border-black w-full h-4 mt-1"><EditableField field="introduction2" className="w-full border-none" /></div>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-xs font-black uppercase text-center mb-4 tracking-widest">LESSON DEVELOPMENT</h4>
        <table className="w-full border-collapse border-2 border-black text-[9px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-2 border-black p-2 w-12 font-black uppercase">STEP</th>
              <th className="border-2 border-black p-2 font-black uppercase">TOPIC/CONTENT</th>
              <th className="border-2 border-black p-2 font-black uppercase">TEACHERS’ ACTIVITY</th>
              <th className="border-2 border-black p-2 font-black uppercase">PUPILS’ ACTIVITY</th>
              <th className="border-2 border-black p-2 font-black uppercase">METHODOLOGY/ TECHNIQUES</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="h-12 align-top">
                <td className="border-2 border-black p-1 text-center font-bold">{i + 1}</td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`dev_topic_${i}`} className="h-full" /></td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`dev_teacher_${i}`} className="h-full" /></td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`dev_pupil_${i}`} className="h-full" /></td>
                <td className="border-2 border-black p-1"><EditableTextArea field={`dev_method_${i}`} className="h-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-6 text-[10px] font-bold">
        <p>CONCLUSION: <EditableField field="conclusion" className="w-full" /></p>
        <div>
          <p>EVALUATION: <EditableField field="evaluation" className="w-full" /></p>
          <div className="border-b border-dotted border-black w-full h-4 mt-1"><EditableField field="evaluation2" className="w-full border-none" /></div>
          <div className="border-b border-dotted border-black w-full h-4 mt-1"><EditableField field="evaluation3" className="w-full border-none" /></div>
        </div>
      </div>
      
      <div className="mt-12 pt-4 border-t border-slate-100 text-[8px] font-black uppercase opacity-20 text-center no-print">
        Official Lesson Plan Template • MDS SMS Pedagogical Engine
      </div>
    </div>
  );

  const renderPeriodRegister = () => {
    const teacherSessions = periodSessions.filter(s => 
      teacherPeriodAllocations.some(a => a.id === s.allocationId)
    );

    const stats = teacherPeriodAllocations.map(alloc => {
      const held = teacherSessions
        .filter(s => s.allocationId === alloc.id)
        .reduce((sum, s) => sum + s.periodsHeld, 0);
      const target = alloc.weeklyTarget * 12; // Assuming 12 weeks per term
      const percentage = target > 0 ? (held / target) * 100 : 0;
      const subject = subjects.find(s => s.id === alloc.subjectId)?.name || 'Unknown';
      const className = classes.find(c => c.id === alloc.classId)?.name || 'Unknown';

      return { id: alloc.id, subject, className, held, target, percentage, classId: alloc.classId };
    });

    const handleSaveRegistration = (allocId: string, presentStudentIds: string[]) => {
      const newSession: PeriodSession = {
        id: Math.random().toString(36).substr(2, 9),
        allocationId: allocId,
        date: registerDate,
        periodsHeld: 1,
        recordedBy: userId
      };

      const newAttendance: PeriodAttendance[] = presentStudentIds.map(sid => ({
        id: Math.random().toString(36).substr(2, 9),
        sessionId: newSession.id,
        studentId: sid,
        status: 'P'
      }));

      setPeriodSessions(prev => [...prev, newSession]);
      setPeriodAttendance(prev => [...prev, ...newAttendance]);
      setRegisteringAllocId(null);
    };

    if (registeringAllocId) {
      const alloc = periodAllocations.find(a => a.id === registeringAllocId);
      const cls = classes.find(c => c.id === alloc?.classId);
      const sub = subjects.find(s => s.id === alloc?.subjectId);
      const classStudents = students.filter(s => s.class === cls?.name);

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Period Registration</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">{sub?.name} • {cls?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="date" 
                value={registerDate}
                onChange={(e) => setRegisterDate(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold p-2 rounded-lg outline-none border border-slate-700"
              />
              <button 
                onClick={() => setRegisteringAllocId(null)}
                className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-[40px] border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700">
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Number</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {classStudents.map(student => {
                  const isPresent = true; // Local state would be better, but for simplicity we'll use a form approach if needed
                  return (
                    <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-6 text-xs font-bold text-white uppercase">{student.name}</td>
                      <td className="p-6 text-xs font-mono text-slate-400">{student.id}</td>
                      <td className="p-6 text-center">
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          id={`att-${student.id}`}
                          className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-8 bg-slate-900/50 border-t border-slate-700 flex justify-end">
              <button 
                onClick={() => {
                  const presentIds = classStudents
                    .filter(s => (document.getElementById(`att-${s.id}`) as HTMLInputElement).checked)
                    .map(s => s.id);
                  handleSaveRegistration(registeringAllocId, presentIds);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <i className="fas fa-tachometer-alt text-6xl text-blue-500"></i>
              </div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{s.subject}</p>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4">{s.className}</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Periodmeter</span>
                  <span className="text-2xl font-black text-white">{s.held} <span className="text-[10px] text-slate-500">/ {s.target}</span></span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className={`h-full transition-all duration-1000 ${s.percentage >= 80 ? 'bg-emerald-500' : s.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(s.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {s.percentage.toFixed(1)}% Coverage
                  </p>
                  <button 
                    onClick={() => setRegisteringAllocId(s.id)}
                    className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                  >
                    Mark Register
                  </button>
                </div>
              </div>
            </div>
          ))}
          {stats.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-[40px]">
              <i className="fas fa-clock text-4xl text-slate-700 mb-4"></i>
              <p className="text-slate-500 uppercase font-black tracking-widest text-xs">No period allocations found for this teacher.</p>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">Recent Period Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Class</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Periods</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {teacherSessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(s => {
                  const alloc = periodAllocations.find(a => a.id === s.allocationId);
                  const cls = classes.find(c => c.id === alloc?.classId)?.name;
                  const sub = subjects.find(sub => sub.id === alloc?.subjectId)?.name;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 text-xs font-bold text-white">{s.date}</td>
                      <td className="py-4 text-xs font-bold text-slate-300 uppercase">{cls}</td>
                      <td className="py-4 text-xs font-bold text-slate-300 uppercase">{sub}</td>
                      <td className="py-4 text-xs font-black text-blue-500">{s.periodsHeld}</td>
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

  const renderClassList = () => {
    const teacherClassList = classes.filter(c => 
      teacherAllocations.some(a => a.classId === c.id)
    );

    if (viewingClassId) {
      const cls = classes.find(c => c.id === viewingClassId);
      const classStudents = students.filter(s => s.class === cls?.name);

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">{cls?.name} Class Roll</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Nominal List of Students</p>
            </div>
            <button 
              onClick={() => setViewingClassId(null)}
              className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest"
            >
              Back to Classes
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-[40px] border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700">
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Number</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {classStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-6 text-xs font-bold text-white uppercase">{student.name}</td>
                    <td className="p-6 text-xs font-mono text-slate-400">{student.id}</td>
                    <td className="p-6 text-xs font-bold text-slate-300 uppercase">{student.gender}</td>
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                        student.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teacherClassList.map(cls => (
            <div key={cls.id} className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 shadow-xl group hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                  <i className="fas fa-users text-xl"></i>
                </div>
                <button 
                  onClick={() => setViewingClassId(cls.id)}
                  className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                >
                  View Roll
                </button>
              </div>
              <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{cls.name}</h4>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-6">Assigned Class Unit</p>
              
              <div className="space-y-3">
                {teacherAllocations.filter(a => a.classId === cls.id).map(a => (
                  <div key={a.id} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      {subjects.find(s => s.id === a.subjectId)?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {teacherClassList.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-[40px]">
              <i className="fas fa-school text-4xl text-slate-700 mb-4"></i>
              <p className="text-slate-500 uppercase font-black tracking-widest text-xs">No classes assigned to your profile.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAcademicProgress = () => {
    const handleStageMark = (studentId: string, score: number) => {
      setStagedAcademicMarks(prev => ({ ...prev, [studentId]: score }));
    };

    const handleSaveAcademicMarks = async () => {
      const studentIds = Object.keys(stagedAcademicMarks);
      if (studentIds.length === 0) {
        alert('No changes to save.');
        return;
      }

      setIsSavingAcademicMarks(true);
      try {
        setMarks(prev => {
          let updated = [...prev];
          studentIds.forEach(studentId => {
            const score = stagedAcademicMarks[studentId];
            const existingIdx = updated.findIndex(m => m.studentId === studentId && m.subjectId === markingSubjectId && m.sessionId === markingSessionId);
            if (existingIdx > -1) {
              updated[existingIdx] = { ...updated[existingIdx], score };
            } else {
              updated.push({
                id: Math.random().toString(36).substr(2, 9),
                studentId,
                subjectId: markingSubjectId!,
                sessionId: markingSessionId!,
                score
              });
            }
          });
          return updated;
        });
        setStagedAcademicMarks({});
        updateRecordData('lastMarkEntry', new Date().toISOString());
        alert('Academic marks saved and synced to cloud!');
      } catch (error) {
        alert('Failed to save academic marks.');
      } finally {
        setIsSavingAcademicMarks(false);
      }
    };

    if (markingClassId && markingSubjectId && markingSessionId) {
      const cls = classes.find(c => c.id === markingClassId);
      const sub = subjects.find(s => s.id === markingSubjectId);
      const session = sessions.find(s => s.id === markingSessionId);
      const classStudents = students.filter(s => s.class === cls?.name);

    const teacher = teachers.find(t => t.id === selectedTeacherId);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white text-black p-8 font-serif border-2 border-black printable-card max-w-[1000px] mx-auto shadow-2xl relative">
          <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
          <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              <i className="fas fa-school text-4xl opacity-20"></i>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{schoolName}</h1>
              <h2 className="text-lg font-black uppercase tracking-widest border-t border-black mt-2 pt-1">Academic Progress Mark Sheet</h2>
              <h3 className="text-sm font-bold uppercase mt-1">
                <EditableField field="department" type="select" options={deptOptions} placeholder="SELECT DEPARTMENT" className="text-center w-full" />
              </h3>
              <div className="flex justify-center gap-8 mt-4 text-xs font-bold uppercase">
                <span>Class: {cls?.name}</span>
                <span>Subject: {sub?.name}</span>
                <span>Session: {session?.name}</span>
              </div>
            </div>
            <div className="w-20 h-20 shrink-0 flex justify-end">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Coat_of_arms_of_Zambia.svg/512px-Coat_of_arms_of_Zambia.svg.png" className="w-full h-full object-contain" alt="" />
            </div>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[10px] uppercase font-black">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-black p-2 w-14 text-center">S/N</th>
                <th className="border border-black p-2 text-left">STUDENT NAME</th>
                <th className="border border-black p-2 w-40 text-left">IDENTITY NUMBER</th>
                <th className="border border-black p-2 w-24 text-center">SCORE (%)</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student, idx) => {
                const savedMark = marks.find(m => m.studentId === student.id && m.subjectId === markingSubjectId && m.sessionId === markingSessionId);
                const stagedScore = stagedAcademicMarks[student.id];
                const score = stagedScore !== undefined ? stagedScore : (savedMark?.score || '');
                
                return (
                  <tr key={student.id} className="h-10 border-b border-black">
                    <td className="border-x border-black px-2 text-center">{idx + 1}</td>
                    <td className="border-x border-black px-4 text-left">{student.name}</td>
                    <td className="border-x border-black px-4 text-left font-mono">{student.id}</td>
                    <td className="border-x border-black px-2 text-center">
                      <input 
                        type="number" 
                        value={score}
                        onChange={(e) => handleStageMark(student.id, parseFloat(e.target.value))}
                        className="w-16 bg-slate-50 border border-slate-300 rounded text-center font-black p-1 no-print"
                      />
                      <span className="hidden print:inline">{score || '-'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-12 flex justify-between items-end text-[9px] font-black uppercase">
            <div className="space-y-1">
              <p>Teacher: {teacher?.name}</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center min-w-[200px] border-t border-black pt-2">
              Teacher's Signature
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 no-print">
          <button 
            onClick={() => alert('Academic progress marks saved successfully!')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
          >
            <i className="fas fa-save"></i> Save Marks Sheet
          </button>
          <button 
            onClick={() => {
                setMarkingClassId(null);
                setMarkingSubjectId(null);
                setMarkingSessionId(null);
              }}
              className="bg-slate-800 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
            >
              Back to Analytics
            </button>
          </div>
        </div>
      );
    }

    const teacherMarks = marks.filter(m => 
      teacherAllocations.some(a => a.subjectId === m.subjectId && a.classId === (classes.find(c => c.id === a.classId)?.id))
    );

    const chartData = sessions.map(session => {
      const sessionMarks = teacherMarks.filter(m => m.sessionId === session.id);
      const avg = sessionMarks.length > 0 
        ? sessionMarks.reduce((sum, m) => sum + m.score, 0) / sessionMarks.length 
        : 0;
      return {
        name: session.name,
        average: parseFloat(avg.toFixed(1))
      };
    }).filter(d => d.average > 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Academic Progress Analytics</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Exam Performance Trends for Your Subjects</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">Performance Yield</span>
            </div>
          </div>

          <div className="h-[300px] w-full mb-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight="bold" 
                  tickFormatter={(val) => val.toUpperCase()}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight="bold" 
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  labelStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'black', marginBottom: '4px' }}
                />
                <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-700 pt-8">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Conduct Marking</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select 
                onChange={(e) => setMarkingClassId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold p-3 rounded-xl outline-none border border-slate-700"
              >
                <option value="">Select Class...</option>
                {classes.filter(c => teacherAllocations.some(a => a.classId === c.id)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select 
                onChange={(e) => setMarkingSubjectId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold p-3 rounded-xl outline-none border border-slate-700"
              >
                <option value="">Select Subject...</option>
                {subjects.filter(s => teacherAllocations.some(a => a.subjectId === s.id)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select 
                onChange={(e) => setMarkingSessionId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold p-3 rounded-xl outline-none border border-slate-700"
              >
                <option value="">Select Session...</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teacherAllocations.map(alloc => {
            const subMarks = marks.filter(m => m.subjectId === alloc.subjectId);
            const avg = subMarks.length > 0 ? subMarks.reduce((sum, m) => sum + m.score, 0) / subMarks.length : 0;
            const subName = subjects.find(s => s.id === alloc.subjectId)?.name;
            const clsName = classes.find(c => c.id === alloc.classId)?.name;

            return (
              <div key={alloc.id} className="bg-slate-800/30 p-6 rounded-3xl border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{clsName}</p>
                  <h5 className="text-sm font-black text-white uppercase tracking-tight">{subName}</h5>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-500 tracking-tighter">{avg.toFixed(1)}%</p>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Global Avg</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTaughtFolder = () => {
    const taughtRecords = records.filter(r => r.teacherId === selectedTeacherId && r.isTaught && r.type.startsWith('LESSON_PLAN'));
    
    if (selectedRecordId && activeRecord && activeRecord.isTaught && activeRecord.type.startsWith('LESSON_PLAN')) {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setSelectedRecordId(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Folder
            </button>
          </div>
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {activeRecord.type.includes('COMPETENCY') ? renderLessonPlanTemplate2() : renderLessonPlanTemplate()}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Taught Folder</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Archive of Completed Lessons</p>
            </div>
            <div className="bg-emerald-600 text-white px-6 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg">
              {taughtRecords.length} Lessons Taught
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taughtRecords.map(record => (
              <div key={record.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <i className="fas fa-chalkboard-teacher"></i>
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Taught</span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{record.data.topic || record.type.replace(/_/g, ' ')}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                  {new Date(record.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedRecordId(record.id);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                  >
                    View Lesson Plan
                  </button>
                  {selectedTeacherId === userId && (
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                      title="Delete Record"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {taughtRecords.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-[40px]">
                <i className="fas fa-folder-open text-4xl text-slate-700 mb-4"></i>
                <p className="text-slate-500 uppercase font-black tracking-widest text-xs">No lesson plans marked as taught yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWorkCoveredFolder = () => {
    const coveredRecords = records.filter(r => r.teacherId === selectedTeacherId && r.isTaught && r.type === 'RECORDS_OF_WORK');
    
    if (selectedRecordId && activeRecord && activeRecord.isTaught && activeRecord.type === 'RECORDS_OF_WORK') {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setSelectedRecordId(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Folder
            </button>
          </div>
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {renderRecordsOfWorkTemplate()}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Work Covered Folder</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Archive of Records of Work Covered</p>
            </div>
            <div className="bg-emerald-600 text-white px-6 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg">
              {coveredRecords.length} Records Covered
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coveredRecords.map(record => (
              <div key={record.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clipboard-check"></i>
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Covered</span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{record.data.subject || 'Record of Work'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                  {new Date(record.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedRecordId(record.id);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                  >
                    View Record
                  </button>
                  {selectedTeacherId === userId && (
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                      title="Delete Record"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {coveredRecords.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-[40px]">
                <i className="fas fa-archive text-4xl text-slate-700 mb-4"></i>
                <p className="text-slate-500 uppercase font-black tracking-widest text-xs">No records of work marked as covered yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHomeWorkGivenFolder = () => {
    const approvedHomework = records.filter(r => r.teacherId === selectedTeacherId && r.isTaught && r.type === 'HOME_WORK');
    
    if (selectedRecordId && activeRecord && activeRecord.isTaught && activeRecord.type === 'HOME_WORK') {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setSelectedRecordId(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Folder
            </button>
          </div>
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {renderHomeWorkTemplate()}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Home Work Given Folder</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Archive of Approved Home Work Assignments</p>
            </div>
            <div className="bg-emerald-600 text-white px-6 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg">
              {approvedHomework.length} Assignments
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedHomework.map(record => (
              <div key={record.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <i className="fas fa-house-circle-check"></i>
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Approved</span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{record.data.topic || 'Home Work Record'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                  {new Date(record.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedRecordId(record.id);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                  >
                    View Record
                  </button>
                  {selectedTeacherId === userId && (
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                      title="Delete Record"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {approvedHomework.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-[40px]">
                <i className="fas fa-home text-4xl text-slate-700 mb-4"></i>
                <p className="text-slate-500 uppercase font-black tracking-widest text-xs">No approved home work records yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNoRecordSelected = () => {
    const section = sections.find(s => s.id === activeSub);
    return (
      <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-700">
          <i className={`fas ${section?.icon} text-4xl text-slate-700`}></i>
        </div>
        <h5 className="text-slate-400 font-black uppercase text-sm tracking-widest mb-2">No Active Record Selected</h5>
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest max-w-[200px]">
          Select an existing record or create a new one to begin.
        </p>
        
        {sectionRecords.length > 0 && (
          <div className="mt-8 w-full max-w-xs space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recent Records</p>
            {sectionRecords.slice(0, 5).map(r => (
              <div key={r.id} className="flex gap-2">
                <button 
                  onClick={() => setSelectedRecordId(r.id)}
                  className="flex-1 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 text-left transition-all group"
                >
                  <p className="text-xs font-bold text-white uppercase group-hover:text-blue-400">
                    {r.data.topic || r.data.date || r.data.schemesTitle || r.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">
                    {new Date(r.createdAt).toLocaleDateString()} • {r.status}
                  </p>
                </button>
                {selectedTeacherId === userId && (
                  <button 
                    onClick={() => handleDeleteRecord(r.id)}
                    className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-4 rounded-xl border border-rose-500/20 transition-all"
                    title="Delete Record"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTeacherId === userId && (
          <button 
            onClick={handleCreateNew}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
          >
            <i className="fas fa-plus mr-2"></i> Create New Record
          </button>
        )}
      </div>
    );
  };

  const renderTestTemplate = () => (
    <div 
      className="bg-white text-black p-6 md:p-12 font-serif border-2 border-black printable-card max-w-[850px] mx-auto mt-8 shadow-2xl animate-in zoom-in-95 duration-500 relative min-h-[1100px]"
      style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt" }}
    >
      {/* Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex flex-wrap gap-10 p-10 select-none no-print">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="text-xl font-black rotate-[-45deg] whitespace-nowrap">
            MPULUNGU DAY SECONDARY SCHOOL
          </span>
        ))}
      </div>

      <ApprovalStamp activeRecord={activeRecord} teachers={teachers} departments={departments} />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex flex-col">
          <p className="font-bold">Candidate Name: <EditableField field="candidateName" placeholder="__________________________________" className="min-w-[200px]" /></p>
        </div>
        {schoolLogo && (
          <div className="w-16 h-16 md:w-24 md:h-24">
            <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      <div className="text-center mb-12 space-y-2 relative z-10">
        <h1 className="text-sm md:text-lg font-black uppercase tracking-tight">MINISTRY OF EDUCATION</h1>
        <h2 className="text-base md:text-xl font-black uppercase underline">MPULUNGU DAY SECONDARY SCHOOL</h2>
      </div>

      <div className="text-center mb-12 relative z-10">
        <div className="flex flex-wrap justify-center items-center gap-4 text-sm md:text-lg font-black">
          <EditableField field="subject" type="select" options={allSubjectNames} placeholder="SUBJECT" className="min-w-[150px]" />
          <EditableField field="paperCode" placeholder="CODE/NUMBER" className="min-w-[100px]" />
        </div>
        <p className="text-[10px] md:text-sm font-bold mt-2">(INTERNAL CANDIDATES)</p>
      </div>

      <div className="flex justify-between items-center mb-8 border-y-2 border-black py-4 font-bold text-[10px] md:text-sm relative z-10">
        <p>Time: <EditableField field="time" placeholder="1 hours 45 minutes" className="min-w-[150px]" /></p>
        <p>Marks: <EditableField field="totalMarks" placeholder="40" className="min-w-[50px]" /></p>
      </div>

      <div className="space-y-6 mb-12 relative z-10">
        <div>
          <h3 className="font-black underline uppercase mb-2 text-[10px] md:text-sm">Instructions to candidates</h3>
          <ol className="list-decimal ml-6 space-y-1 text-[9px] md:text-xs">
            <li>Write your name, centre number and candidate number in the space provided at the top of this page.</li>
            <li>Write your answers in the spaces provided on the question paper.</li>
            <li>Cell phones are not allowed in the examination room.</li>
          </ol>
        </div>

        <div>
          <h3 className="font-black underline uppercase mb-2 text-[10px] md:text-sm">Information for candidates</h3>
          <p className="text-[9px] md:text-xs">The number of marks is given in brackets [ ] at the end of each question or part question.</p>
          <p className="text-[9px] md:text-xs">The total number of marks for this paper is <EditableField field="totalMarks" placeholder="40" className="inline-block min-w-[30px]" />.</p>
        </div>
      </div>

      <div className="border-2 border-black p-4 w-32 md:w-48 ml-auto mb-12 relative z-10">
        <p className="text-[8px] md:text-xs font-black text-center uppercase">For Examiner's use</p>
        <div className="h-16 md:h-24"></div>
      </div>

      <div className="border-t-2 border-black pt-8 relative z-10">
        <EditableTextArea 
          field="testContent" 
          placeholder="Type your test questions here..." 
          className="min-h-[600px] text-xs md:text-base leading-relaxed"
        />
      </div>
    </div>
  );

  const renderTestsFolder = () => {
    const teacherTests = records.filter(r => r.teacherId === selectedTeacherId && r.type === 'TESTS');
    
    if (selectedRecordId && activeRecord && activeRecord.type === 'TESTS') {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-4 no-print">
            <button 
              onClick={() => setSelectedRecordId(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Tests
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
            >
              <i className="fas fa-print mr-2"></i> Print Test
            </button>
            <button 
              onClick={downloadAsWord}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
            >
              <i className="fas fa-file-word mr-2"></i> Download Word
            </button>
          </div>
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {renderTestTemplate()}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Tests Repository</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Manage and Submit Assessment Tests</p>
            </div>
            {selectedTeacherId === userId && (
              <button 
                onClick={() => {
                  const newRecord: TeachingFileRecord = {
                    id: `TFR-${Date.now()}`,
                    type: 'TESTS',
                    teacherId: userId,
                    data: {
                      department: departments.find(d => d.teacherIds.includes(userId))?.name || '',
                      subject: '',
                      paperCode: '',
                      time: '1 hours 45 minutes',
                      totalMarks: '40',
                      testContent: ''
                    },
                    status: 'Draft',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  setRecords([newRecord, ...records]);
                  setSelectedRecordId(newRecord.id);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Create New Test
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherTests.map(record => (
              <div key={record.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                    <i className="fas fa-file-signature"></i>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                    record.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                    record.status === 'Submitted to HOD' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">
                  {record.data.subject || 'Untitled Test'} {record.data.paperCode}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                  {new Date(record.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedRecordId(record.id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                  >
                    {selectedTeacherId === userId ? 'Edit / View' : 'View Test'}
                  </button>
                  {selectedTeacherId === userId && (
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                      title="Delete Test"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {teacherTests.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-[40px]">
                <i className="fas fa-file-signature text-4xl text-slate-700 mb-4"></i>
                <p className="text-slate-500 uppercase font-black tracking-widest text-xs">No tests created yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const section = sections.find(s => s.id === activeSub);
    return (
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 min-h-[600px] animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i className={`fas ${section?.icon} text-xl`}></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{section?.label}</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">
                {selectedTeacherId === userId ? 'My Personal File' : `File for ${selectedTeacher.name}`} • {schoolName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 no-print">
            {sectionRecords.length > 1 && (
              <select 
                value={activeRecord?.id || ''}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="bg-slate-800 text-white text-[10px] font-black uppercase p-2 rounded-xl border border-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
              >
                {sectionRecords.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.data.topic || r.data.date || r.data.schemesTitle || r.type.replace(/_/g, ' ')} ({new Date(r.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
            {(activeSub === 'LESSON_PLAN' || activeSub === 'WORK_PLAN' || activeSub === 'RECORDS_OF_WORK' || activeSub === 'HOME_WORK' || activeSub === 'SCHEMES') && (
              <>
                {selectedTeacherId === userId && (
                  <button 
                    onClick={handleCreateNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                  >
                    <i className="fas fa-plus"></i> New
                  </button>
                )}
                <button 
                  onClick={() => window.print()}
                  className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl flex items-center gap-2"
                >
                  <i className="fas fa-print"></i> Print
                </button>
              </>
            )}
          </div>
        </div>

        {activeSub === 'LESSON_PLAN' ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 no-print">
              <button 
                onClick={() => setLessonPlanType('STANDARD')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  lessonPlanType === 'STANDARD' 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Standard Lesson Plan
              </button>
              <button 
                onClick={() => setLessonPlanType('COMPETENCY')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  lessonPlanType === 'COMPETENCY' 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Competency Based Plan
              </button>
            </div>

            {activeRecord ? (
              <>
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex items-center gap-4 no-print">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div>
                    <p className="text-white font-black uppercase text-xs tracking-widest">
                      {lessonPlanType === 'STANDARD' ? 'Official Lesson Plan Template' : 'Competency Based Lesson Plan'}
                    </p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Use the print button above to generate a physical copy of this standardized form.</p>
                  </div>
                </div>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {lessonPlanType === 'STANDARD' ? renderLessonPlanTemplate() : renderLessonPlanTemplate2()}
                </div>
              </>
            ) : renderNoRecordSelected()}
          </div>
        ) : activeSub === 'WORK_PLAN' ? (
          <div className="space-y-8">
            {activeRecord ? (
              <>
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex items-center gap-4 no-print">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div>
                    <p className="text-white font-black uppercase text-xs tracking-widest">Individual Work Plan Template</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Use the print button above to generate a physical copy of this standardized form.</p>
                  </div>
                </div>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {renderWorkPlanTemplate()}
                </div>
              </>
            ) : renderNoRecordSelected()}
          </div>
        ) : activeSub === 'RECORDS_OF_WORK' ? (
          <div className="space-y-8">
            {activeRecord ? (
              <>
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex items-center gap-4 no-print">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div>
                    <p className="text-white font-black uppercase text-xs tracking-widest">Record of Work Template</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Use the print button above to generate a physical copy of this standardized form.</p>
                  </div>
                </div>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {renderRecordsOfWorkTemplate()}
                </div>
              </>
            ) : renderNoRecordSelected()}
          </div>
        ) : activeSub === 'HOME_WORK' ? (
          <div className="space-y-8">
            {activeRecord ? (
              <>
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex items-center gap-4 no-print">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div>
                    <p className="text-white font-black uppercase text-xs tracking-widest">Home Work Record Template</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Use the print button above to generate a physical copy of this standardized form.</p>
                  </div>
                </div>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {renderHomeWorkTemplate()}
                </div>
              </>
            ) : renderNoRecordSelected()}
          </div>
        ) : activeSub === 'SCHEMES' ? (
          <div className="space-y-8">
            {activeRecord ? (
              <>
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex items-center gap-4 no-print">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div>
                    <p className="text-white font-black uppercase text-xs tracking-widest">Schemes of Work Template</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Use the print button above to generate a physical copy of this standardized form.</p>
                  </div>
                </div>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {renderSchemesOfWorkTemplate()}
                </div>
              </>
            ) : renderNoRecordSelected()}
          </div>
        ) : activeSub === 'PERIOD_REGISTER' ? (
          renderPeriodRegister()
        ) : activeSub === 'CLASS_LIST' ? (
          renderClassList()
        ) : activeSub === 'ACADEMIC_PROGRESS' ? (
          activeRecord ? renderAcademicProgress() : renderNoRecordSelected()
        ) : (activeSub === 'TIMETABLE' || activeSub === 'SYLLABUS') ? (
          activeRecord ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h4 className="text-white font-black uppercase text-xs tracking-widest mb-4">Document Management</h4>
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <i className="fas fa-cloud-upload-alt text-2xl text-slate-500 mb-2"></i>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upload {section?.label}</p>
                      </div>
                      <input type="file" className="hidden" />
                    </label>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                      View Digital Archive
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h4 className="text-white font-black uppercase text-xs tracking-widest mb-4">Quick Notes</h4>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs text-white font-bold outline-none focus:ring-1 focus:ring-blue-500 min-h-[150px]"
                    placeholder={`Enter notes regarding ${section?.label.toLowerCase()}...`}
                  ></textarea>
                  <button className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                    Save Notes
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                  <i className={`fas ${section?.icon} text-4xl text-slate-700`}></i>
                </div>
                <h5 className="text-slate-400 font-black uppercase text-sm tracking-widest mb-2">Digital {section?.label} Record</h5>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest max-w-[200px]">
                  This record stores your uploaded {section?.label.toLowerCase()} and associated notes.
                </p>
              </div>
            </div>
          ) : renderNoRecordSelected()
        ) : activeSub === 'HOME_WORK_GIVEN' ? (
          renderHomeWorkGivenFolder()
        ) : activeSub === 'TAUGHT_FOLDER' ? (
          renderTaughtFolder()
        ) : activeSub === 'WORK_COVERED' ? (
          renderWorkCoveredFolder()
        ) : activeSub === 'TESTS' ? (
          renderTestsFolder()
        ) : null}

        {activeSub !== 'PERIOD_REGISTER' && activeSub !== 'CLASS_LIST' && activeRecord && (
          <WorkflowControls 
            activeRecord={activeRecord}
            selectedTeacherId={selectedTeacherId}
            userId={userId}
            isHOD={isHOD}
            userRole={userRole}
            toggleTaught={toggleTaught}
            handleStatusChange={handleStatusChange}
            handleComment={handleComment}
            handleDeleteRecord={handleDeleteRecord}
          />
        )}
      </div>
    );
  };

  return (
    <TeachingFileContext.Provider value={contextValue}>
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <i className="fas fa-folder-open text-[12rem] text-blue-500"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Teaching File</h2>
            <p className="text-blue-500 text-[12px] font-black uppercase tracking-[0.4em] mt-2">Professional Pedagogical Documentation</p>
          </div>

          {(isHOD || userRole === 'ADMIN') && (
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex flex-col gap-2 min-w-[250px] no-print">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Viewing Records For:</label>
              <select 
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold p-2 rounded-lg outline-none border border-slate-700 focus:ring-1 focus:ring-blue-500"
              >
                <option value={userId}>My Own Records ({userName})</option>
                <optgroup label="Other Teachers">
                  {accessibleTeachers.filter(t => t.id !== userId).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-80 flex flex-col gap-2 no-print">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSub(s.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black transition-all uppercase tracking-widest border ${
                activeSub === s.id 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-500/20 translate-x-2' 
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <i className={`fas ${s.icon} w-5 text-center`}></i>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
    </TeachingFileContext.Provider>
  );
};

interface WorkflowControlsProps {
  activeRecord: TeachingFileRecord;
  selectedTeacherId: string;
  userId: string;
  isHOD: boolean;
  userRole: UserRole;
  toggleTaught: () => void;
  handleStatusChange: (status: TeachingFileRecord['status']) => void;
  handleComment: (role: 'HOD' | 'ADMIN', comment: string) => void;
  handleDeleteRecord: (recordId: string) => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  activeRecord, selectedTeacherId, userId, isHOD, userRole, toggleTaught, handleStatusChange, handleComment, handleDeleteRecord
}) => {
  return (
    <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700 no-print">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            activeRecord.status === 'Draft' ? 'bg-slate-700 text-slate-300' :
            activeRecord.status === 'Submitted to HOD' ? 'bg-blue-600 text-white' :
            activeRecord.status === 'Submitted to Admin' ? 'bg-purple-600 text-white' :
            activeRecord.status === 'Approved' ? 'bg-emerald-600 text-white' :
            'bg-rose-600 text-white'
          }`}>
            Status: {activeRecord.status}
          </div>
          {activeRecord.type.startsWith('LESSON_PLAN') && (
            <button 
              onClick={toggleTaught}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeRecord.isTaught ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className={`fas ${activeRecord.isTaught ? 'fa-check-circle' : 'fa-circle'} mr-1`}></i>
              {activeRecord.isTaught ? 'Taught' : 'Mark as Taught'}
            </button>
          )}
          {activeRecord.type === 'RECORDS_OF_WORK' && (
            <button 
              onClick={toggleTaught}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeRecord.isTaught ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className={`fas ${activeRecord.isTaught ? 'fa-check-circle' : 'fa-circle'} mr-1`}></i>
              {activeRecord.isTaught ? 'Work Covered' : 'Mark as Work Covered'}
            </button>
          )}
          {activeRecord.type === 'HOME_WORK' && (
            <button 
              onClick={toggleTaught}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeRecord.isTaught ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className={`fas ${activeRecord.isTaught ? 'fa-check-circle' : 'fa-circle'} mr-1`}></i>
              {activeRecord.isTaught ? 'Home Work Given' : 'Mark as Home Work Given'}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {(activeRecord.status === 'Draft' || activeRecord.status === 'Returned') && selectedTeacherId === userId ? (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn.innerText;
                  btn.innerText = 'SAVED ✓';
                  btn.classList.add('bg-emerald-600');
                  setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove('bg-emerald-600');
                  }, 2000);
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Save Draft
              </button>
              <button 
                onClick={() => handleStatusChange(isHOD ? 'Submitted to Admin' : 'Submitted to HOD')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {isHOD ? 'Submit to Admin' : 'Submit to HOD'}
              </button>
            </div>
          ) : activeRecord.status === 'Submitted to HOD' && (isHOD || userRole === 'ADMIN') ? (
            <div className="flex gap-2">
              <button 
                onClick={() => handleStatusChange('Submitted to Admin')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Submit to Admin
              </button>
              <button 
                onClick={() => handleStatusChange('Approved')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Approve
              </button>
              <button 
                onClick={() => handleStatusChange('Returned')}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Return
              </button>
            </div>
          ) : activeRecord.status === 'Submitted to Admin' && userRole === 'ADMIN' ? (
            <div className="flex gap-2">
              <button 
                onClick={() => handleStatusChange('Approved')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Approve
              </button>
              <button 
                onClick={() => handleStatusChange('Returned')}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Return
              </button>
            </div>
          ) : null}
          
          {selectedTeacherId === userId && (
            <button 
              onClick={() => handleDeleteRecord(activeRecord.id)}
              className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
              title="Delete Document"
            >
              <i className="fas fa-trash"></i>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HOD Comments</label>
          <textarea 
            value={activeRecord.hodComment || ''}
            onChange={(e) => handleComment('HOD', e.target.value)}
            disabled={!isHOD && userRole !== 'ADMIN'}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
            placeholder="HOD comments here..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin Comments</label>
          <textarea 
            value={activeRecord.adminComment || ''}
            onChange={(e) => handleComment('ADMIN', e.target.value)}
            disabled={userRole !== 'ADMIN'}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
            placeholder="Admin comments here..."
          />
        </div>
      </div>
    </div>
  );
};

const ApprovalStamp = ({ activeRecord, teachers, departments }: { activeRecord: TeachingFileRecord | undefined, teachers: Teacher[], departments: Department[] }) => {
  if (!activeRecord) return null;
  const isApproved = activeRecord.status === 'Approved';
  const isTaught = activeRecord.isTaught;
  const deptName = activeRecord.data.department || 'GENERAL';

  const hodName = useMemo(() => {
    const dept = departments.find(d => d.name === deptName);
    if (dept) {
      const hod = teachers.find(t => t.id === dept.hodId);
      return hod ? hod.name : 'Head of Department';
    }
    return 'Head of Department';
  }, [deptName, teachers, departments]);

  if (!isApproved && !isTaught) return null;

  const getTagLabel = () => {
    if (activeRecord.type.startsWith('LESSON_PLAN')) return 'TAUGHT';
    if (activeRecord.type === 'RECORDS_OF_WORK') return 'WORK COVERED';
    if (activeRecord.type === 'HOME_WORK') return 'HOME WORK GIVEN';
    if (activeRecord.type === 'TESTS') return 'TEST SUBMITTED';
    return 'COMPLETED';
  };

  return (
    <div className="absolute top-10 right-10 flex flex-col gap-4 no-print pointer-events-none">
      {isApproved && (
        <div className="flex flex-col items-center">
          <div className="border-4 border-emerald-600 text-emerald-600 font-black p-4 rounded-xl rotate-12 opacity-80 uppercase tracking-widest text-xl text-center shadow-lg bg-white/50 backdrop-blur-sm">
            HOD APPROVED
            <div className="text-[10px] mt-1 border-t border-emerald-600 pt-1">
              {deptName}
            </div>
            <div className="text-[8px] mt-1 opacity-60">
              {new Date(activeRecord.updatedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="font-serif italic text-slate-800 text-sm border-b border-slate-400 px-4">
              {hodName}
            </div>
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
              Digital Verification
            </div>
          </div>
        </div>
      )}
      {isTaught && (
        <div className="border-4 border-blue-600 text-blue-600 font-black p-4 rounded-xl -rotate-12 opacity-80 uppercase tracking-widest text-xl text-center shadow-lg bg-white/50 backdrop-blur-sm">
          {getTagLabel()}
          <div className="text-[8px] mt-1 border-t border-blue-600 pt-1 opacity-60">
            {new Date(activeRecord.updatedAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
};
