import React, { useState, useRef, useEffect } from 'react';
import { Pasti } from '../types';
import { 
  CheckCircle2, 
  Plus, 
  ShieldCheck, 
  Calendar, 
  Phone, 
  User, 
  X, 
  Lock, 
  AlertTriangle,
  Lightbulb,
  DoorOpen,
  Send,
  Loader2,
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackFormProps {
  pastis: Pasti[];
  submissions: any[];
  onSubmit: (data: any) => Promise<boolean>;
}

export default function FeedbackForm({ pastis, submissions, onSubmit }: FeedbackFormProps) {
  const [formData, setFormData] = useState<{
    id?: string;
    pastiId: string;
    name: string;
    headTeacher: string;
    phone: string;
    emergencyDoor: boolean;
    exitLight: boolean;
    lampuKecemasan: boolean;
    extinguisherExpiryDate: string;
    fireExtinguishers: { id: string; label: string; expiryDate: string }[];
    notificationReceived: string;
  }>({
    pastiId: '',
    name: '',
    headTeacher: '',
    phone: '',
    emergencyDoor: true, // Default to true (Ada)
    exitLight: true,     // Default to true (Ada)
    lampuKecemasan: true, // Default to true (Ada)
    extinguisherExpiryDate: '',
    fireExtinguishers: [
      { id: '1', label: 'Pemadam Api 1', expiryDate: '' }
    ],
    notificationReceived: 'BELUM DIHANTAR',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedSnapshot, setSubmittedSnapshot] = useState<any>(null);

  // Status check states
  const [searchQuery, setSearchQuery] = useState('');
  const [isStatusCheckerOpen, setIsStatusCheckerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isStatusCheckerOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isStatusCheckerOpen]);

  const handleSelectFromChecker = (pastiId: string, focusTeacher: boolean = false) => {
    // 1. Swap/populate form inputs
    handlePastiChange(pastiId);
    
    // 2. Scroll smoothly to Borang Maklum Balas
    setTimeout(() => {
      const formCard = document.getElementById('feedback-form-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // 3. Focus corresponding inputs to help the user directly fill the data
      if (focusTeacher) {
        const headTeacherInput = document.getElementById('input-headTeacher');
        if (headTeacherInput) {
          headTeacherInput.focus();
        }
      } else {
        const phoneInput = document.getElementById('input-phone');
        if (phoneInput) {
          phoneInput.focus();
        }
      }
    }, 150);
  };

  const filteredPastis = pastis.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePastiChange = (id: string) => {
    const pasti = pastis.find(p => p.id === id);
    if (pasti) {
      const existingSub = submissions.find(s => s.pastiId === id);
      if (existingSub) {
        setFormData({
          id: existingSub.id,
          pastiId: id,
          name: pasti.name,
          headTeacher: existingSub.headTeacher || pasti.headTeacher,
          phone: existingSub.phone || pasti.phone,
          emergencyDoor: existingSub.emergencyDoor === true || existingSub.emergencyDoor === 'ADA',
          exitLight: existingSub.exitLight === true || existingSub.exitLight === 'ADA',
          lampuKecemasan: existingSub.lampuKecemasan === undefined ? true : (existingSub.lampuKecemasan === true || existingSub.lampuKecemasan === 'ADA'),
          extinguisherExpiryDate: existingSub.extinguisherExpiryDate || '',
          fireExtinguishers: existingSub.fireExtinguishers && existingSub.fireExtinguishers.length > 0
            ? existingSub.fireExtinguishers
            : [{ id: '1', label: 'Pemadam Api 1', expiryDate: existingSub.extinguisherExpiryDate || '' }],
          notificationReceived: existingSub.notificationReceived || 'BELUM DIHANTAR',
        });
      } else {
        setFormData({
          id: undefined,
          pastiId: id,
          name: pasti.name,
          headTeacher: pasti.headTeacher,
          phone: pasti.phone,
          emergencyDoor: true,
          exitLight: true,
          lampuKecemasan: true,
          extinguisherExpiryDate: '',
          fireExtinguishers: [
            { id: '1', label: 'Pemadam Api 1', expiryDate: '' }
          ],
          notificationReceived: 'BELUM DIHANTAR',
        });
      }
    } else {
      setFormData({
        id: undefined,
        pastiId: '',
        name: '',
        headTeacher: '',
        phone: '',
        emergencyDoor: true,
        exitLight: true,
        lampuKecemasan: true,
        extinguisherExpiryDate: '',
        fireExtinguishers: [
          { id: '1', label: 'Pemadam Api 1', expiryDate: '' }
        ],
        notificationReceived: 'BELUM DIHANTAR',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const primaryExpiry = formData.fireExtinguishers[0]?.expiryDate || '';
    const payload = { 
      ...formData,
      extinguisherExpiryDate: primaryExpiry
    };
    const success = await onSubmit(payload);
    
    setIsSubmitting(false);
    if (success) {
      setSubmittedSnapshot(payload);
      setIsSubmitted(true);
      setShowToast(true);
      
      // Auto clear the form inputs
      setFormData({
        id: undefined,
        pastiId: '',
        name: '',
        headTeacher: '',
        phone: '',
        emergencyDoor: true,
        exitLight: true,
        lampuKecemasan: true,
        extinguisherExpiryDate: '',
        fireExtinguishers: [
          { id: '1', label: 'Pemadam Api 1', expiryDate: '' }
        ],
        notificationReceived: 'BELUM DIHANTAR',
      });

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 6000);
    } else {
      setErrorMsg('Gagal menghantar laporan keselamatan. Sila semak sambungan internet anda.');
    }
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setSubmittedSnapshot(null);
  };

  return (
    <div className="relative w-full max-w-[710px] mx-auto md:ml-[30px]">
      {/* SUCCESS FLOATING TOAST POPUP NOTIFICATION */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 p-4 max-w-sm flex items-start gap-3 shadow-emerald-950/20"
          >
            <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-100">Maklum Balas Diterima!</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Status keselamatan PASTI ({submittedSnapshot?.name}) berjaya direkodkan dalam pangkalan data.
              </p>
            </div>
            <button 
              onClick={() => setShowToast(false)} 
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isSubmitted && submittedSnapshot ? (
          /* CONFIRMATION SUMMARY PAGE (Borang Maklum Balas Berjaya Direkodkan) */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
          >
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Maklum Balas Berjaya Direkodkan</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Laporan dan status keselamatan prasekolah telah dihantar dan disimpan dengan selamat.
              </p>
            </div>

            {/* Submited Information Layout */}
            <div className="py-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Butiran Laporan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                  <User size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Prasekolah</span>
                    <strong className="text-sm text-slate-800">{submittedSnapshot.name}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                  <Phone size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Guru Kanan & Telefon</span>
                    <strong className="text-sm text-slate-800 block">{submittedSnapshot.headTeacher}</strong>
                    <span className="text-xs text-slate-500 font-mono">{submittedSnapshot.phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                  <DoorOpen size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pintu Kecemasan</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${submittedSnapshot.emergencyDoor ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${submittedSnapshot.emergencyDoor ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {submittedSnapshot.emergencyDoor ? 'Ada / Lengkap' : 'Tiada / Bermasalah'}
                    </span>
                  </div>
                </div>

                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                  <Lightbulb size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lampu Kecemasan (Exit)</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${submittedSnapshot.exitLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${submittedSnapshot.exitLight ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {submittedSnapshot.exitLight ? 'Ada / Lengkap' : 'Tiada / Bermasalah'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                  <Lightbulb size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lampu Kecemasan (Setiap Ruang)</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${submittedSnapshot.lampuKecemasan ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${submittedSnapshot.lampuKecemasan ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {submittedSnapshot.lampuKecemasan ? 'Ada' : 'Tiada'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Senarai Pemadam Api ({submittedSnapshot.fireExtinguishers?.length || 1})</span>
                      <div className="mt-2 text-xs space-y-1.5">
                        {submittedSnapshot.fireExtinguishers && submittedSnapshot.fireExtinguishers.length > 0 ? (
                          submittedSnapshot.fireExtinguishers.map((ext: any, idx: number) => (
                            <div key={ext.id || idx} className="flex justify-between items-center bg-white border border-slate-205 border-slate-200/60 p-2 rounded-lg">
                              <span className="font-semibold text-slate-800">{ext.label}</span>
                              <span className="font-mono bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">Luput: {ext.expiryDate || '-'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between items-center bg-white border p-2 rounded-lg">
                            <span className="font-semibold text-slate-800">Pemadam Api 1</span>
                            <span className="font-mono bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">Luput: {submittedSnapshot.extinguisherExpiryDate || '-'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION FOOTER: GOTO NEW FEEDBACK LINK-STYLE NAVIGATION */}
            <div className="mt-4 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-slate-300" />
                <span>ID Laporan tersimpan di penyulitan awan</span>
              </div>
              <div className="flex w-full sm:w-auto gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition-all group cursor-pointer text-sm"
                >
                  <span>Selesai</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/20 group cursor-pointer text-sm"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>Hantar Lagi</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* THE INPUT FORM SCREEN */
          <div className="space-y-6">
            {/* COLLAPSIBLE STATUS CHECK CARD */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
              <div 
                onClick={() => setIsStatusCheckerOpen(!isStatusCheckerOpen)}
                className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 select-none cursor-pointer border-b border-slate-100 transition-colors"
                id="status-checker-header"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                    <Search size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Semakan Senarai Penuh & Status</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Klik untuk menyemak senarai laporan & status</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {isStatusCheckerOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isStatusCheckerOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="p-5 border-t border-slate-50 overflow-hidden"
                  >
                    {/* Search bar inside status checker */}
                    <div className="relative mb-4">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        ref={searchInputRef}
                        placeholder="Taip untuk mencari nama PASTI..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-slate-200 pl-10 pr-10 py-2.5 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/25 focus:bg-white"
                      />
                      {searchQuery && (
                        <button 
                          type="button"
                          onClick={() => setSearchQuery('')} 
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Scrollable list of PASTI with checks */}
                    <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-105/50 pr-1">
                      {filteredPastis.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 font-normal">
                          Tiada PASTI ditemui padan dengan carian "{searchQuery}".
                        </div>
                      ) : (
                        filteredPastis.map(pasti => {
                          const existingReport = submissions.find(s => s.pastiId === pasti.id);
                          return (
                            <div key={pasti.id} className="py-3 flex items-center justify-between gap-3 text-xs leading-normal hover:bg-slate-50/30 px-1 rounded-lg transition-colors">
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-800 block truncate">{pasti.name}</span>
                                {existingReport ? (
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                      <Check size={10} strokeWidth={3} />
                                      Telah Dilaporkan
                                    </span>
                                    <span className="block text-[10px] text-slate-500 font-medium">
                                      Pintu: {existingReport.emergencyDoor === 'ADA' || existingReport.emergencyDoor === true ? '✅ ADA' : '❌ TIADA'} | Lampu Exit: {existingReport.exitLight === 'ADA' || existingReport.exitLight === true ? '✅ ADA' : '❌ TIADA'} | Lampu Ruang: {existingReport.lampuKecemasan === undefined || existingReport.lampuKecemasan === 'ADA' || existingReport.lampuKecemasan === true ? '✅ ADA' : '❌ TIADA'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                      Belum Dilaporkan
                                    </span>
                                    <span className="block text-[10px] text-slate-400 font-medium">
                                      Sedia untuk penghantaran laporan baru
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="shrink-0">
                                {existingReport ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectFromChecker(pasti.id, false)}
                                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer text-[10px]"
                                  >
                                    <Edit2 size={11} />
                                    <span>Kemaskini</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectFromChecker(pasti.id, true)}
                                    className="inline-flex items-center gap-1 bg-slate-150 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-all shrink-0 cursor-pointer text-[10px] sm:hover:text-amber-700 sm:hover:bg-amber-50 sm:hover:border-amber-200"
                                  >
                                    <Plus size={11} className="text-slate-500" />
                                    <span>Laporan Baru</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* THE INPUT FORM CARD */}
            <motion.div
              id="feedback-form-card"
              key="input-form-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-1">Borang Maklum Balas</h2>
              <p className="text-xs text-slate-400 mb-6 font-medium">Sila kemas kini laporan keselamatan PASTI anda.</p>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 text-rose-700 text-xs px-4 py-3 rounded-xl border border-rose-100 flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih PASTI (Atau masukkan manual):</label>
                <select 
                  value={formData.pastiId} 
                  onChange={(e) => handlePastiChange(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 p-2.5 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none mb-3 transition-all"
                >
                  <option value="">-- Pilih PASTI --</option>
                  {pastis.map(pasti => <option key={pasti.id} value={pasti.id}>{pasti.name}</option>)}
                </select>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nama PASTI" 
                    value={formData.name} 
                    onChange={e => {
                      const typedName = e.target.value;
                      // Try to match against existing submissions by name (case-insensitive, trimmed)
                      const matchedSub = submissions.find(
                        s => s.name?.trim().toLowerCase() === typedName.trim().toLowerCase()
                      );
                      if (matchedSub) {
                        setFormData({
                          ...formData,
                          id: matchedSub.id,
                          name: typedName,
                          headTeacher: matchedSub.headTeacher || formData.headTeacher,
                          phone: matchedSub.phone || formData.phone,
                          emergencyDoor: matchedSub.emergencyDoor === true || matchedSub.emergencyDoor === 'ADA',
                          exitLight: matchedSub.exitLight === true || matchedSub.exitLight === 'ADA',
                          lampuKecemasan: matchedSub.lampuKecemasan === undefined ? true : (matchedSub.lampuKecemasan === true || matchedSub.lampuKecemasan === 'ADA'),
                          extinguisherExpiryDate: matchedSub.extinguisherExpiryDate || '',
                          fireExtinguishers: matchedSub.fireExtinguishers && matchedSub.fireExtinguishers.length > 0
                            ? matchedSub.fireExtinguishers
                            : [{ id: '1', label: 'Pemadam Api 1', expiryDate: matchedSub.extinguisherExpiryDate || '' }],
                          notificationReceived: matchedSub.notificationReceived || 'BELUM DIHANTAR',
                        });
                      } else {
                        setFormData({
                          ...formData,
                          id: undefined,
                          name: typedName
                        });
                      }
                    }} 
                    className="w-full border border-slate-200 p-2.5 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                    required 
                  />
                  <input 
                    id="input-headTeacher"
                    type="text" 
                    placeholder="Nama Guru Kanan" 
                    value={formData.headTeacher} 
                    onChange={e => setFormData({...formData, headTeacher: e.target.value})} 
                    className="w-full border border-slate-200 p-2.5 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                    required 
                  />
                  <input 
                    id="input-phone"
                    type="text" 
                    placeholder="No. Telefon" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full border border-slate-200 p-2.5 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                    required 
                  />
                </div>
              </div>
              
              {formData.id && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200/65 rounded-2xl p-4 text-xs text-amber-850 flex items-start gap-3 shadow-xs"
                >
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 animate-pulse" size={16} />
                  <div>
                    <strong className="block font-bold text-amber-900">Rekod Laporan Sedia Ada Ditemui (Mod Kemaskini)</strong>
                    <span className="leading-relaxed mt-0.5 block text-slate-600 font-medium">
                      PASTI ini telah mempunyai rekod saringan keselamatan sebelum ini. Sebarang perubahan yang dilakukan akan <strong>mengemas kini</strong> rekod asal bagi mengelakkan pertindihan data.
                    </span>
                  </div>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="p-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pintu Kecemasan:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="emergencyDoor" 
                        checked={formData.emergencyDoor} 
                        onChange={() => setFormData({...formData, emergencyDoor: true})} 
                        className="text-emerald-600 focus:ring-emerald-500"
                      /> 
                      <span>Ada</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="emergencyDoor" 
                        checked={!formData.emergencyDoor} 
                        onChange={() => setFormData({...formData, emergencyDoor: false})} 
                        className="text-emerald-600 focus:ring-emerald-500"
                      /> 
                      <span className="text-slate-500 font-medium">Tiada</span>
                    </label>
                  </div>
                </div>

                <div className="p-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lampu Keluar:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="exitLight" 
                        checked={formData.exitLight} 
                        onChange={() => setFormData({...formData, exitLight: true})} 
                        className="text-emerald-600 focus:ring-emerald-500"
                      /> 
                      <span>Ada</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="exitLight" 
                        checked={!formData.exitLight} 
                        onChange={() => setFormData({...formData, exitLight: false})} 
                        className="text-emerald-600 focus:ring-emerald-500"
                      /> 
                      <span className="text-slate-500 font-medium">Tiada</span>
                    </label>
                  </div>
                </div>

                <div className="p-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lampu Kecemasan (Setiap Ruang):</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="lampuKecemasan" 
                        checked={formData.lampuKecemasan} 
                        onChange={() => setFormData({...formData, lampuKecemasan: true})} 
                        className="text-emerald-600 focus:ring-emerald-500"
                      /> 
                      <span>Ada</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="lampuKecemasan" 
                        checked={!formData.lampuKecemasan} 
                        onChange={() => setFormData({...formData, lampuKecemasan: false})} 
                        className="text-emerald-600 focus:ring-emerald-500"
                      /> 
                      <span className="text-slate-500 font-medium">Tiada</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Senarai Unit Pemadam Api & Tarikh Luput:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = String(formData.fireExtinguishers.length + 1);
                      setFormData({
                        ...formData,
                        fireExtinguishers: [
                          ...formData.fireExtinguishers,
                          { id: nextId, label: `Pemadam Api ${nextId}`, expiryDate: '' }
                        ]
                      });
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100/70 px-2.5 py-1.5 rounded-lg border border-emerald-200 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Plus size={12} strokeWidth={3} />
                    <span>Tambah Pemadam Api</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.fireExtinguishers.map((ext, idx) => (
                    <div key={ext.id} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                      <div className="w-full sm:w-1/3">
                        <input 
                          type="text" 
                          placeholder="cth: Pemadam 1 (Debu)" 
                          value={ext.label} 
                          onChange={(e) => {
                            const updated = formData.fireExtinguishers.map(item => 
                              item.id === ext.id ? { ...item, label: e.target.value } : item
                            );
                            setFormData({ ...formData, fireExtinguishers: updated });
                          }}
                          className="w-full border border-slate-200 bg-white p-2 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-semibold"
                          required 
                        />
                      </div>
                      <div className="w-full sm:flex-1">
                        <input 
                          type="date" 
                          value={ext.expiryDate} 
                          onChange={(e) => {
                            const updated = formData.fireExtinguishers.map(item => 
                              item.id === ext.id ? { ...item, expiryDate: e.target.value } : item
                            );
                            setFormData({ ...formData, fireExtinguishers: updated });
                          }}
                          className="w-full border border-slate-200 bg-white p-2 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                          required 
                        />
                      </div>
                      {formData.fireExtinguishers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.fireExtinguishers.filter(item => item.id !== ext.id);
                            setFormData({ ...formData, fireExtinguishers: updated });
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0 border border-transparent hover:border-rose-100"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 active:bg-slate-950 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-emerald-400" />
                    <span>Sedang Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} className="text-emerald-400" />
                    <span>Hantar Maklum Balas</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

