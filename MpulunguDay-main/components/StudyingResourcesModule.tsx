import React, { useState } from 'react';
import { Resource, Subject, ClassInfo, UserRole, Teacher, Student } from '../types';

interface StudyingResourcesModuleProps {
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  subjects: Subject[];
  classes: ClassInfo[];
  userRole: UserRole;
  userId: string;
  teachers: Teacher[];
  students: Student[];
}

export const StudyingResourcesModule: React.FC<StudyingResourcesModuleProps> = ({
  resources, setResources, subjects, classes, userRole, userId, teachers, students
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    fileName: '',
    fileType: '',
    fileData: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData({
          ...formData,
          fileName: file.name,
          fileType: file.type,
          fileData: base64
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileData) {
      alert("Please select a file to upload.");
      return;
    }

    const newResource: Resource = {
      id: `RES-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      subjectId: formData.subjectId,
      classId: formData.classId,
      teacherId: userId,
      fileName: formData.fileName,
      fileType: formData.fileType,
      fileData: formData.fileData,
      uploadDate: new Date().toISOString()
    };

    setResources([newResource, ...resources]);
    setShowUploadModal(false);
    setFormData({ title: '', description: '', subjectId: '', classId: '', fileName: '', fileType: '', fileData: '' });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) return;
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const handleDownload = (resource: Resource) => {
    const link = document.createElement('a');
    link.href = resource.fileData;
    link.download = resource.fileName;
    link.click();
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || r.subjectId === selectedSubject;
    const matchesClass = !selectedClass || r.classId === selectedClass;
    
    // For students, filter by their class
    if (userRole === 'STUDENT') {
      const student = students.find(s => s.id === userId);
      return matchesSearch && matchesSubject && r.classId === student?.class;
    }

    return matchesSearch && matchesSubject && matchesClass;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Study Hub</h2>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Learning Resources</p>
        </div>
        
        {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-cloud-upload-alt"></i> Upload Material
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input 
              type="text" 
              placeholder="Search resources..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-12 text-sm text-white outline-none focus:border-blue-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-600"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {userRole !== 'STUDENT' && (
          <div>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-600"
            >
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map(resource => {
          const subject = subjects.find(s => s.id === resource.subjectId);
          const teacher = teachers.find(t => t.id === resource.teacherId);
          return (
            <div key={resource.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-blue-500/50 transition-all flex flex-col shadow-xl">
               <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                    {subject?.name || 'Resource'}
                  </span>
                  <p className="text-[9px] font-mono text-slate-600 font-bold">{new Date(resource.uploadDate).toLocaleDateString()}</p>
               </div>
               <h3 className="text-white font-black text-lg uppercase leading-tight mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">{resource.title}</h3>
               <p className="text-slate-400 text-xs font-medium line-clamp-2 mb-6 h-8">{resource.description || 'No detailed description available.'}</p>
               
               <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500">
                    <i className={`fas ${resource.fileType.includes('pdf') ? 'fa-file-pdf text-rose-500' : 'fa-file-word text-blue-500'} text-xl`}></i>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black text-white truncate">{resource.fileName}</p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Shared by {teacher?.name || 'Institutional Staff'}</p>
                  </div>
               </div>

               <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => handleDownload(resource)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-download"></i> Download
                  </button>
                  {(userRole === 'ADMIN' || (userRole === 'TEACHER' && resource.teacherId === userId)) && (
                    <button 
                      onClick={() => handleDelete(resource.id)}
                      className="w-12 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all active:scale-90"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
               </div>
            </div>
          );
        })}

        {filteredResources.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-900/30">
            <i className="fas fa-book-open text-5xl text-slate-800 mb-6"></i>
            <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">No resources found for selection</p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Upload Study Material</h3>
                   <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">Add to institutional library</p>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <i className="fas fa-times"></i>
                </button>
             </div>

             <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Resource Title</label>
                      <input 
                        required 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-blue-600 transition-all" 
                        placeholder="e.g. Quantum Physics Notes" 
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Subject</label>
                        <select 
                          required 
                          value={formData.subjectId} 
                          onChange={e => setFormData({...formData, subjectId: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-600"
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Target Class</label>
                        <select 
                          required 
                          value={formData.classId} 
                          onChange={e => setFormData({...formData, classId: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-600"
                        >
                          <option value="">Select Class</option>
                          {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Description (Optional)</label>
                      <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white h-24 resize-none outline-none focus:border-blue-600" 
                        placeholder="Brief summary of the content..."
                      />
                   </div>
                   <div className="pt-4">
                      <label className="w-full h-32 flex flex-col items-center justify-center bg-slate-950 border-2 border-dashed border-slate-800 rounded-3xl cursor-pointer hover:border-blue-600 transition-all group overflow-hidden">
                        {formData.fileName ? (
                          <div className="text-center p-4">
                            <i className="fas fa-file-alt text-2xl text-blue-500 mb-2"></i>
                            <p className="text-xs font-black text-white truncate max-w-[200px]">{formData.fileName}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Ready to sync</p>
                          </div>
                        ) : (
                          <>
                            <i className="fas fa-folder-open text-2xl text-slate-700 group-hover:text-blue-500 transition-colors mb-2"></i>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Click to browse files</p>
                          </>
                        )}
                        <input type="file" className="hidden" onChange={handleFileChange} />
                      </label>
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Discard</button>
                   <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl shadow-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)]">Finalize Upload</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};