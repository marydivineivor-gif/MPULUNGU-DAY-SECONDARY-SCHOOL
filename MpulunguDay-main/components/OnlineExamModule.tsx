import React, { useState } from 'react';
import { OnlineExam, Question, ExamSubmission, Subject, ClassInfo, Student, Teacher, UserRole as GlobalUserRole } from '../types';

interface OnlineExamModuleProps {
  exams: OnlineExam[];
  setExams: React.Dispatch<React.SetStateAction<OnlineExam[]>>;
  submissions: ExamSubmission[];
  setSubmissions: React.Dispatch<React.SetStateAction<ExamSubmission[]>>;
  subjects: Subject[];
  classes: ClassInfo[];
  students: Student[];
  teachers: Teacher[];
  schoolName: string;
  schoolLogo: string;
  userRole: GlobalUserRole;
  userId: string;
}

type ViewState = 'LIST' | 'CREATE' | 'TAKE' | 'RESULTS';

export const OnlineExamModule: React.FC<OnlineExamModuleProps> = ({
  exams, setExams, submissions, setSubmissions, subjects, classes, students, teachers, schoolName, schoolLogo, userRole, userId
}) => {
  const [view, setView] = useState<ViewState>('LIST');
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Selection States
  const currentStudentId = userRole === 'STUDENT' ? userId : '';

  // --- TEACHER: EXAM CREATION STATE ---
  const [examForm, setExamForm] = useState<Partial<OnlineExam>>({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    questions: [],
    status: 'Draft'
  });

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'MCQ',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1
  });

  // --- STUDENT: EXAM TAKING STATE ---
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});

  const handleAddQuestion = () => {
    if (!currentQuestion.text || !currentQuestion.correctAnswer) {
      alert("Please complete the question and select a correct answer.");
      return;
    }

    if (editingQuestionId) {
      // Update existing question
      setExamForm(prev => ({
        ...prev,
        questions: (prev.questions || []).map(q => 
          q.id === editingQuestionId ? { ...currentQuestion, id: editingQuestionId } as Question : q
        )
      }));
      setEditingQuestionId(null);
    } else {
      // Add new question
      const newQ: Question = {
        ...currentQuestion as Question,
        id: `Q-${Date.now()}`
      };
      setExamForm(prev => ({
        ...prev,
        questions: [...(prev.questions || []), newQ]
      }));
    }

    // Reset question builder
    setCurrentQuestion({
      type: 'MCQ',
      text: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1
    });
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setCurrentQuestion({ ...q });
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm("Remove this question from the exam?")) {
      setExamForm(prev => ({
        ...prev,
        questions: prev.questions?.filter(q => q.id !== id)
      }));
      if (editingQuestionId === id) {
        setEditingQuestionId(null);
        setCurrentQuestion({
          type: 'MCQ',
          text: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          points: 1
        });
      }
    }
  };

  const handleEditExam = (exam: OnlineExam) => {
    setExamForm(exam);
    setView('CREATE');
  };

  const handleDeleteExam = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this exam?")) {
      setExams(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveExam = (status: 'Draft' | 'Published') => {
    if (!examForm.title || !examForm.subjectId || !examForm.classId) {
      alert("Please fill in the title, subject, and target class.");
      return;
    }

    if (examForm.id) {
      // Update existing exam
      setExams(prev => prev.map(e => e.id === examForm.id ? { ...examForm, status, teacherId: userId } as OnlineExam : e));
    } else {
      // Create new exam
      const newExam: OnlineExam = {
        ...examForm as OnlineExam,
        id: `EXM-${Date.now()}`,
        teacherId: userId,
        status,
        createdAt: new Date().toISOString(),
        questions: examForm.questions || []
      };
      setExams(prev => [newExam, ...prev]);
    }
    
    setView('LIST');
    setExamForm({ title: '', description: '', subjectId: '', classId: '', questions: [], status: 'Draft' });
    setEditingQuestionId(null);
  };

  const handleStartExam = (exam: OnlineExam) => {
    setActiveExamId(exam.id);
    setStudentAnswers({});
    setView('TAKE');
  };

  const handleSubmitExam = () => {
    const exam = exams.find(e => e.id === activeExamId);
    if (!exam) return;

    let score = 0;
    let totalPoints = 0;

    exam.questions.forEach(q => {
      totalPoints += q.points;
      if (studentAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        score += q.points;
      }
    });

    const submission: ExamSubmission = {
      id: `SUB-${Date.now()}`,
      examId: exam.id,
      studentId: currentStudentId,
      answers: studentAnswers,
      score,
      totalPoints,
      submittedAt: new Date().toISOString()
    };

    setSubmissions(prev => [submission, ...prev]);
    setView('RESULTS');
  };

  // --- RENDERERS ---

  const renderHeader = () => (
    <div className="flex flex-col items-center mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-6 mb-8 w-full max-w-4xl justify-center">
        <div className="w-24 h-24 bg-slate-900 border-2 border-slate-800 rounded-[32px] flex items-center justify-center overflow-hidden shadow-2xl shrink-0 group hover:border-blue-600/50 transition-all">
          {schoolLogo ? (
            <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain p-2 bg-white" />
          ) : (
            <i className="fas fa-university text-3xl text-slate-700"></i>
          )}
        </div>
        <div className="text-left">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            {schoolName}
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-12 bg-blue-600 rounded-full"></span>
            <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em]">Online Assessment Engine</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeacherList = () => {
    const filteredExams = userRole === 'ADMIN' ? exams : exams.filter(e => e.teacherId === userId);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Institutional Assessments</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage, Edit and Track Submissions</p>
           </div>
           {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
             <button onClick={() => {
               setExamForm({ title: '', description: '', subjectId: '', classId: '', questions: [], status: 'Draft' });
               setView('CREATE');
             }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all">
               + New Online Exam
             </button>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map(exam => {
            const subCount = submissions.filter(s => s.examId === exam.id).length;
            return (
              <div key={exam.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-blue-500/50 transition-all flex flex-col shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${exam.status === 'Published' ? 'bg-green-600/10 text-green-400 border-green-500/20' : 'bg-amber-600/10 text-amber-400 border-amber-500/20'}`}>
                      {exam.status}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditExam(exam)} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => handleDeleteExam(exam.id)} className="text-slate-500 hover:text-rose-500 transition-colors"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                 </div>
                 <h3 className="text-white font-black text-lg uppercase leading-tight mb-2 group-hover:text-blue-400 transition-colors">{exam.title}</h3>
                 <p className="text-slate-400 text-xs font-medium line-clamp-2 mb-4">{exam.description || 'No description provided.'}</p>
                 <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Questions</span>
                       <span className="text-sm font-black text-white">{exam.questions.length}</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Submissions</span>
                       <span className="text-sm font-black text-blue-400">{subCount}</span>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>

        {filteredExams.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
            <i className="fas fa-layer-group text-4xl text-slate-800 mb-4"></i>
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No assessments found. Create one to begin.</p>
          </div>
        )}
      </div>
    );
  };

  const renderStudentList = () => {
    const student = students.find(s => s.id === userId);
    if (!student) return <div>Data mismatch: Student profile not found.</div>;

    const availableExams = exams.filter(e => e.classId === student.class && e.status === 'Published');
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center mb-10">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Student Exam Portal</h2>
           <p className="text-xs text-blue-500 font-bold uppercase tracking-[0.2em] mt-2">Active Assessments for {student.class}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {availableExams.map(exam => {
            const hasSubmitted = submissions.find(s => s.examId === exam.id && s.studentId === userId);
            return (
              <div key={exam.id} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col group relative overflow-hidden">
                 {hasSubmitted && (
                   <div className="absolute top-0 right-0 p-4">
                      <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                        <i className="fas fa-check"></i>
                      </div>
                   </div>
                 )}
                 <h3 className="text-xl font-black text-white uppercase mb-2 group-hover:text-blue-400 transition-colors">{exam.title}</h3>
                 <div className="flex gap-4 mb-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                      {subjects.find(s => s.id === exam.subjectId)?.name || 'Subject'}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                      {exam.questions.length} Items
                    </span>
                 </div>
                 <p className="text-slate-400 text-sm font-medium mb-8 flex-1">{exam.description || 'Instructions provided by the subject teacher will appear here.'}</p>
                 
                 {hasSubmitted ? (
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Last Score</p>
                         <p className="text-2xl font-black text-white">{hasSubmitted.score} / {hasSubmitted.totalPoints}</p>
                      </div>
                      <button 
                        onClick={() => { setActiveExamId(exam.id); setView('RESULTS'); }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        View Review
                      </button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => handleStartExam(exam)}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                   >
                     Start Assessment
                   </button>
                 )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCreateExam = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-6 mb-8">
         <button onClick={() => { setView('LIST'); setEditingQuestionId(null); }} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700">
           <i className="fas fa-arrow-left"></i>
         </button>
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{examForm.id ? 'Edit Assessment' : 'Construct New Assessment'}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Metadata */}
        <div className="lg:col-span-1 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-2xl h-fit">
          <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">1. Header Information</h3>
          <div className="space-y-4">
             <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Exam Title</label>
                <input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-600" placeholder="Mid Term Physics" />
             </div>
             <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Target Subject</label>
                <select value={examForm.subjectId} onChange={e => setExamForm({...examForm, subjectId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none">
                   <option value="">Select Subject</option>
                   {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
             </div>
             <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Target Class</label>
                <select value={examForm.classId} onChange={e => setExamForm({...examForm, classId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none">
                   <option value="">Select Class</option>
                   {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
             </div>
             <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Instructions (Optional)</label>
                <textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white h-24 resize-none" placeholder="e.g. Attempt all questions..." />
             </div>
          </div>
        </div>

        {/* Step 2: Question Builder */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest">{editingQuestionId ? '2. Edit Question' : '2. Build Question Bank'}</h3>
              
              <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                 <div className="flex gap-4">
                    {(['MCQ', 'TrueFalse', 'ShortAnswer'] as Question['type'][]).map(type => (
                      <button 
                        key={type}
                        onClick={() => setCurrentQuestion({...currentQuestion, type, options: type === 'MCQ' ? (currentQuestion.options || ['', '', '', '']) : undefined})}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${currentQuestion.type === type ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}
                      >
                        {type}
                      </button>
                    ))}
                 </div>

                 <textarea 
                    value={currentQuestion.text} 
                    onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-white h-20 outline-none focus:border-blue-600" 
                    placeholder="Enter your question text here..."
                 />

                 {currentQuestion.type === 'MCQ' && (
                    <div className="grid grid-cols-2 gap-4">
                       {(currentQuestion.options || ['', '', '', '']).map((opt, i) => (
                         <div key={i} className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              name="correct" 
                              checked={currentQuestion.correctAnswer === opt && opt !== ''}
                              onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: opt})}
                              className="form-radio text-blue-600" 
                            />
                            <input 
                              value={opt} 
                              onChange={e => {
                                const newOpts = [...(currentQuestion.options || ['', '', '', ''])];
                                newOpts[i] = e.target.value;
                                setCurrentQuestion({...currentQuestion, options: newOpts});
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white" 
                              placeholder={`Option ${i+1}`}
                            />
                         </div>
                       ))}
                    </div>
                 )}

                 {currentQuestion.type === 'TrueFalse' && (
                    <div className="flex gap-6">
                       {['True', 'False'].map(val => (
                         <label key={val} className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="radio" 
                              name="tf" 
                              checked={currentQuestion.correctAnswer === val} 
                              onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: val})} 
                              className="form-radio text-blue-600"
                            />
                            <span className="text-white font-bold text-sm uppercase">{val}</span>
                         </label>
                       ))}
                    </div>
                 )}

                 {currentQuestion.type === 'ShortAnswer' && (
                    <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Expected Core Keyword (Case Insensitive)</label>
                       <input 
                          value={currentQuestion.correctAnswer} 
                          onChange={e => setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white" 
                          placeholder="Correct Answer..." 
                       />
                    </div>
                 )}

                 <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-500 uppercase">Points:</span>
                       <input type="number" value={currentQuestion.points} onChange={e => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 1})} className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center text-xs text-blue-400 font-black" />
                    </div>
                    <div className="flex gap-2">
                       {editingQuestionId && (
                         <button onClick={() => { setEditingQuestionId(null); setCurrentQuestion({ type: 'MCQ', text: '', options: ['', '', '', ''], correctAnswer: '', points: 1 }); }} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                           Cancel Edit
                         </button>
                       )}
                       <button onClick={handleAddQuestion} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">
                         {editingQuestionId ? 'Update Question' : 'Add to Exam'}
                       </button>
                    </div>
                 </div>
              </div>

              {/* Added Questions List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                 {examForm.questions?.map((q, i) => (
                   <div key={q.id} className={`bg-slate-950 p-4 rounded-xl border flex justify-between items-start transition-all ${editingQuestionId === q.id ? 'border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'border-slate-800'}`}>
                      <div className="flex gap-4">
                         <span className="w-6 h-6 rounded bg-blue-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                         <div>
                            <p className="text-white text-xs font-bold leading-tight mb-2">{q.text}</p>
                            <div className="flex gap-3">
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Type: {q.type}</span>
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Points: {q.points}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleEditQuestion(q)} className="text-slate-600 hover:text-blue-400 transition-colors">
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-slate-600 hover:text-rose-500 transition-colors">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Final Actions */}
              <div className="flex gap-4 pt-8 border-t border-slate-800">
                 <button onClick={() => handleSaveExam('Draft')} className="flex-1 py-4 bg-slate-950 text-slate-500 rounded-2xl border border-slate-800 font-black uppercase text-xs tracking-widest hover:text-white transition-all">
                   Save as Draft
                 </button>
                 <button onClick={() => handleSaveExam('Published')} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl shadow-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)]">
                   Finalize & Publish
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderTakeExam = () => {
    const exam = exams.find(e => e.id === activeExamId);
    if (!exam) return null;

    return (
      <div className="fixed inset-0 z-[200] bg-slate-100 flex flex-col items-center animate-in fade-in duration-500">
         <header className="w-full bg-slate-900 p-6 flex justify-between items-center shadow-xl">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-pen-nib"></i>
               </div>
               <div>
                  <h2 className="text-white font-black uppercase text-sm tracking-widest">{exam.title}</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">In Progress • MDS Online Assessment</p>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-slate-400 text-[9px] font-black uppercase">Questions Answered</p>
                  <p className="text-white font-black">{Object.keys(studentAnswers).length} / {exam.questions.length}</p>
               </div>
               <button onClick={() => { if(confirm("Discard exam? No data will be saved.")) setView('LIST'); }} className="text-slate-500 hover:text-white transition-colors">
                  <i className="fas fa-times text-xl"></i>
               </button>
            </div>
         </header>

         <main className="flex-1 w-full max-w-3xl py-12 px-6 overflow-y-auto space-y-12">
            {exam.questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-10 rounded-3xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-200 space-y-8 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                 <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <span className="bg-slate-900 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.points} Point Question</span>
                 </div>
                 
                 <h3 className="text-2xl font-black text-slate-800 leading-tight">{q.text}</h3>

                 <div className="space-y-3">
                    {q.type === 'MCQ' && q.options?.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => setStudentAnswers({...studentAnswers, [q.id]: opt})}
                        className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex justify-between items-center group ${studentAnswers[q.id] === opt ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                      >
                         <span className={`text-sm font-bold ${studentAnswers[q.id] === opt ? 'text-blue-700' : 'text-slate-600'}`}>{opt}</span>
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${studentAnswers[q.id] === opt ? 'border-blue-600 bg-blue-600' : 'border-slate-200'}`}>
                            {studentAnswers[q.id] === opt && <i className="fas fa-check text-[10px] text-white"></i>}
                         </div>
                      </button>
                    ))}

                    {q.type === 'TrueFalse' && (
                      <div className="grid grid-cols-2 gap-4">
                         {['True', 'False'].map(val => (
                           <button 
                              key={val}
                              onClick={() => setStudentAnswers({...studentAnswers, [q.id]: val})}
                              className={`p-6 rounded-3xl border-2 text-center transition-all flex flex-col items-center gap-3 ${studentAnswers[q.id] === val ? 'bg-blue-600 border-blue-700 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                           >
                              <i className={`fas ${val === 'True' ? 'fa-check-circle' : 'fa-times-circle'} text-2xl`}></i>
                              <span className="font-black uppercase text-xs tracking-widest">{val}</span>
                           </button>
                         ))}
                      </div>
                    )}

                    {q.type === 'ShortAnswer' && (
                      <input 
                        value={studentAnswers[q.id] || ''}
                        onChange={e => setStudentAnswers({...studentAnswers, [q.id]: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-lg font-bold text-slate-800 outline-none focus:border-blue-600 transition-all placeholder:text-slate-300"
                        placeholder="Type your answer here..."
                      />
                    )}
                 </div>
              </div>
            ))}

            <div className="pt-12 pb-24 text-center">
               <button 
                 onClick={handleSubmitExam}
                 className="bg-slate-900 hover:bg-black text-white px-16 py-6 rounded-[32px] text-lg font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group"
               >
                 Submit My Work <i className="fas fa-paper-plane ml-3 group-hover:translate-x-1 transition-transform"></i>
               </button>
               <p className="mt-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">Verify your answers before finishing.</p>
            </div>
         </main>
      </div>
    );
  };

  const renderResults = () => {
    const submission = submissions.find(s => s.examId === activeExamId && s.studentId === userId);
    const exam = exams.find(e => e.id === activeExamId);
    if (!submission || !exam) return null;

    const percentage = (submission.score / submission.totalPoints) * 100;

    return (
      <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500 bg-white rounded-[40px] shadow-2xl overflow-hidden text-slate-800 pb-12">
         <div className="bg-slate-900 p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <h2 className="text-white text-3xl font-black uppercase tracking-tighter mb-4 relative z-10">Assessment Report</h2>
            <div className="relative z-10">
               <div className="inline-block p-10 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-6 shadow-2xl">
                  <p className="text-white text-6xl font-black">{percentage.toFixed(0)}%</p>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Overall Score</p>
               </div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{submission.score} Correct of {exam.questions.length} Items</p>
            </div>
         </div>

         <div className="p-8 space-y-6">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Performance Breakdown</h3>
               <button onClick={() => setView('LIST')} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Back to Dashboard</button>
            </div>

            <div className="space-y-4">
               {exam.questions.map((q, i) => {
                 const studentAns = submission.answers[q.id];
                 const isCorrect = studentAns?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                 return (
                   <div key={q.id} className={`p-6 rounded-3xl border-2 flex items-start gap-5 transition-all ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-rose-50 border-rose-100'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isCorrect ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}`}>
                        <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'} text-[10px]`}></i>
                      </div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Question {i+1}</p>
                         <p className="text-sm font-bold text-slate-800 leading-tight mb-3">{q.text}</p>
                         <div className="flex gap-8">
                            <div>
                               <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Your Answer</span>
                               <span className={`text-[10px] font-black uppercase ${isCorrect ? 'text-green-600' : 'text-rose-600'}`}>{studentAns || 'Skipped'}</span>
                            </div>
                            {!isCorrect && (
                              <div>
                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Correct Key</span>
                                <span className="text-[10px] font-black uppercase text-slate-800">{q.correctAnswer}</span>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col space-y-6">
      {view === 'LIST' && renderHeader()}

      {view === 'LIST' && (userRole === 'STUDENT' ? renderStudentList() : renderTeacherList())}
      {view === 'CREATE' && renderCreateExam()}
      {view === 'TAKE' && renderTakeExam()}
      {view === 'RESULTS' && renderResults()}
    </div>
  );
};
