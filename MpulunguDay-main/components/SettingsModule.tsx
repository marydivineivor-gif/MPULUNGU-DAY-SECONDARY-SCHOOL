import React, { useState, useEffect } from 'react';

interface SettingsModuleProps {
  schoolLogo: string;
  onLogoChange: (logo: string) => void;
  schoolName: string;
  onNameChange: (name: string) => void;
  schoolMotto: string;
  onMottoChange: (motto: string) => void;
  schoolContact: string;
  onContactChange: (contact: string) => void;
  isSyncing: boolean;
  onSync: () => void;
  onFetch: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  schoolLogo, onLogoChange, 
  schoolName, onNameChange, 
  schoolMotto, onMottoChange, 
  schoolContact, onContactChange,
  isSyncing, onSync, onFetch
}) => {
  const [localName, setLocalName] = useState(schoolName);
  const [localMotto, setLocalMotto] = useState(schoolMotto);
  const [localContact, setLocalContact] = useState(schoolContact);
  const [isSaving, setIsSaving] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    setLocalName(schoolName);
    setLocalMotto(schoolMotto);
    setLocalContact(schoolContact);
  }, [schoolName, schoolMotto, schoolContact]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onNameChange(localName);
      onMottoChange(localMotto);
      onContactChange(localContact);
      setTimeout(() => setIsSaving(false), 500);
    } catch (err) {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onLogoChange(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Institution Setup</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure global branding and school profile</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3 ${
              isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSyncing ? <><i className="fas fa-circle-notch animate-spin"></i> Syncing...</> : <><i className="fas fa-cloud-upload-alt"></i> Sync to Cloud</>}
          </button>
          <button 
            onClick={onFetch}
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3"
          >
            <i className="fas fa-cloud-download-alt"></i> Fetch Cloud Data
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3 ${
              isSaving ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSaving ? <><i className="fas fa-circle-notch animate-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Profile</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl space-y-6">
             <div className="flex items-center gap-4 mb-2">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs text-white shadow-lg font-black">1</span>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">School Identity</h3>
             </div>
             <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Official Name</label>
                   <input value={localName} onChange={(e) => setLocalName(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-blue-600 transition-all" placeholder="School Name" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Motto</label>
                   <input value={localMotto} onChange={(e) => setLocalMotto(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-600 transition-all" placeholder="Motto" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Contact</label>
                   <input value={localContact} onChange={(e) => setLocalContact(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm text-white font-mono outline-none focus:border-blue-600 transition-all" placeholder="+260..." />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-8">
            <div className="flex items-center gap-4 w-full mb-2">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs text-white shadow-lg font-black">2</span>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Brand Mark</h3>
            </div>
            <div className="aspect-square w-64 bg-slate-950 border-2 border-dashed border-slate-800 rounded-[40px] flex items-center justify-center overflow-hidden relative group">
              {schoolLogo ? (
                <>
                  <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain p-8 bg-white" />
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <button onClick={() => onLogoChange('')} className="bg-rose-600 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center"><i className="fas fa-trash-alt"></i></button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 space-y-2">
                  <i className="fas fa-cloud-upload-alt text-3xl text-slate-700"></i>
                  <p className="text-[10px] text-slate-500 font-black uppercase">No Logo Set</p>
                </div>
              )}
            </div>
            <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-center py-5 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer border border-slate-700 transition-all active:scale-95">
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};