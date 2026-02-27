export interface Student {
  id: string; // Student Number MDS1...
  name: string;
  class: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  dateOfAdmission: string;
  club: string;
  guardianName: string;
  residentialAddress: string;
  contact: string;
  status: 'Active' | 'Alumni' | 'Transferred' | 'Dropped out';
  photo?: string;
  isOVC?: boolean;
  isKGS?: boolean;
  isCAMFED?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  status: 'P' | 'A' | 'L' | 'S' | null; // Present, Absent, Late, Sick
  conduct?: 'E' | 'G' | 'F' | 'P' | null;
}

export interface PeriodAllocation {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  weeklyTarget: number;
}

export interface PeriodSession {
  id: string;
  allocationId: string;
  date: string;
  periodsHeld: number; // usually 1, but could be double period
  recordedBy: string;
}

// Added PeriodAttendance interface to resolve import error in components
export interface PeriodAttendance {
  id: string;
  sessionId: string; // Links to PeriodSession.id
  studentId: string;
  status: 'P' | 'A';
}

// Added FeeStructure interface for financial management
export interface FeeStructure {
  id: string;
  className: string;
  term: string;
  tuition: number;
  pta: number;
  other: number;
}

// Added FeePayment interface for recording transactions
export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  category: 'Tuition' | 'PTA' | 'Uniform' | 'Other';
  date: string;
  term: string;
  recordedBy: string;
}

export interface ExamSession {
  id: string;
  name: string; // e.g., "End of Term 1"
  year: string;
  term: string;
}

export interface GradeScale {
  id: string;
  label: string; // A, B, C...
  minMark: number;
  maxMark: number;
  description: string;
}

export interface StudentMark {
  id: string;
  studentId: string;
  sessionId: string;
  subjectId: string; // Referenced by ID
  score: number;
  midTermMark?: number;
  endOfTermMark?: number;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'Reported' | 'Absent' | 'On Leave';
  recordedBy: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject?: string; // Primary subject
  email: string;
  contact: string;
  status: 'Active' | 'On Leave';
  username?: string;
  password?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  hodId: string; // Teacher ID
  teacherIds: string[]; // Teacher IDs
  subjectIds: string[]; // Subject IDs
}

export interface ClassInfo {
  id: string;
  name: string; // e.g. "Grade 10 A"
  gradeTeacherId: string; // Teacher ID
  subjectIds: string[]; // List of subjects taught in this class
}

export interface ClassAllocation {
  id: string;
  classId: string;
  teacherId: string;
  subjectId: string;
}

export interface Question {
  id: string;
  type: 'MCQ' | 'ShortAnswer' | 'TrueFalse';
  text: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  points: number;
}

export interface OnlineExam {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  questions: Question[];
  status: 'Draft' | 'Published';
  createdAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  score: number;
  totalPoints: number;
  submittedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  fileName: string;
  fileType: string;
  fileData: string; // Base64
  uploadDate: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  targetType: 'GLOBAL' | 'ROLE' | 'CLASS';
  targetId: string | null; // Role name or Class name/id
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ATTENDANCE_OFFICER';

export interface TeachingFileRecord {
  id: string;
  type: string;
  teacherId: string;
  data: any;
  status: 'Draft' | 'Submitted to HOD' | 'Submitted to Admin' | 'Approved' | 'Returned';
  createdAt: string;
  updatedAt: string;
  hodComment?: string;
  adminComment?: string;
  isTaught?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  emailOrId: string;
  role: UserRole;
  meta?: any; // Stores student class or teacher subjects
}

export enum ModuleType {
  HOME = 'HOME',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  EXAMS = 'EXAMS',
  FEES = 'FEES',
  ENROLLMENT = 'ENROLLMENT',
  PAYMENT = 'PAYMENT', 
  ADMISSION_RECEIPT = 'ADMISSION_RECEIPT',
  ATTENDANCE = 'ATTENDANCE',
  EMIS = 'EMIS',
  TRANSFER_FORM = 'TRANSFER_FORM',
  REGISTER = 'REGISTER',
  EXAM_ANALYSIS = 'EXAM_ANALYSIS',
  CLASS = 'CLASS',
  SETTINGS = 'SETTINGS',
  RESOURCES = 'RESOURCES',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
  PERIODMETER = 'PERIODMETER',
  TEACHING_FILE = 'TEACHING_FILE',
  BURSARIES_OVC = 'BURSARIES_OVC',
  PROFILE = 'PROFILE'
}
