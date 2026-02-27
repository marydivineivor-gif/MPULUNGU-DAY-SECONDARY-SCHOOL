import React, { useState, useMemo } from 'react';
import { Announcement, UserRole, ClassInfo, ClassAllocation, Student } from '../types';

interface AnnouncementModuleProps {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  userRole: UserRole;
  userId: string;
  userName: string;
  classes: ClassInfo[];
  allocations: ClassAllocation[];
  students: Student[];
}

export const AnnouncementModule: React.FC<AnnouncementModuleProps> = ({
  announcements,
  setAnnouncements,
  userRole,
  userId,
  userName,
  classes,
  allocations,
  students,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetType: 'GLOBAL' as Announcement['targetType'],
    targetId: '' as string,
  });

  // Filter relevant announcements based on the user's role and identity
  const relevantAnnouncements = useMemo(() => {
    const sorted = [...announcements].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (userRole === 'ADMIN') return sorted;

    if (userRole === 'TEACHER') {
      return sorted.filter(a => 
        a.targetType === 'GLOBAL' || 
        (a.targetType === 'ROLE' && a.targetId === 'TEACHER') ||
        a.senderId === userId // My own announcements
      );
    }

    if (userRole === 'STUDENT') {
      const student = students.find(s => s.id === userId);
      return sorted.filter(a => 
        a.targetType === 'GLOBAL' || 
        (a.targetType === 'ROLE' && a.targetId === 'STUDENT') ||
        (a.targetType === 'CLASS' && a.targetId === student?.class)
      );
    }

    return sorted.filter(a => a.targetType === 'GLOBAL');
  }, [announcements, userRole, userId, students]);

  // For teachers, find classes they are assigned to
  const myClasses = useMemo(() => {
    if (userRole !== 'TEACHER') return [];
    const classIds = allocations
      .filter(a => a.teacherId === userId)
      .map(a => a.classId);
    return classes.filter(c => classIds.includes(c.id));
  }, [userRole, userId, allocations, classes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnouncement: Announcement = {
      id: `ANN-${Date.now()}`,
      title: formData.title,
      content: formData.content,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      targetType: formData.targetType,
      targetId: formData.targetType === 'GLOBAL' ? null : formData.targetId,
      createdAt: new Date().toISOString(),
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setShowCreateModal(false);
    setFormData({ title: '', content: '', targetType: 'GLOBAL', targetId: '' });
  };

  const handleDelete = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const getTargetLabel = (ann: Announcement) => {
    if (ann.targetType === 'GLOBAL') return 'Global Broadcast';
    if (ann.targetType === 'ROLE') return `${ann.targetId}s Only`;
    if (ann.targetType === 'CLASS') return `Class: ${ann.targetId}`;
    return 'Public';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Announcements</h2>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Communication Hub</p>
        </div>
        
        {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
          <button 
            onClick={() => {
              setShowCreateModal(true);
              // Default target for teachers is their first class if available
              if (userRole === 'TEACHER' && myClasses.length > 0) {
                setFormData(prev => ({ ...prev, targetType: 'CLASS', targetId: myClasses[0].name }));
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-bullhorn"></i> New Announcement
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
        {relevantAnnouncements.map((ann, idx) => (
          <div key={ann.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] group hover:border-blue-500/50 transition-all flex flex-col shadow-2xl relative overflow-hidden">
             {idx === 0 && (
               <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                 Latest
               </div>
             )}
             
             <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    ann.targetType === 'GLOBAL' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' :
                    ann.targetType === 'ROLE' ? 'bg-amber-600/10 text-amber-400 border-amber-500/20' :
                    'bg-green-600/10 text-green-400 border-green-500/20'
                  }`}>
                    {getTargetLabel(ann)}
                  </span>
                  <span className="bg-slate-950/50 px-3 py-1 rounded-full text-[8px] font-black text-slate-500 uppercase border border-slate-800">
                    {ann.senderRole}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-600 font-bold">{new Date(ann.createdAt).toLocaleString()}</span>
             </div>

             <h3 className="text-white font-black text-xl uppercase leading-tight mb-4 group-hover:text-blue-400 transition-colors">{ann.title}</h3>
             <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
             
             <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                      {ann.senderName.charAt(0)}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white uppercase leading-none">{ann.senderName}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Authorized Sender</p>
                   </div>
                </div>
                
                {ann.senderId === userId && (
                   <button 
                     onClick={() => handleDelete(ann.id)}
                     className="text-slate-600 hover:text-rose-500 transition-colors p-2"
                   >
                      <i className="fas fa-trash-alt"></i>
                   </button>
                )}
             </div>
          </div>
        ))}

        {relevantAnnouncements.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-900/30">
            <i className="fas fa-comment-slash text-5xl text-slate-800 mb-6"></i>
            <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">No official announcements found</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Create Broadcast</h3>
                   <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">Official Institutional Announcement</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <i className="fas fa-times"></i>
                </button>
             </div>

             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Announcement Title</label>
                      <input 
                        required 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-blue-600 transition-all" 
                        placeholder="e.g. End of Term Notice" 
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Audience Type</label>
                        <select 
                          required 
                          value={formData.targetType} 
                          onChange={e => {
                            const newType = e.target.value as Announcement['targetType'];
                            setFormData({
                              ...formData, 
                              targetType: newType, 
                              targetId: newType === 'ROLE' ? 'STUDENT' : (newType === 'CLASS' && myClasses.length > 0 ? myClasses[0].name : '')
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-600 font-bold"
                        >
                          {userRole === 'ADMIN' && <option value="GLOBAL">ALL STAFF & STUDENTS</option>}
                          {userRole === 'ADMIN' && <option value="ROLE">SPECIFIC ROLE</option>}
                          {(userRole === 'ADMIN' || userRole === 'TEACHER') && <option value="CLASS">SPECIFIC CLASS</option>}
                        </select>
                      </div>
                      
                      {formData.targetType !== 'GLOBAL' && (
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Select Target</label>
                          <select 
                            required 
                            value={formData.targetId} 
                            onChange={e => setFormData({...formData, targetId: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-600 font-bold uppercase"
                          >
                            {formData.targetType === 'ROLE' ? (
                              <>
                                <option value="STUDENT">STUDENTS ONLY</option>
                                <option value="TEACHER">TEACHERS ONLY</option>
                              </>
                            ) : (
                              <>
                                {(userRole === 'ADMIN' ? classes : myClasses).map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                                {(userRole === 'ADMIN' ? classes : myClasses).length === 0 && (
                                  <option disabled>No classes assigned</option>
                                )}
                              </>
                            )}
                          </select>
                        </div>
                      )}
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Broadcast Content</label>
                      <textarea 
                        required
                        value={formData.content} 
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white h-40 resize-none outline-none focus:border-blue-600" 
                        placeholder="Type your official message here..."
                      />
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Discard</button>
                   <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl shadow-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)]">Send Broadcast</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};