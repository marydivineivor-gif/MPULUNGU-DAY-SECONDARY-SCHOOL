import { ModuleType, Student, Teacher, ExamSession, GradeScale, StudentMark, Subject, Department, ClassInfo, ClassAllocation } from './types';

export const MODULES = [
  { id: ModuleType.STUDENTS, label: 'ADD/CHECK STUDENTS' },
  { id: ModuleType.TEACHERS, label: 'ADD/CHECK TEACHERS' },
  { id: ModuleType.EXAMS, label: 'EXAM MANAGEMENT' },
  { id: ModuleType.RESOURCES, label: 'STUDYING RESOURCES' },
  { id: ModuleType.ANNOUNCEMENTS, label: 'OFFICIAL ANNOUNCEMENTS' },
  { id: ModuleType.FEES, label: 'FINANCE & FEES' },
  { id: ModuleType.ENROLLMENT, label: 'CURRENT ENROLMENT' },
  { id: ModuleType.PAYMENT, label: 'ACADEMICS AND CLASSES' },
  { id: ModuleType.ADMISSION_RECEIPT, label: 'ISSUE ADMISSION RECEIPT' },
  { id: ModuleType.ATTENDANCE, label: 'ATTENDANCE' },
  { id: ModuleType.EMIS, label: 'ONLINE EXAM' },
  { id: ModuleType.TRANSFER_FORM, label: 'ISSUE TRANSFER FORM' },
  { id: ModuleType.REGISTER, label: 'REGISTER' },
  { id: ModuleType.EXAM_ANALYSIS, label: 'EXAM ANALYSIS' },
  { id: ModuleType.CLASS, label: 'CLASS' },
  { id: ModuleType.PERIODMETER, label: 'PERIODMETER' },
  { id: ModuleType.TEACHER_ATTENDANCE, label: 'TEACHER REGISTER' },
  { id: ModuleType.TEACHING_FILE, label: 'TEACHING FILE' },
  { id: ModuleType.BURSARIES_OVC, label: 'BURSARIES/OVC' },
  { id: ModuleType.SETTINGS, label: 'SYSTEM SETTINGS' },
];

export const MOCK_STUDENTS: Student[] = [];
export const MOCK_TEACHERS: Teacher[] = [];
export const MOCK_SUBJECTS: Subject[] = [];
export const MOCK_DEPARTMENTS: Department[] = [];
export const MOCK_CLASSES: ClassInfo[] = [];
export const MOCK_ALLOCATIONS: ClassAllocation[] = [];
export const MOCK_EXAM_SESSIONS: ExamSession[] = [];

export const MOCK_GRADE_SCALES: GradeScale[] = [
  { id: 'G1', label: '1', minMark: 90, maxMark: 100, description: 'Distinction' },
  { id: 'G2', label: '2', minMark: 80, maxMark: 89, description: 'Excellent' },
  { id: 'G3', label: '3', minMark: 70, maxMark: 79, description: 'Merit' },
  { id: 'G4', label: '4', minMark: 60, maxMark: 69, description: 'Credit' },
  { id: 'G5', label: '5', minMark: 50, maxMark: 59, description: 'Good Pass' },
  { id: 'G6', label: '6', minMark: 45, maxMark: 49, description: 'Pass' },
  { id: 'G7', label: '7', minMark: 40, maxMark: 44, description: 'Weak Pass' },
  { id: 'G8', label: '8', minMark: 35, maxMark: 39, description: 'Very Weak' },
  { id: 'G9', label: '9', minMark: 0, maxMark: 34, description: 'Fail' },
  { id: 'GX', label: 'X', minMark: -1, maxMark: -1, description: 'Absent' },
];

export const MOCK_STUDENT_MARKS: StudentMark[] = [];