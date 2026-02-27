import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { ModuleType, Student, Teacher, Subject, Department, ClassInfo, ClassAllocation, ExamSession, StudentMark, OnlineExam, ExamSubmission, GradeScale, AuthUser, Resource, Announcement, AttendanceRecord, PeriodAllocation, PeriodSession, PeriodAttendance, FeeStructure, FeePayment, TeacherAttendance, TeachingFileRecord } from './types';
import { MODULES, MOCK_GRADE_SCALES } from './constants';
import { StudentModule } from './MpulunguDay-main/components/StudentModule';
import { TeacherModule } from './MpulunguDay-main/components/TeacherModule';
import { EnrollmentModule } from './MpulunguDay-main/components/EnrollmentModule';
import { TransferFormModule } from './MpulunguDay-main/components/TransferFormModule';
import { ExamAnalysisModule } from './MpulunguDay-main/components/ExamAnalysisModule';
import { ExamManagementModule } from './MpulunguDay-main/components/ExamManagementModule';
import { AcademicsModule } from './MpulunguDay-main/components/AcademicsModule';
import { AdmissionReceiptModule } from './MpulunguDay-main/components/AdmissionReceiptModule';
import { SettingsModule } from './MpulunguDay-main/components/SettingsModule';
import { RegisterModule } from './MpulunguDay-main/components/RegisterModule';
import { ClassModule } from './MpulunguDay-main/components/ClassModule';
import { AttendanceModule } from './MpulunguDay-main/components/AttendanceModule';
import { OnlineExamModule } from './MpulunguDay-main/components/OnlineExamModule';
import { LoginModule } from './MpulunguDay-main/components/LoginModule';
import { StudyingResourcesModule } from './MpulunguDay-main/components/StudyingResourcesModule';
import { AnnouncementModule } from './MpulunguDay-main/components/AnnouncementModule';
import { PeriodmeterModule } from './MpulunguDay-main/components/PeriodmeterModule';
import { FeeModule } from './MpulunguDay-main/components/FeeModule';
import { TeacherAttendanceModule } from './MpulunguDay-main/components/TeacherAttendanceModule';
import { TeachingFileModule } from './MpulunguDay-main/components/TeachingFileModule';
import { ProfileModule } from './MpulunguDay-main/components/ProfileModule';
import { BursaryModule } from './MpulunguDay-main/components/BursaryModule';

const safeJsonParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.HOME);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => 
    safeJsonParse('sms_auth_user', null)
  );
  
  // Institutional Branding
  const [schoolLogo, setSchoolLogo] = useState(() => localStorage.getItem('sms_schoolLogo') || 'https://img.freepik.com/free-vector/school-building-with-green-lawn-trees-background_1308-41071.jpg');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('sms_schoolName') || 'MPULUNGU DAY SECONDARY SCHOOL');
  const [schoolMotto, setSchoolMotto] = useState(() => localStorage.getItem('sms_schoolMotto') || 'EDUCATION IS THE VANGUARD OF DEVELOPMENT');
  const [schoolContact, setSchoolContact] = useState(() => localStorage.getItem('sms_schoolContact') || '');

  // School Data States - Initialize from LocalStorage
  const [students, setStudents] = useState<Student[]>(() => safeJsonParse('sms_students', []));
  const [teachers, setTeachers] = useState<Teacher[]>(() => safeJsonParse('sms_teachers', []));
  const [subjects, setSubjects] = useState<Subject[]>(() => safeJsonParse('sms_subjects', []));
  const [departments, setDepartments] = useState<Department[]>(() => safeJsonParse('sms_departments', []));
  const [classes, setClasses] = useState<ClassInfo[]>(() => safeJsonParse('sms_classes', []));
  const [allocations, setAllocations] = useState<ClassAllocation[]>(() => safeJsonParse('sms_allocations', []));
  const [sessions, setSessions] = useState<ExamSession[]>(() => safeJsonParse('sms_sessions', []));
  const [marks, setMarks] = useState<StudentMark[]>(() => safeJsonParse('sms_marks', []));
  const [gradeScales, setGradeScales] = useState<GradeScale[]>(() => safeJsonParse('sms_gradeScales', MOCK_GRADE_SCALES));
  const [onlineExams, setOnlineExams] = useState<OnlineExam[]>(() => safeJsonParse('sms_onlineExams', []));
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() => safeJsonParse('sms_submissions', []));
  const [resources, setResources] = useState<Resource[]>(() => safeJsonParse('sms_resources', []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => safeJsonParse('sms_announcements', []));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => safeJsonParse('sms_attendance', []));
  const [periodAllocations, setPeriodAllocations] = useState<PeriodAllocation[]>(() => safeJsonParse('sms_period_allocations', []));
  const [periodSessions, setPeriodSessions] = useState<PeriodSession[]>(() => safeJsonParse('sms_period_sessions', []));
  const [periodAttendance, setPeriodAttendance] = useState<PeriodAttendance[]>(() => safeJsonParse('sms_period_attendance', []));
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => safeJsonParse('sms_fee_structures', []));
  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => safeJsonParse('sms_fee_payments', []));
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>(() => safeJsonParse('sms_teacher_attendance', []));
  const [teachingFileRecords, setTeachingFileRecords] = useState<TeachingFileRecord[]>(() => safeJsonParse('sms_teaching_file_records', []));

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncLocks = useRef<Record<string, boolean>>({});
  const pendingSyncs = useRef<Record<string, any[] | null>>({});

  // --- SUPABASE SYNC LOGIC ---
  const syncAllToCloud = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      // Helper to push a table with authoritative sync (handles deletions and large datasets)
      const push = async (table: string, data: any[]) => {
        // 1. Identify records to delete (Fetch ALL remote IDs using pagination)
        let remoteIds: string[] = [];
        let from = 0;
        const batchSize = 1000;
        let finished = false;
        
        while (!finished) {
          const { data: remoteBatch, error: fetchError, count } = await supabase
            .from(table)
            .select('id', { count: 'exact' })
            .range(from, from + batchSize - 1);
          
          if (fetchError) throw fetchError;
          if (remoteBatch && remoteBatch.length > 0) {
            remoteIds = [...remoteIds, ...remoteBatch.map(item => item.id)];
            if (remoteIds.length >= (count || 0) || remoteBatch.length < batchSize) {
              finished = true;
            } else {
              from += batchSize;
            }
          } else {
            finished = true;
          }
        }

        const localIds = new Set(data.map(item => item.id));
        const remoteIdsToDelete = remoteIds.filter(id => !localIds.has(id));

        if (remoteIdsToDelete.length > 0) {
          // Delete in batches of 100
          for (let i = 0; i < remoteIdsToDelete.length; i += 100) {
            const batch = remoteIdsToDelete.slice(i, i + 100);
            const { error: delError } = await supabase.from(table).delete().in('id', batch);
            if (delError) throw delError;
          }
        }

        // 2. Upsert local data in batches of 500
        if (data.length > 0) {
          for (let i = 0; i < data.length; i += 500) {
            const batch = data.slice(i, i + 500);
            const { error: upsertError } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
            if (upsertError) throw upsertError;
          }
        }
      };

      await Promise.all([
        push('students', students),
        push('teachers', teachers),
        push('subjects', subjects),
        push('departments', departments),
        push('classes', classes),
        push('allocations', allocations),
        push('exam_sessions', sessions),
        push('student_marks', marks),
        push('grade_scales', gradeScales),
        push('online_exams', onlineExams),
        push('exam_submissions', submissions),
        push('resources', resources),
        push('announcements', announcements),
        push('attendance', attendance),
        push('period_allocations', periodAllocations),
        push('period_sessions', periodSessions),
        push('period_attendance', periodAttendance),
        push('fee_structures', feeStructures),
        push('fee_payments', feePayments),
        push('teacher_attendance', teacherAttendance),
        push('teaching_file_records', teachingFileRecords)
      ]);
    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [
    students, teachers, subjects, departments, classes, allocations, sessions, marks, 
    gradeScales, onlineExams, submissions, resources, announcements, attendance, 
    periodAllocations, periodSessions, periodAttendance, feeStructures, feePayments, 
    teacherAttendance, teachingFileRecords, isSyncing
  ]);

  const fetchData = useCallback(async () => {
    try {
      const fetchTable = async (table: string) => {
        let allData: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let finished = false;

        while (!finished) {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .order('id', { ascending: true })
            .range(from, from + batchSize - 1);
          
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (allData.length >= (count || 0) || data.length < batchSize) {
              finished = true;
            } else {
              from += batchSize;
            }
          } else {
            finished = true;
          }
        }
        return allData;
      };

      const [
        s, t, sub, d, c, a, sess, m, gs, oe, es, r, ann, att, pa, ps, patt, fs, fp, ta, tfr
      ] = await Promise.all([
        fetchTable('students'), fetchTable('teachers'), fetchTable('subjects'),
        fetchTable('departments'), fetchTable('classes'), fetchTable('allocations'),
        fetchTable('exam_sessions'), fetchTable('student_marks'), fetchTable('grade_scales'),
        fetchTable('online_exams'), fetchTable('exam_submissions'), fetchTable('resources'),
        fetchTable('announcements'), fetchTable('attendance'), fetchTable('period_allocations'),
        fetchTable('period_sessions'), fetchTable('period_attendance'), fetchTable('fee_structures'),
        fetchTable('fee_payments'), fetchTable('teacher_attendance'), fetchTable('teaching_file_records')
      ]);

      // Only update state if cloud has data, or if local is empty
      // This prevents empty cloud from wiping out local data on first run
      if (s && s.length > 0) setStudents(s);
      if (t && t.length > 0) setTeachers(t);
      if (sub && sub.length > 0) setSubjects(sub);
      if (d && d.length > 0) setDepartments(d);
      if (c && c.length > 0) setClasses(c);
      if (a && a.length > 0) setAllocations(a);
      if (sess && sess.length > 0) setSessions(sess);
      if (m && m.length > 0) setMarks(m);
      if (gs && gs.length > 0) setGradeScales(gs);
      if (oe && oe.length > 0) setOnlineExams(oe);
      if (es && es.length > 0) setSubmissions(es);
      if (r && r.length > 0) setResources(r);
      if (ann && ann.length > 0) setAnnouncements(ann);
      if (att && att.length > 0) setAttendance(att);
      if (pa && pa.length > 0) setPeriodAllocations(pa);
      if (ps && ps.length > 0) setPeriodSessions(ps);
      if (patt && patt.length > 0) setPeriodAttendance(patt);
      if (fs && fs.length > 0) setFeeStructures(fs);
      if (fp && fp.length > 0) setFeePayments(fp);
      if (ta && ta.length > 0) setTeacherAttendance(ta);
      if (tfr && tfr.length > 0) setTeachingFileRecords(tfr);

    } catch (err: any) {
      console.error('Fetch Error:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-sync helper with race condition protection
  const autoSync = useCallback(async (table: string, data: any[]) => {
    if (syncLocks.current[table]) {
      pendingSyncs.current[table] = data;
      return;
    }
    
    syncLocks.current[table] = true;
    try {
      // 1. Identify records to delete (Fetch ALL remote IDs)
      let remoteIds: string[] = [];
      let from = 0;
      const batchSize = 1000;
      let finished = false;
      
      while (!finished) {
        const { data: remoteBatch, error: fetchError, count } = await supabase
          .from(table)
          .select('id', { count: 'exact' })
          .range(from, from + batchSize - 1);
        
        if (fetchError) throw fetchError;
        if (remoteBatch && remoteBatch.length > 0) {
          remoteIds = [...remoteIds, ...remoteBatch.map(item => item.id)];
          if (remoteIds.length >= (count || 0) || remoteBatch.length < batchSize) {
            finished = true;
          } else {
            from += batchSize;
          }
        } else {
          finished = true;
        }
      }

      const localIds = new Set(data.map(item => item.id));
      const remoteIdsToDelete = remoteIds.filter(id => !localIds.has(id));

      if (remoteIdsToDelete.length > 0) {
        for (let i = 0; i < remoteIdsToDelete.length; i += 100) {
          const batch = remoteIdsToDelete.slice(i, i + 100);
          await supabase.from(table).delete().in('id', batch);
        }
      }

      // 2. Upsert local data in batches
      if (data.length > 0) {
        for (let i = 0; i < data.length; i += 500) {
          const batch = data.slice(i, i + 500);
          await supabase.from(table).upsert(batch, { onConflict: 'id' });
        }
      }
    } catch (err) {
      console.error(`Auto-sync failed for ${table}:`, err);
    } finally {
      syncLocks.current[table] = false;
      if (pendingSyncs.current[table]) {
        const nextData = pendingSyncs.current[table]!;
        pendingSyncs.current[table] = null;
        autoSync(table, nextData);
      }
    }
  }, []);

  const pushTable = useCallback((table: string, currentData: any[]) => {
    const lsKeyMap: Record<string, string> = {
      'exam_sessions': 'sessions',
      'student_marks': 'marks',
      'period_allocations': 'period_allocations',
      'period_sessions': 'period_sessions',
      'period_attendance': 'period_attendance',
      'fee_structures': 'fee_structures',
      'fee_payments': 'fee_payments',
      'teacher_attendance': 'teacher_attendance',
      'teaching_file_records': 'teaching_file_records'
    };
    const lsKey = `sms_${lsKeyMap[table] || table}`;
    
    try {
      localStorage.setItem(lsKey, JSON.stringify(currentData));
    } catch (e) {
      console.warn(`LocalStorage full for ${lsKey}, relying on cloud sync.`);
    }

    // Also trigger a cloud sync for all institutional tables
    const syncableTables = [
      'students', 'teachers', 'subjects', 'departments', 'classes', 'allocations', 
      'exam_sessions', 'student_marks', 'grade_scales', 'online_exams', 'exam_submissions',
      'resources', 'announcements', 'attendance', 'period_allocations', 'period_sessions',
      'period_attendance', 'fee_structures', 'fee_payments', 'teacher_attendance', 'teaching_file_records'
    ];
    
    if (syncableTables.includes(table)) {
       autoSync(table, currentData);
    }
  }, [autoSync]);

  useEffect(() => { pushTable('students', students) }, [students, pushTable]);
  useEffect(() => { pushTable('teachers', teachers) }, [teachers, pushTable]);
  useEffect(() => { pushTable('subjects', subjects) }, [subjects, pushTable]);
  useEffect(() => { pushTable('departments', departments) }, [departments, pushTable]);
  useEffect(() => { pushTable('classes', classes) }, [classes, pushTable]);
  useEffect(() => { pushTable('allocations', allocations) }, [allocations, pushTable]);
  useEffect(() => { pushTable('exam_sessions', sessions) }, [sessions, pushTable]);
  useEffect(() => { pushTable('student_marks', marks) }, [marks, pushTable]);
  useEffect(() => { pushTable('grade_scales', gradeScales) }, [gradeScales, pushTable]);
  useEffect(() => { pushTable('online_exams', onlineExams) }, [onlineExams, pushTable]);
  useEffect(() => { pushTable('exam_submissions', submissions) }, [submissions, pushTable]);
  useEffect(() => { pushTable('resources', resources) }, [resources, pushTable]);
  useEffect(() => { pushTable('announcements', announcements) }, [announcements, pushTable]);
  useEffect(() => { pushTable('attendance', attendance) }, [attendance, pushTable]);
  useEffect(() => { pushTable('period_allocations', periodAllocations) }, [periodAllocations, pushTable]);
  useEffect(() => { pushTable('period_sessions', periodSessions) }, [periodSessions, pushTable]);
  useEffect(() => { pushTable('period_attendance', periodAttendance) }, [periodAttendance, pushTable]);
  useEffect(() => { pushTable('fee_structures', feeStructures) }, [feeStructures, pushTable]);
  useEffect(() => { pushTable('fee_payments', feePayments) }, [feePayments, pushTable]);
  useEffect(() => { pushTable('teacher_attendance', teacherAttendance) }, [teacherAttendance, pushTable]);
  useEffect(() => { pushTable('teaching_file_records', teachingFileRecords) }, [teachingFileRecords, pushTable]);

  useEffect(() => {
    localStorage.setItem('sms_schoolName', schoolName);
    localStorage.setItem('sms_schoolMotto', schoolMotto);
    localStorage.setItem('sms_schoolContact', schoolContact);
    localStorage.setItem('sms_schoolLogo', schoolLogo);
  }, [schoolName, schoolMotto, schoolContact, schoolLogo]);

  const handleLogout = () => {
    setAuthUser(null);
    setActiveModule(ModuleType.HOME);
    localStorage.removeItem('sms_auth_user');
  };

  const getVisibleModules = () => {
    if (!authUser) return [];
    const isHoD = departments.some(d => d.hodId === authUser.id);
    if (authUser.role === 'ADMIN') return MODULES;
    if (authUser.role === 'ATTENDANCE_OFFICER') return MODULES.filter(m => [ModuleType.ATTENDANCE, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER].includes(m.id));
    if (authUser.role === 'TEACHER') {
      const teacherModules = [ModuleType.EXAMS, ModuleType.RESOURCES, ModuleType.ATTENDANCE, ModuleType.REGISTER, ModuleType.CLASS, ModuleType.EMIS, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER, ModuleType.TEACHING_FILE, ModuleType.EXAM_ANALYSIS];
      if (isHoD) teacherModules.push(ModuleType.TEACHER_ATTENDANCE);
      return MODULES.filter(m => teacherModules.includes(m.id));
    }
    if (authUser.role === 'STUDENT') return MODULES.filter(m => [ModuleType.EXAMS, ModuleType.RESOURCES, ModuleType.EXAM_ANALYSIS, ModuleType.ATTENDANCE, ModuleType.ADMISSION_RECEIPT, ModuleType.EMIS, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER, ModuleType.FEES].includes(m.id));
    return [];
  };

  const currentStudentProfile = useMemo(() => 
    authUser?.role === 'STUDENT' ? students.find(s => s.id === authUser.id) : null
  , [authUser, students]);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      {authUser?.role === 'STUDENT' && currentStudentProfile && (
        <div className="bg-blue-950 border border-sky-500/20 p-8 rounded-[40px] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-sky-500/20 transition-all duration-700"></div>
          
          <div className="w-40 h-40 shrink-0 border-4 border-black rounded-3xl overflow-hidden shadow-2xl relative z-10 bg-black">
             {currentStudentProfile.photo ? (
               <img src={currentStudentProfile.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Student Photo" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-sky-700 bg-blue-950">
                 <i className="fas fa-user-graduate text-5xl"></i>
               </div>
             )}
          </div>

          <div className="flex-1 text-center md:text-left relative z-10">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-sky-400 transition-colors">
              Welcome Back, {currentStudentProfile.name}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <span className="px-4 py-1.5 bg-sky-600/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Class: {currentStudentProfile.class}</span>
               <span className="px-4 py-1.5 bg-black text-slate-400 border border-blue-900 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">ID: {currentStudentProfile.id}</span>
               <span className="px-4 py-1.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Status: {currentStudentProfile.status}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Registered Students', val: students.length, icon: 'fa-user-graduate', color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Faculty Members', val: teachers.length, icon: 'fa-chalkboard-teacher', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Active Classes', val: classes.length, icon: 'fa-school', color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Published Exams', val: onlineExams.length, icon: 'fa-file-invoice', color: 'text-rose-400', bg: 'bg-rose-400/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-blue-950 border border-white/5 p-6 rounded-3xl shadow-xl flex items-center justify-between group hover:border-sky-500/30 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white tracking-tighter">{stat.val}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
           <div className="mb-6 flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Command Center</h3>
              <div className="h-px flex-1 mx-6 bg-white/5"></div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {getVisibleModules().map((module) => (
                <button 
                  key={module.id} 
                  onClick={() => setActiveModule(module.id)} 
                  className="bg-blue-950 border border-white/5 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:bg-sky-500 transition-all hover:-translate-y-1 shadow-lg overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 group-hover:bg-white/20"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest text-center px-4 leading-tight group-hover:scale-105 transition-transform">
                    {module.label}
                  </span>
                </button>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="mb-6 flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Feed</h3>
           </div>
           <div className="bg-blue-950 border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-4 bg-black/20 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-start mb-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${ann.targetType === 'GLOBAL' ? 'text-sky-400' : 'text-amber-500'}`}>{ann.targetType}</span>
                      <span className="text-[8px] font-mono text-slate-600">{new Date(ann.createdAt).toLocaleDateString()}</span>
                   </div>
                   <h4 className="text-xs font-bold text-white uppercase line-clamp-1">{ann.title}</h4>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-center text-[10px] font-black text-slate-600 uppercase py-10">No recent announcements</p>}
           </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!authUser) return null;
    switch (activeModule) {
      case ModuleType.HOME: return renderDashboard();
      case ModuleType.STUDENTS: return <StudentModule students={students} setStudents={setStudents} />;
      case ModuleType.TEACHERS: return <TeacherModule teachers={teachers} setTeachers={setTeachers} />;
      case ModuleType.EXAMS: return <ExamManagementModule students={students} setStudents={setStudents} sessions={sessions} setSessions={setSessions} marks={marks} setMarks={setMarks} subjects={subjects} classes={classes} allocations={allocations} schoolName={schoolName} schoolLogo={schoolLogo} gradeScales={gradeScales} setGradeScales={setGradeScales} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.RESOURCES: return <StudyingResourcesModule resources={resources} setResources={setResources} subjects={subjects} classes={classes} userRole={authUser.role} userId={authUser.id} teachers={teachers} students={students} />;
      case ModuleType.ANNOUNCEMENTS: return <AnnouncementModule announcements={announcements} setAnnouncements={setAnnouncements} userRole={authUser.role} userId={authUser.id} userName={authUser.name} classes={classes} allocations={allocations} students={students} />;
      case ModuleType.ENROLLMENT: return <EnrollmentModule students={students} />;
      case ModuleType.TRANSFER_FORM: return <TransferFormModule students={students} classes={classes} subjects={subjects} schoolName={schoolName} marks={marks} sessions={sessions} gradeScales={gradeScales} />;
      case ModuleType.EXAM_ANALYSIS: return <ExamAnalysisModule students={students} marks={marks} subjects={subjects} classes={classes} teachers={teachers} allocations={allocations} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.PAYMENT: return <AcademicsModule departments={departments} setDepartments={setDepartments} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} allocations={allocations} setAllocations={setAllocations} teachers={teachers} />;
      case ModuleType.REGISTER: return <RegisterModule students={students} classes={classes} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.CLASS: return <ClassModule students={students} classes={classes} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.ATTENDANCE: return <AttendanceModule students={students} classes={classes} schoolName={schoolName} userRole={authUser.role} userId={authUser.id} attendance={attendance} setAttendance={setAttendance} />;
      case ModuleType.ADMISSION_RECEIPT: return <AdmissionReceiptModule students={students} classes={classes} subjects={subjects} schoolLogo={schoolLogo} schoolName={schoolName} schoolMotto={schoolMotto} schoolContact={schoolContact} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.EMIS: return <OnlineExamModule exams={onlineExams} setExams={setOnlineExams} submissions={submissions} setSubmissions={setSubmissions} subjects={subjects} classes={classes} students={students} teachers={teachers} schoolName={schoolName} schoolLogo={schoolLogo} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.SETTINGS: return <SettingsModule schoolLogo={schoolLogo} onLogoChange={setSchoolLogo} schoolName={schoolName} onNameChange={setSchoolName} schoolMotto={schoolMotto} onMottoChange={setSchoolMotto} schoolContact={schoolContact} onContactChange={setSchoolContact} isSyncing={isSyncing} onSync={syncAllToCloud} onFetch={fetchData} />;
      case ModuleType.PERIODMETER: return <PeriodmeterModule allocations={periodAllocations} setAllocations={setPeriodAllocations} sessions={periodSessions} setSessions={setPeriodSessions} attendance={periodAttendance} setAttendance={setPeriodAttendance} teachers={teachers} classes={classes} subjects={subjects} userRole={authUser.role} userId={authUser.id} students={students} schoolName={schoolName} />;
      case ModuleType.FEES: return <FeeModule students={students} classes={classes} feeStructures={feeStructures} setFeeStructures={setFeeStructures} feePayments={feePayments} setFeePayments={setFeePayments} userRole={authUser.role} userId={authUser.id} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.TEACHER_ATTENDANCE: return <TeacherAttendanceModule teachers={teachers} attendance={teacherAttendance} setAttendance={setTeacherAttendance} departments={departments} userRole={authUser.role} userId={authUser.id} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.TEACHING_FILE: 
        const isHoD = departments.some(d => d.hodId === authUser.id);
        return <TeachingFileModule 
          userRole={authUser.role} 
          userId={authUser.id} 
          userName={authUser.name} 
          schoolName={schoolName} 
          schoolLogo={schoolLogo}
          records={teachingFileRecords} 
          setRecords={setTeachingFileRecords} 
          isHOD={isHoD} 
          teachers={teachers}
          allocations={allocations}
          subjects={subjects}
          classes={classes}
          marks={marks}
          setMarks={setMarks}
          sessions={sessions}
          periodAllocations={periodAllocations}
          periodSessions={periodSessions}
          setPeriodSessions={setPeriodSessions}
          periodAttendance={periodAttendance}
          setPeriodAttendance={setPeriodAttendance}
          students={students}
          departments={departments}
        />;
      case ModuleType.PROFILE:
        return <ProfileModule authUser={authUser} teachers={teachers} setTeachers={setTeachers} />;
      case ModuleType.BURSARIES_OVC:
        return <BursaryModule students={students} />;
      default: return null;
    }
  };

  if (!authUser) return <LoginModule onLogin={setAuthUser} students={students} teachers={teachers} schoolName={schoolName} schoolLogo={schoolLogo} />;

  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-sky-600/30">
      <header className="bg-black border-b border-blue-900 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => setActiveModule(ModuleType.HOME)}>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-sky-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <i className="fas fa-graduation-cap text-white text-base md:text-xl"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-lg font-black tracking-tighter text-white uppercase leading-none">{schoolName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {isSyncing ? (
                <div className="flex items-center gap-1.5"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-sky-500 rounded-full animate-pulse"></div><span className="text-[6px] md:text-[8px] font-black text-sky-500 uppercase tracking-widest">Pushing</span></div>
              ) : syncError ? (
                <div className="flex items-center gap-1.5"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-rose-500 rounded-full"></div><span className="text-[6px] md:text-[8px] font-black text-rose-500 uppercase tracking-widest">Sync Error</span></div>
              ) : (
                <div className="flex items-center gap-1.5"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-500 rounded-full"></div><span className="text-[6px] md:text-[8px] font-black text-emerald-500 uppercase tracking-widest">Secured</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-blue-950 px-2 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-blue-900">
           <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center text-[8px] md:text-[10px] font-black text-white shadow-lg relative uppercase">
              {currentStudentProfile?.photo ? <img src={currentStudentProfile.photo} className="w-full h-full object-cover" alt="User" /> : authUser.name.charAt(0)}
           </div>
           <div className="hidden sm:flex flex-col"><p className="text-[10px] font-black text-white leading-none uppercase">{authUser.name}</p><p className="text-[8px] font-bold text-sky-400 leading-none uppercase mt-1">{authUser.role}</p></div>
           
           {authUser.role === 'TEACHER' && (
             <button 
               onClick={() => setActiveModule(ModuleType.PROFILE)} 
               className={`ml-2 w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center transition-all ${
                 activeModule === ModuleType.PROFILE ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-400 hover:text-sky-400'
               }`} 
               title="Profile Settings"
             >
               <i className="fas fa-user-cog text-[10px] md:text-xs"></i>
             </button>
           )}

           <button onClick={handleLogout} className="ml-1 md:ml-3 w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-all flex items-center justify-center" title="Terminate Session"><i className="fas fa-power-off text-[10px] md:text-xs"></i></button>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="sm:hidden ml-1 w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
             <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-[10px]`}></i>
           </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-blue-950 border-l border-sky-500/20 p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 border-b border-white/5 pb-6">
              <div className="w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center text-xs font-black text-white uppercase">
                {currentStudentProfile?.photo ? <img src={currentStudentProfile.photo} className="w-full h-full object-cover" alt="User" /> : authUser.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-white uppercase leading-tight">{authUser.name}</p>
                <p className="text-[8px] font-bold text-sky-400 uppercase mt-1">{authUser.role}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              <button 
                onClick={() => { setActiveModule(ModuleType.HOME); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === ModuleType.HOME ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <i className="fas fa-th-large mr-3"></i> Dashboard
              </button>
              {getVisibleModules().map(m => (
                <button 
                  key={m.id}
                  onClick={() => { setActiveModule(m.id); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === m.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <i className="fas fa-circle-notch mr-3 text-[8px]"></i> {m.label}
                </button>
              ))}
            </div>

            <button onClick={handleLogout} className="mt-auto w-full bg-rose-600/10 text-rose-500 border border-rose-600/20 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <i className="fas fa-power-off"></i> Terminate Session
            </button>
          </div>
        </div>
      )}
      
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeModule !== ModuleType.HOME && (
          <button onClick={() => setActiveModule(ModuleType.HOME)} className="mb-6 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-sky-400 transition-colors group no-print">
            <i className="fas fa-arrow-left mr-3 group-hover:-translate-x-1 transition-transform"></i>
            Return to Dashboard
          </button>
        )}
        {renderContent()}
      </main>
      
      <footer className="bg-black border-t border-blue-900 px-6 py-6 text-center no-print">
        <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">
          Cloud Infrastructure Enabled &bull; {schoolName} SMS &bull; &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;