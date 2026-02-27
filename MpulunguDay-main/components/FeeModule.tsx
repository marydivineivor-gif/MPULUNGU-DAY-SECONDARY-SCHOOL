import React, { useState, useMemo } from 'react';
import { Student, ClassInfo, FeeStructure, FeePayment, UserRole } from '../types';

interface FeeModuleProps {
  students: Student[];
  classes: ClassInfo[];
  feeStructures: FeeStructure[];
  setFeeStructures: React.Dispatch<React.SetStateAction<FeeStructure[]>>;
  feePayments: FeePayment[];
  setFeePayments: React.Dispatch<React.SetStateAction<FeePayment[]>>;
  userRole: UserRole;
  userId: string;
  schoolName: string;
  schoolLogo: string;
}

type Tab = 'PAYMENTS' | 'STRUCTURE' | 'REPORTS' | 'STUDENT_LEDGER';

export const FeeModule: React.FC<FeeModuleProps> = ({
  students, classes, feeStructures, setFeeStructures, feePayments, setFeePayments, userRole, userId, schoolName, schoolLogo
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(userRole === 'STUDENT' ? 'STUDENT_LEDGER' : 'PAYMENTS');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showReceipt, setShowReceipt] = useState<FeePayment | null>(null);

  // --- FORM STATES ---
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    amount: 0,
    category: 'Tuition' as FeePayment['category'],
    term: 'Term 1',
  });

  const [structureForm, setStructureForm] = useState({
    className: '',
    term: 'Term 1',
    tuition: 0,
    pta: 0,
    other: 0
  });

  const studentMap = useMemo(() => Object.fromEntries(students.map(s => [s.id, s])), [students]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId || paymentForm.amount <= 0) return alert("Select student and enter valid amount.");

    const newPayment: FeePayment = {
      id: `PAY-${Date.now()}`,
      ...paymentForm,
      date: new Date().toISOString().split('T')[0],
      recordedBy: userId
    };

    setFeePayments([newPayment, ...feePayments]);
    setPaymentForm({ studentId: '', amount: 0, category: 'Tuition', term: 'Term 1' });
    setShowReceipt(newPayment);
  };

  const handleAddStructure = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `FS-${structureForm.className.replace(/\s+/g, '')}-${structureForm.term}`;
    const newStruct: FeeStructure = { ...structureForm, id };
    setFeeStructures([...feeStructures.filter(f => f.id !== id), newStruct]);
    alert("Fee structure saved.");
  };

  const getStudentBalance = (studentId: string) => {
    const student = studentMap[studentId];
    if (!student) return 0;

    const termPayments = feePayments.filter(p => p.studentId === studentId);
    const paid = termPayments.reduce((sum, p) => sum + p.amount, 0);

    // Sum expected from all matching structures for this class
    const expected = feeStructures
      .filter(fs => fs.className === student.class)
      .reduce((sum, fs) => sum + fs.tuition + fs.pta + fs.other, 0);

    return expected - paid;
  };

  const renderReceipt = () => {
    if (!showReceipt) return null;
    const student = studentMap[showReceipt.studentId];
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white text-black p-10 rounded-xl max-w-2xl w-full shadow-2xl relative printable-card font-sans border-4 border-double border-black">
           <button onClick={() => setShowReceipt(null)} className="absolute top-4 right-4 text-slate-400 hover:text-black no-print"><i className="fas fa-times"></i></button>
           
           <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
              <div className="w-16 h-16">{schoolLogo && <img src={schoolLogo} className="w-full h-full object-contain" />}</div>
              <div className="text-center flex-1">
                 <h2 className="text-xl font-black uppercase tracking-tight leading-none">{schoolName}</h2>
                 <p className="text-[10px] font-bold uppercase text-slate-600 mt-1">Institutional Fee Receipt</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase">Receipt No:</p>
                 <p className="text-sm font-mono font-black">{showReceipt.id}</p>
              </div>
           </div>

           <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-x-8 text-xs font-black uppercase">
                 <p>Date: <span className="font-bold underline">{showReceipt.date}</span></p>
                 <p className="text-right">Term: <span className="font-bold underline">{showReceipt.term}</span></p>
                 <p className="mt-2">Student Name: <span className="font-bold underline">{student?.name}</span></p>
                 <p className="mt-2 text-right">Student ID: <span className="font-bold underline">{showReceipt.studentId}</span></p>
                 <p className="mt-2">Class: <span className="font-bold underline">{student?.class}</span></p>
                 <p className="mt-2 text-right">Category: <span className="font-bold underline">{showReceipt.category}</span></p>
              </div>
           </div>

           <div className="bg-slate-50 border-2 border-black p-6 mb-10">
              <div className="flex justify-between items-center">
                 <span className="text-sm font-black uppercase">Total Amount Paid:</span>
                 <span className="text-3xl font-black">K{showReceipt.amount.toLocaleString()}</span>
              </div>
           </div>

           <div className="flex justify-between items-end">
              <div className="text-[10px] font-black text-slate-500 uppercase">
                 <p>Generated by: System Audit</p>
                 <p>Officer ID: {showReceipt.recordedBy}</p>
              </div>
              <div className="text-center w-48 border-t border-black pt-2 font-black uppercase text-[10px]">
                 Authorized Stamp
              </div>
           </div>

           <div className="mt-8 no-print">
              <button onClick={() => window.print()} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">Print Official Copy</button>
           </div>
        </div>
      </div>
    );
  };

  const renderPayments = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-950/20 border border-sky-900/30 p-8 rounded-[32px] shadow-2xl">
             <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Payment Terminal</h3>
             <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Lookup</label>
                   <select value={paymentForm.studentId} onChange={e => setPaymentForm({...paymentForm, studentId: e.target.value})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none focus:border-sky-500 transition-all uppercase">
                      <option value="">Select Student...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (K)</label>
                      <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none" placeholder="0.00" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Session</label>
                      <select value={paymentForm.term} onChange={e => setPaymentForm({...paymentForm, term: e.target.value})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none">
                         <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Fee Category</label>
                   <select value={paymentForm.category} onChange={e => setPaymentForm({...paymentForm, category: e.target.value as any})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none">
                      <option>Tuition</option><option>PTA</option><option>Uniform</option><option>Other</option>
                   </select>
                </div>
                <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 mt-4">
                   Authorize Payment
                </button>
             </form>
          </div>
       </div>

       <div className="lg:col-span-2 bg-blue-950/20 border border-sky-900/30 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
          <div className="p-8 border-b border-sky-900/20 flex justify-between items-center bg-black/20">
             <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Financial Stream</h3>
             <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest bg-sky-900/20 px-3 py-1 rounded-full border border-sky-500/20">Live Audit</span>
          </div>
          <div className="table-container flex-1">
             <table className="w-full text-left min-w-[600px]">
                <thead className="bg-black/40 border-b border-sky-900/10">
                   <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase">Identity</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase">Category</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase text-right">Credit</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase text-center">Receipt</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-sky-900/10">
                   {feePayments.map(p => (
                      <tr key={p.id} className="hover:bg-sky-500/5 transition-all">
                         <td className="px-6 py-4">
                            <p className="text-xs font-black text-white uppercase">{studentMap[p.studentId]?.name || 'N/A'}</p>
                            <p className="text-[9px] text-slate-500 font-mono">{p.studentId}</p>
                         </td>
                         <td className="px-6 py-4 text-[10px] font-bold text-sky-400 uppercase">{p.category}</td>
                         <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{p.date}</td>
                         <td className="px-6 py-4 text-sm font-black text-white text-right">K{p.amount.toLocaleString()}</td>
                         <td className="px-6 py-4 text-center">
                            <button onClick={() => setShowReceipt(p)} className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-all"><i className="fas fa-print text-xs"></i></button>
                         </td>
                      </tr>
                   ))}
                   {feePayments.length === 0 && (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-600 uppercase font-black text-xs tracking-widest">No transaction records found.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const renderLedger = () => {
    const studentPayments = feePayments.filter(p => p.studentId === userId);
    const student = students.find(s => s.id === userId);
    const balance = getStudentBalance(userId);

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-950/20 border border-sky-900/30 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-wallet text-9xl text-sky-500"></i></div>
               <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2">Institutional Balance</p>
               <h3 className="text-5xl font-black text-white tracking-tighter">K{balance.toLocaleString()}</h3>
               <p className="text-[11px] font-bold text-slate-500 uppercase mt-4">Calculated against Termly Fee Structure</p>
            </div>
            <div className="bg-blue-950/20 border border-sky-900/30 p-10 rounded-[40px] shadow-2xl">
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Total Contributions</p>
               <h3 className="text-5xl font-black text-white tracking-tighter">K{studentPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</h3>
               <p className="text-[11px] font-bold text-slate-500 uppercase mt-4">Total payments recorded live in cloud</p>
            </div>
         </div>

         <div className="bg-blue-950/20 border border-sky-900/30 rounded-[40px] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-sky-900/20 flex justify-between items-center">
               <h3 className="text-sm font-black text-white uppercase tracking-widest">My Statement of Account</h3>
            </div>
            <div className="p-8 space-y-4">
               {studentPayments.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-6 bg-black/40 rounded-3xl border border-sky-900/10 hover:border-sky-500/30 transition-all group">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-sky-900/30 flex items-center justify-center text-sky-500 shadow-inner group-hover:scale-110 transition-transform">
                           <i className="fas fa-receipt"></i>
                        </div>
                        <div>
                           <p className="text-sm font-black text-white uppercase group-hover:text-sky-400 transition-colors">{p.category} Contribution</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{p.date} • {p.term}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-black text-emerald-500">+ K{p.amount.toLocaleString()}</p>
                        <button onClick={() => setShowReceipt(p)} className="text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors mt-1 underline">Download Receipt</button>
                     </div>
                  </div>
               ))}
               {studentPayments.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-sky-900/20 rounded-3xl">
                     <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">No payment history found.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    );
  };

  const renderStructure = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
       <div className="lg:col-span-1">
          <div className="bg-blue-950/20 border border-sky-900/30 p-8 rounded-[32px] shadow-2xl">
             <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Fee Definition</h3>
             <form onSubmit={handleAddStructure} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Grade Stream</label>
                   <select value={structureForm.className} onChange={e => setStructureForm({...structureForm, className: e.target.value})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none uppercase">
                      <option value="">Select Stream...</option>
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Term</label>
                   <select value={structureForm.term} onChange={e => setStructureForm({...structureForm, term: e.target.value})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none">
                      <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                   </select>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tuition Fees (K)</label>
                      <input type="number" value={structureForm.tuition} onChange={e => setStructureForm({...structureForm, tuition: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">PTA Contribution (K)</label>
                      <input type="number" value={structureForm.pta} onChange={e => setStructureForm({...structureForm, pta: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Other/Admin (K)</label>
                      <input type="number" value={structureForm.other} onChange={e => setStructureForm({...structureForm, other: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-sky-900/30 rounded-2xl p-4 text-xs text-white font-bold outline-none" />
                   </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all mt-4">
                   Save Fee Structure
                </button>
             </form>
          </div>
       </div>

       <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {feeStructures.map(fs => (
                <div key={fs.id} className="bg-blue-950/20 border border-sky-900/30 p-8 rounded-[32px] shadow-xl group hover:border-sky-500/30 transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5"><i className="fas fa-file-invoice-dollar text-6xl"></i></div>
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <h4 className="text-xl font-black text-white uppercase leading-none">{fs.className}</h4>
                         <p className="text-[10px] font-black text-sky-500 uppercase mt-1 tracking-widest">{fs.term} Cycle</p>
                      </div>
                      <button onClick={() => setFeeStructures(feeStructures.filter(f => f.id !== fs.id))} className="text-slate-700 hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400"><span>Tuition</span><span className="text-white">K{fs.tuition}</span></div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400"><span>PTA</span><span className="text-white">K{fs.pta}</span></div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400"><span>Admin</span><span className="text-white">K{fs.other}</span></div>
                      <div className="pt-3 border-t border-sky-900/20 flex justify-between">
                         <span className="text-[10px] font-black text-sky-500 uppercase">Total Expected</span>
                         <span className="text-lg font-black text-white">K{fs.tuition + fs.pta + fs.other}</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap gap-2 border-b border-sky-900/30 pb-6 no-print">
        {[
          { id: 'PAYMENTS', label: 'PAYMENT TERMINAL', icon: 'fa-cash-register', roles: ['ADMIN'] },
          { id: 'STRUCTURE', label: 'FEE SETTINGS', icon: 'fa-tools', roles: ['ADMIN'] },
          { id: 'REPORTS', label: 'FINANCIAL AUDIT', icon: 'fa-chart-pie', roles: ['ADMIN'] },
          { id: 'STUDENT_LEDGER', label: 'MY LEDGER', icon: 'fa-book-open', roles: ['STUDENT'] }
        ]
        .filter(tab => tab.roles.includes(userRole))
        .map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black transition-all uppercase tracking-[0.1em] ${
              activeTab === tab.id 
              ? 'bg-sky-500 text-white shadow-2xl shadow-sky-500/30' 
              : 'bg-black text-slate-500 hover:text-white border border-sky-900/30'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500">
         {activeTab === 'PAYMENTS' && renderPayments()}
         {activeTab === 'STRUCTURE' && renderStructure()}
         {activeTab === 'STUDENT_LEDGER' && renderLedger()}
         {activeTab === 'REPORTS' && (
           <div className="p-20 text-center bg-blue-950/10 border-2 border-dashed border-sky-900/20 rounded-[40px]">
              <i className="fas fa-file-invoice-dollar text-5xl text-sky-900/20 mb-6"></i>
              <p className="text-slate-600 uppercase font-black tracking-[0.3em] text-xs">Termly Financial Audit Engine Ready.</p>
              <p className="text-slate-700 text-[10px] mt-2 uppercase font-bold">Comprehensive yield analysis will appear here after sufficient data entry.</p>
           </div>
         )}
      </div>

      {renderReceipt()}
    </div>
  );
};