import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  MessageSquare, 
  ChevronRight, 
  X, 
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  Sparkles,
  Copy,
  Check,
  Trash,
  Image
} from 'lucide-react';
import ReportStatus from './ReportStatus';
import { Pasti, Submission } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  isAdmin: boolean;
  pastis: Pasti[];
  submissions: Submission[];
  onUpdateStatus?: (submissionId: string, field: 'emergencyDoor' | 'exitLight' | 'lampuKecemasan' | 'notificationReceived', value: string) => Promise<boolean>;
  onDeleteSubmission?: (submissionId: string) => Promise<boolean>;
  onDeleteMultiple?: (ids: string[]) => Promise<boolean>;
  onClearAllSubmissions?: () => Promise<boolean>;
}

export default function Dashboard({ isAdmin, pastis, submissions, onUpdateStatus, onDeleteSubmission, onDeleteMultiple, onClearAllSubmissions }: DashboardProps) {
  // Local state to keep track of loading updates for single items
  const [updatingIdField, setUpdatingIdField] = useState<string | null>(null);
  
  // Deletion confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single' | 'bulk' | 'all', id?: string, ids?: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // WhatsApp reminder logic state
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<Set<1 | 2 | 3>>(new Set([1]));

  // Photo Gallery State
  const [photoGallerySub, setPhotoGallerySub] = useState<Submission | null>(null);


  // Group / Bulk selection states
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);
  const [bulkReminderType, setBulkReminderType] = useState<1 | 2 | 3 | 'dynamic'>('dynamic');
  const [copied, setCopied] = useState(false);
  
  const [viewDemoData, setViewDemoData] = useState(false);

  // Helper to safely unpack state
  const normalizeStatus = (val: boolean | string | undefined): string => {
    if (val === true || val === 'ADA' || val === 'Ada') return 'ADA';
    if (val === false || val === 'TIADA' || val === 'Tiada') return 'TIADA';
    if (val === 'SEDANG DIPROSES') return 'SEDANG DIPROSES';
    if (val === 'MENUNGGU TECHNICIAN' || val === 'MENUNGGU TEKNISIAN') return 'MENUNGGU TECHNICIAN';
    return 'TIADA';
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'ADA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20';
      case 'SEDANG DIPROSES':
        return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20';
      case 'MENUNGGU TECHNICIAN':
        return 'bg-sky-50 text-sky-700 border-sky-200 focus:ring-sky-500/20';
      case 'TIADA':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20';
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    let success = false;
    
    if (deleteConfirm.type === 'single' && deleteConfirm.id && onDeleteSubmission) {
        success = await onDeleteSubmission(deleteConfirm.id);
    } else if (deleteConfirm.type === 'bulk' && deleteConfirm.ids && onDeleteMultiple) {
        success = await onDeleteMultiple(deleteConfirm.ids);
        setSelectedSubIds([]);
    } else if (deleteConfirm.type === 'all' && onClearAllSubmissions) {
        success = await onClearAllSubmissions();
    }
    
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  // Helper for notificationReceived normalization
  const normalizeNotification = (val: string | undefined): string => {
    if (!val) return 'BELUM DIHANTAR';
    const normalized = val.trim().toUpperCase();
    if (normalized === 'BELUM DIHANTAR' || normalized === 'BELUM_DIHANTAR' || normalized === 'BELUM') return 'BELUM DIHANTAR';
    if (normalized === 'DIHANTAR' || normalized === 'SENT' || normalized === 'SUDAH DIHANTAR') return 'DIHANTAR';
    if (normalized === 'TERIMA & NOTED' || normalized === 'TERIMA' || normalized === 'RECEIVED') return 'TERIMA & NOTED';
    if (normalized === 'TIADA RESPON' || normalized === 'NO RESPONSE' || normalized === 'TIADA_RESPON') return 'TIADA RESPON';
    return normalized;
  };

  const getNotificationStatusClasses = (status: string) => {
    switch (status) {
      case 'TERIMA & NOTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20';
      case 'DIHANTAR':
        return 'bg-sky-50 text-sky-700 border-sky-200 focus:ring-sky-500/20';
      case 'TIADA RESPON':
        return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20';
      case 'BELUM DIHANTAR':
      default:
        return 'bg-slate-50 text-slate-650 text-slate-605 border-slate-200 focus:ring-slate-500/20';
    }
  };

  const handleSelectChange = async (
    submissionId: string, 
    field: 'emergencyDoor' | 'exitLight' | 'lampuKecemasan' | 'notificationReceived', 
    newValue: string
  ) => {
    const key = `${submissionId}-${field}`;
    setUpdatingIdField(key);
    if (onUpdateStatus) {
      await onUpdateStatus(submissionId, field as any, newValue);
    }
    setUpdatingIdField(null);
  };

  const toggleIssueType = (type: 1 | 2 | 3) => {
    setSelectedIssueTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // WhatsApp reminder message builder
  const getMultiReminderMessage = (sub: Submission, issues: Set<1 | 2 | 3>): string => {
    const teacherName = (sub.headTeacher || 'Muallimah').toUpperCase();
    const pastiName = sub.name || 'PASTI';
    const expiryDate = sub.extinguisherExpiryDate || 'tarikh tamat';

    const parts: string[] = [];
    if (issues.has(1)) parts.push('🚪*PINTU KECEMASAN*');
    if (issues.has(2)) parts.push('🚨*LAMPU KELUAR (EXIT)*');
    if (issues.has(3)) parts.push(`🧯penyelenggaraan *PEMADAM API* (Tarikh Luput: *${expiryDate}*)`);

    if (parts.length === 0) return '';
    
    const combinedIssues = parts.length > 1
         ? parts.slice(0, -1).join(', ') + ' & ' + parts[parts.length - 1]
         : parts[0];

    return `Assalamualaikum
Muallimah ${teacherName}, pihak PASTI Kuala Langat ingin mengingatkan mengikut rekod keselamatan, PASTI *${pastiName}* memerlukan ${combinedIssues} demi keselamatan anak-anak. Mohon ambil tindakan segera. Terima kasih. 

Mohon kerjasama untuk reply : TERIMA & NOTED
_mesej dijana dari sistem oleh Keselamatan&Kesihatan Pasti Kuala Langat_`;
  };

  // WhatsApp combined message builder (multiple)
  const getCombinedReminderTemplate = (selectedSubs: Submission[], type: 1 | 2 | 3 | 'dynamic'): string => {
    const itemsText = selectedSubs.map((sub, idx) => {
      const pastiName = sub.name || 'PASTI';
      const teacherName = sub.headTeacher || 'Muallimah';
      const doorStatus = normalizeStatus(sub.emergencyDoor);
      const lightStatus = normalizeStatus(sub.exitLight);
      
      let deficiency = '';
      if (type === 1) {
        deficiency = `pemasangan *PINTU KECEMASAN*`;
      } else if (type === 2) {
        deficiency = `pemasangan *LAMPU KELUAR (EXIT)*`;
      } else if (type === 3) {
        deficiency = `penyelenggaraan *PEMADAM API* (Tarikh Luput: *${sub.extinguisherExpiryDate || 'tiada'}*)`;
      } else {
        const issues: string[] = [];
        if (doorStatus !== 'ADA') issues.push('*PINTU KECEMASAN*');
        if (lightStatus !== 'ADA') issues.push('*LAMPU KELUAR (EXIT)*');
        
        if (issues.length > 0) {
          deficiency = `tindakan segera untuk ${issues.join(' & ')}`;
        } else {
          deficiency = `pematuhan prasarana keselamatan`;
        }
      }
      
      return `${idx + 1}. *${pastiName}* (${teacherName}) - memerlukan ${deficiency}`;
    }).join('\n');

    return `Assalamualaikum Muallimah, pihak PASTI Kuala Langat ingin mengingatkan mengikut rekod keselamatan, berikut adalah senarai prasekolah PASTI yang memerlukan prasarana keselamatan demi keselamatan anak-anak:\n\n${itemsText}\n\nMohon ambil tindakan segera demi keselamatan anak-anak. Terima kasih. 

Mohon kerjasama untuk reply : TERIMA & NOTED
_mesej dijana dari sistem oleh Keselamatan&Kesihatan Pasti Kuala Langat_`;
  };

  const handleCopyCombinedText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean country code and produce a standard WA link
  const formatPhoneForWa = (phoneStr: string): string => {
    let cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '6' + cleaned;
    } else if (!cleaned.startsWith('60') && cleaned.startsWith('1')) {
      cleaned = '60' + cleaned;
    }
    return cleaned;
  };

  const handleSendWa = async () => {
    if (!selectedSub) return;
    const phone = formatPhoneForWa(selectedSub.phone);
    const text = encodeURIComponent(getMultiReminderMessage(selectedSub, selectedIssueTypes));
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, '_blank', 'referrer');
    
    if (onUpdateStatus) {
      await onUpdateStatus(selectedSub.id, 'notificationReceived', 'DIHANTAR');
    }
    
    setSelectedSub(null);
  };

  const filteredSubmissions = viewDemoData ? submissions.filter(s => s.isDemo) : submissions.filter(s => !s.isDemo);

  // Metrics summary computations
  const totalSubmissions = filteredSubmissions.length;
  const countAdaDoor = filteredSubmissions.filter(s => normalizeStatus(s.emergencyDoor) === 'ADA').length;
  const countAdaLight = filteredSubmissions.filter(s => normalizeStatus(s.exitLight) === 'ADA').length;
  const countAdaLampuKecemasan = filteredSubmissions.filter(s => normalizeStatus(s.lampuKecemasan) === 'ADA').length;

  return (
    <div className="w-full max-w-[710px] mx-auto md:ml-[30px] space-y-6">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Sparkles size={16} className={viewDemoData ? "text-amber-500" : "text-slate-400"} />
          <span>Mod Paparan Data:</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => {
              setViewDemoData(false);
              setSelectedSubIds([]);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!viewDemoData ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Data Live Asli
          </button>
          <button 
            onClick={() => {
              setViewDemoData(true);
              setSelectedSubIds([]);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewDemoData ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Data Demo
          </button>
        </div>
      </div>

      {/* Overview Cards Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-slate-105 bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Saringan</span>
            <strong className="text-sm font-bold text-slate-800 leading-none">{totalSubmissions} PASTI</strong>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ada Pintu Keluar</span>
            <strong className="text-sm font-bold text-slate-800 leading-none">{countAdaDoor} Lunas</strong>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-sky-50 p-2 rounded-lg text-sky-600 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lampu Exit</span>
            <strong className="text-sm font-bold text-slate-800 leading-none">{countAdaLight} Lunas</strong>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-purple-50 p-2 rounded-lg text-purple-600 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lampu Ruang</span>
            <strong className="text-sm font-bold text-slate-800 leading-none">{countAdaLampuKecemasan} Lunas</strong>
          </div>
        </div>
      </div>

      <ReportStatus pastis={pastis} submissions={filteredSubmissions} />

      {/* Selection Action Bar */}
      {selectedSubIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="bg-emerald-650 bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
              {selectedSubIds.length}
            </span>
            <span className="font-bold text-emerald-950">PASTI dipilih untuk peringatan kelompok</span>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedSubIds([])}
              className="text-slate-500 hover:text-slate-700 font-semibold px-2.5 py-1.5 hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setDeleteConfirm({ type: 'bulk', ids: selectedSubIds })}
                className="text-rose-600 hover:text-white hover:bg-rose-600 font-semibold px-2.5 py-1.5 border border-rose-200 hover:border-rose-600 rounded-lg transition-all cursor-pointer"
              >
                Padam ({selectedSubIds.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsBulkReminderOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>Gabung Peringatan ({selectedSubIds.length})</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Senarai Pemantauan Aktif</h1>
            <p className="text-xs text-slate-400">Status kelulusan prasarana dan pematuhan keselamatan terkini.</p>
          </div>
          <div className="flex items-center gap-2">
             {isAdmin && filteredSubmissions.length > 0 && (
                <button
                onClick={() => setDeleteConfirm({ type: 'all' })}
                className="text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer"
                >
                Clear All Data
                </button>
             )}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                <span>Kemas kini status automatik</span>
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[600px] border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-100">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredSubmissions.length > 0 && selectedSubIds.length === filteredSubmissions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubIds(filteredSubmissions.map(s => s.id));
                      } else {
                        setSelectedSubIds([]);
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </th>
                <th className="p-3 font-semibold">PASTI & Hubungan</th>
                <th className="p-3 font-semibold text-center w-36">Pintu Kecemasan</th>
                <th className="p-3 font-semibold text-center w-36">Lampu Keluar (EXIT)</th>
                <th className="p-3 font-semibold text-center w-36">Lampu Ruang</th>
                <th className="p-3 font-semibold text-center w-40">Notifikasi Diterima</th>
                <th className="p-3 font-semibold text-center">Pemadam (Exp)</th>
                {isAdmin && <th className="p-3 font-semibold text-center w-14">Gambar/Foto</th>}
                <th className="p-3 font-semibold text-center w-14">Hantar WA</th>
                {isAdmin && <th className="p-3 font-semibold text-center w-14">Admin</th>}
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 8} className="p-8 text-center text-slate-400 italic">
                    Tiada rekod saringan dijumpai.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub: Submission) => {
                  const doorStatus = normalizeStatus(sub.emergencyDoor);
                  const lightStatus = normalizeStatus(sub.exitLight);
                  const lampuStatus = normalizeStatus(sub.lampuKecemasan);
                  const isChecked = selectedSubIds.includes(sub.id);
                  
                  return (
                    <tr key={sub.id} className={`hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-emerald-55/15 bg-emerald-50/20 font-medium' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubIds([...selectedSubIds, sub.id]);
                            } else {
                              setSelectedSubIds(selectedSubIds.filter(id => id !== sub.id));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      {/* Name and Teacher Info */}
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block truncate max-w-[180px]" title={sub.name}>
                          {sub.name}
                        </span>
                        <div className="flex flex-col text-[10px] text-slate-400 mt-0.5">
                          <span className="font-medium text-slate-600 truncate max-w-[160px]">{sub.headTeacher}</span>
                          <span className="font-mono mt-0.5">{sub.phone || 'Tiada No. Tel'}</span>
                        </div>
                      </td>

                      {/* Interactive Emergency Door Status Select */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 relative">
                          {updatingIdField === `${sub.id}-emergencyDoor` && (
                            <Loader2 size={11} className="animate-spin text-slate-400 absolute -left-4" />
                          )}
                          <select
                            value={doorStatus}
                            onChange={(e) => handleSelectChange(sub.id, 'emergencyDoor', e.target.value)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border outline-none tracking-wide cursor-pointer transition-all ${getStatusClasses(doorStatus)}`}
                          >
                            <option value="ADA">ADA</option>
                            <option value="SEDANG DIPROSES">SEDANG DIPROSES</option>
                            <option value="MENUNGGU TECHNICIAN">MENUNGGU TECHNICIAN</option>
                            <option value="TIADA">TIADA</option>
                          </select>
                        </div>
                      </td>

                      {/* Interactive Exit Light Status Select */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 relative">
                          {updatingIdField === `${sub.id}-exitLight` && (
                            <Loader2 size={11} className="animate-spin text-slate-400 absolute -left-4" />
                          )}
                          <select
                            value={lightStatus}
                            onChange={(e) => handleSelectChange(sub.id, 'exitLight', e.target.value)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border outline-none tracking-wide cursor-pointer transition-all ${getStatusClasses(lightStatus)}`}
                          >
                            <option value="ADA">ADA</option>
                            <option value="SEDANG DIPROSES">SEDANG DIPROSES</option>
                            <option value="MENUNGGU TECHNICIAN">MENUNGGU TECHNICIAN</option>
                            <option value="TIADA">TIADA</option>
                          </select>
                        </div>
                      </td>

                      {/* Interactive Space Emergency Light Status Select */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 relative">
                          {updatingIdField === `${sub.id}-lampuKecemasan` && (
                            <Loader2 size={11} className="animate-spin text-slate-400 absolute -left-4" />
                          )}
                          <select
                            value={lampuStatus}
                            onChange={(e) => handleSelectChange(sub.id, 'lampuKecemasan', e.target.value)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border outline-none tracking-wide cursor-pointer transition-all ${getStatusClasses(lampuStatus)}`}
                          >
                            <option value="ADA">ADA</option>
                            <option value="SEDANG DIPROSES">SEDANG DIPROSES</option>
                            <option value="MENUNGGU TECHNICIAN">MENUNGGU TECHNICIAN</option>
                            <option value="TIADA">TIADA</option>
                          </select>
                        </div>
                      </td>

                      {/* Interactive Notification Received Status Select */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 relative">
                          {updatingIdField === `${sub.id}-notificationReceived` && (
                            <Loader2 size={11} className="animate-spin text-slate-400 absolute -left-4" />
                          )}
                          <select
                            value={normalizeNotification(sub.notificationReceived)}
                            onChange={(e) => handleSelectChange(sub.id, 'notificationReceived', e.target.value)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border outline-none tracking-wide cursor-pointer transition-all ${getNotificationStatusClasses(normalizeNotification(sub.notificationReceived))}`}
                          >
                            <option value="BELUM DIHANTAR">BELUM DIHANTAR</option>
                            <option value="DIHANTAR">DIHANTAR</option>
                            <option value="TERIMA & NOTED">TERIMA & NOTED</option>
                            <option value="TIADA RESPON">TIADA RESPON</option>
                          </select>
                        </div>
                      </td>

                      {/* Fire Extinguisher Expiration */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          {sub.fireExtinguishers && sub.fireExtinguishers.length > 0 ? (
                            sub.fireExtinguishers.map((ext, extIdx) => (
                              <span key={ext.id || extIdx} className="inline-flex items-center gap-1 font-mono font-bold text-[9px] text-slate-650 bg-slate-50 border border-slate-200/70 px-1.5 py-0.5 rounded" title={ext.label}>
                                <span className="opacity-60 max-w-[65px] truncate">{ext.label}:</span>
                                <span className={
                                  ext.expiryDate && new Date(ext.expiryDate) < new Date() 
                                    ? 'text-rose-600 font-bold' 
                                    : 'text-slate-700'
                                }>
                                  {ext.expiryDate || 'Tiada'}
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                              <Calendar size={11} className="text-slate-400" />
                              <span>{sub.extinguisherExpiryDate || 'Tiada Tarikh'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setPhotoGallerySub(sub)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-100 transition-all cursor-pointer inline-flex items-center justify-center shadow-sm"
                            title="Papar Gambar"
                          >
                            <Image size={14} />
                          </button>
                        </td>
                      )}

                      {/* WhatsApp Reminder Trigger Icon */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all cursor-pointer inline-flex items-center justify-center shadow-sm"
                          title="WhatsApp Reminder"
                        >
                          <MessageSquare size={14} className="animate-pulse" />
                        </button>
                      </td>
                      
                      {isAdmin && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setDeleteConfirm({ type: 'single', id: sub.id })}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 transition-all cursor-pointer inline-flex items-center justify-center shadow-sm"
                            title="Padam Rekod"
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHATSAPP REMINDER OVERLAY DIALOG / WIZARD */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Peringatan WhatsApp PASTI</h3>
                    <p className="text-[10px] text-slate-400 leading-none mt-0.5">Sediakan mesej maklum balas rasmi bersepadu</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSub(null)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-850 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Core Body Content */}
              <div className="p-6 space-y-6">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Penerima</span>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800">{selectedSub.headTeacher || 'Ustazah / Cikgu'}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600 font-semibold">{selectedSub.name}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-mono text-emerald-600 font-bold">{selectedSub.phone || 'Tiada No. Telefon'}</span>
                  </div>
                </div>

                {/* Categories selection lists */}
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">Pilih Kategori Amaran / Peringatan</span>
                  
                  <div className="space-y-2">
                    <label className={`w-full p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all cursor-pointer ${selectedIssueTypes.has(1) ? 'bg-emerald-50/50 border-emerald-500/30 text-slate-800 font-semibold' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={selectedIssueTypes.has(1)} onChange={() => toggleIssueType(1)} className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer" />
                      <span>1. Peringatan Pemasangan Pintu Kecemasan</span>
                    </label>

                    <label className={`w-full p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all cursor-pointer ${selectedIssueTypes.has(2) ? 'bg-emerald-50/50 border-emerald-500/30 text-slate-800 font-semibold' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={selectedIssueTypes.has(2)} onChange={() => toggleIssueType(2)} className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer" />
                      <span>2. Peringatan Pemasangan Lampu Keluar (Exit)</span>
                    </label>

                    <label className={`w-full p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all cursor-pointer ${selectedIssueTypes.has(3) ? 'bg-emerald-50/50 border-emerald-500/30 text-slate-800 font-semibold' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={selectedIssueTypes.has(3)} onChange={() => toggleIssueType(3)} className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer" />
                      <span>3. Peringatan Luput Tempoh Pemadam Api</span>
                    </label>
                  </div>
                </div>

                {/* Message preview details box */}
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Prebiu Mesej (Sedia dihantar)</span>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-sans text-xs border border-slate-800 leading-relaxed font-mono select-all">
                    {getMultiReminderMessage(selectedSub, selectedIssueTypes)}
                  </div>
                </div>

                {/* Validation of phone number presence */}
                {!selectedSub.phone && (
                  <div className="bg-rose-50 text-rose-700 text-[11px] px-3.5 py-2.5 rounded-xl border border-rose-100 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>No. Telefon prasekolah masih belum didaftarkan. Anda perlu memasukkan nombor telefon dalam rekod terlebih dahulu.</span>
                  </div>
                )}
              </div>

              {/* Send trigger panel */}
              <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center gap-3 justify-between border-t border-slate-100">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-slate-400" />
                  <span>Membuka pautan web rasmi WhatsApp API.</span>
                </span>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedSub(null)}
                    className="w-full sm:w-auto border border-slate-250 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl bg-white hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWa}
                    disabled={!selectedSub.phone}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/20 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Wasap Sekarang</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isBulkReminderOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-2xl animate-in"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Gabungan Peringatan Kelompok</h3>
                    <p className="text-[10px] text-slate-400 leading-none mt-0.5">Gabung peringatan bertanda dalam satu mesej</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBulkReminderOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-850 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Core Body Content */}
              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Prasekolah Terlibat ({selectedSubIds.length})</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px]">
                    {submissions.filter(s => selectedSubIds.includes(s.id)).map(s => (
                      <span key={s.id} className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-bold">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Categories selection lists */}
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Pilih Jenis Isu Untuk Digabung</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkReminderType('dynamic')}
                      className={`text-left p-2.5 rounded-xl border text-[11px] flex items-center gap-2 transition-all cursor-pointer ${bulkReminderType === 'dynamic' ? 'bg-emerald-50 border-emerald-500/30 text-emerald-950 font-bold' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bulkReminderType === 'dynamic' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>Ikut Isu Setiap PASTI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkReminderType(1)}
                      className={`text-left p-2.5 rounded-xl border text-[11px] flex items-center gap-2 transition-all cursor-pointer ${bulkReminderType === 1 ? 'bg-emerald-50 border-emerald-500/30 text-emerald-950 font-bold' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bulkReminderType === 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>Hanya Pintu Kecemasan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkReminderType(2)}
                      className={`text-left p-2.5 rounded-xl border text-[11px] flex items-center gap-2 transition-all cursor-pointer ${bulkReminderType === 2 ? 'bg-emerald-50 border-emerald-500/30 text-emerald-950 font-bold' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bulkReminderType === 2 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>Hanya Lampu EXIT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkReminderType(3)}
                      className={`text-left p-2.5 rounded-xl border text-[11px] flex items-center gap-2 transition-all cursor-pointer ${bulkReminderType === 3 ? 'bg-emerald-50 border-emerald-500/30 text-emerald-950 font-bold' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bulkReminderType === 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>Hanya Pemadam Api</span>
                    </button>
                  </div>
                </div>

                {/* Message preview details box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hasil Mesej Gabungan</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCombinedText(getCombinedReminderTemplate(submissions.filter(s => selectedSubIds.includes(s.id)), bulkReminderType))}
                      className="text-emerald-650 hover:text-emerald-700 text-emerald-600 font-bold text-[10px] flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      {copied ? <Check size={11} strokeWidth={3} className="text-emerald-600" /> : <Copy size={11} />}
                      <span>{copied ? 'Telah Disalin!' : 'Salin Mesej'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={getCombinedReminderTemplate(submissions.filter(s => selectedSubIds.includes(s.id)), bulkReminderType)}
                    className="w-full bg-slate-900 text-slate-350 p-4 rounded-xl font-sans text-xs border border-slate-800 leading-relaxed font-mono select-all h-36 resize-none outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* WhatsApp list sender helpers */}
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Hantar Wasap Terus (Individu)</span>
                  <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50">
                    {submissions.filter(s => selectedSubIds.includes(s.id)).map(s => {
                      const finalTemplate = getMultiReminderMessage(s, new Set([bulkReminderType === 'dynamic' ? 1 : (bulkReminderType as 1 | 2 | 3)]));
                      return (
                        <div key={s.id} className="p-2.5 flex items-center justify-between text-xs gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate text-[11px]">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{s.headTeacher || 'Muallimah'} ({s.phone || 'Tiada No'})</span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!s.phone) return;
                              const phone = formatPhoneForWa(s.phone);
                              const text = encodeURIComponent(finalTemplate);
                              window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'referrer');
                              if (onUpdateStatus) {
                                await onUpdateStatus(s.id, 'notificationReceived', 'DIHANTAR');
                              }
                            }}
                            disabled={!s.phone}
                            className="bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 hover:border-emerald-200 py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Send size={10} className="text-emerald-605 text-emerald-600" />
                            <span>Kirim</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Send trigger panel */}
              <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center gap-3 justify-between border-t border-slate-100">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-slate-400" />
                  <span>Sila gunakan butang 'Salin Mesej' atau 'Kirim' di atas untuk menghantar peringatan.</span>
                </span>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsBulkReminderOpen(false)}
                    className="w-full sm:w-auto border border-slate-300 text-slate-600 text-xs font-semibold px-4.5 py-2 rounded-xl bg-white hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Deletion Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 overflow-hidden shadow-2xl p-6"
              >
                <h3 className="text-base font-bold text-slate-900 mb-2">Padam Rekod?</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">
                  {deleteConfirm.type === 'single' ? 'Adakah anda benar-benar ingin memadam rekod ini?' : 
                   deleteConfirm.type === 'bulk' ? `Adakah anda benar-benar ingin memadam ${deleteConfirm.ids?.length} rekod yang dipilih?` : 
                   'Adakah anda benar-benar ingin memadam SEMUA rekod pemantauan? Tindakan ini tidak boleh diundurkan.'}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? 'Memadam...' : 'Ya, Padam'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Photo Gallery Modal */}
        <AnimatePresence>
          {photoGallerySub && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPhotoGallerySub(null)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-700 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Image size={16} className="text-blue-400" />
                    Galeri Foto: {photoGallerySub.name}
                  </h3>
                  <button 
                    onClick={() => setPhotoGallerySub(null)}
                    className="text-slate-400 hover:text-white p-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Emergency Door Photos */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center">
                      <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 w-full text-center pb-2 border-b border-slate-700/50">Pintu Kecemasan</h4>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {photoGallerySub.emergencyDoorsList && photoGallerySub.emergencyDoorsList.length > 0 ? (
                          photoGallerySub.emergencyDoorsList.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              {item.photoUrl ? (
                                <a href={item.photoUrl} target="_blank" rel="noreferrer">
                                  <img src={item.photoUrl} alt={item.label} className="w-full h-32 object-cover rounded-lg border border-slate-600 hover:border-blue-400 transition-colors shadow-lg" />
                                </a>
                              ) : (
                                <div className="w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                                  <Image size={24} className="opacity-20 mb-1" />
                                  <span className="text-[10px] font-medium leading-tight">Tiada Gambar</span>
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono text-center truncate">{item.label}</span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                            <Image size={24} className="opacity-20 mb-1" />
                            <span className="text-xs font-medium">Tiada Gambar Diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Exit Light Photos */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center">
                      <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 w-full text-center pb-2 border-b border-slate-700/50">Lampu Keluar (EXIT)</h4>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {photoGallerySub.exitLightsList && photoGallerySub.exitLightsList.length > 0 ? (
                          photoGallerySub.exitLightsList.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              {item.photoUrl ? (
                                <a href={item.photoUrl} target="_blank" rel="noreferrer">
                                  <img src={item.photoUrl} alt={item.label} className="w-full h-32 object-cover rounded-lg border border-slate-600 hover:border-blue-400 transition-colors shadow-lg" />
                                </a>
                              ) : (
                                <div className="w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                                  <Image size={24} className="opacity-20 mb-1" />
                                  <span className="text-[10px] font-medium leading-tight">Tiada Gambar</span>
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono text-center truncate">{item.label}</span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                            <Image size={24} className="opacity-20 mb-1" />
                            <span className="text-xs font-medium">Tiada Gambar Diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emergency Light Photos */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center">
                      <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 w-full text-center pb-2 border-b border-slate-700/50">Lampu Kecemasan Ruang</h4>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {photoGallerySub.lampuKecemasanList && photoGallerySub.lampuKecemasanList.length > 0 ? (
                          photoGallerySub.lampuKecemasanList.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              {item.photoUrl ? (
                                <a href={item.photoUrl} target="_blank" rel="noreferrer">
                                  <img src={item.photoUrl} alt={item.label} className="w-full h-32 object-cover rounded-lg border border-slate-600 hover:border-blue-400 transition-colors shadow-lg" />
                                </a>
                              ) : (
                                <div className="w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                                  <Image size={24} className="opacity-20 mb-1" />
                                  <span className="text-[10px] font-medium leading-tight">Tiada Gambar</span>
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono text-center truncate">{item.label}</span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                            <Image size={24} className="opacity-20 mb-1" />
                            <span className="text-xs font-medium">Tiada Gambar Diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fire Extinguishers Photos */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center">
                      <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 w-full text-center pb-2 border-b border-slate-700/50">Gambar Pemadam Api</h4>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {photoGallerySub.fireExtinguishers && photoGallerySub.fireExtinguishers.length > 0 ? (
                          photoGallerySub.fireExtinguishers.map((ext, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              {ext.photoUrl ? (
                                <a href={ext.photoUrl} target="_blank" rel="noreferrer">
                                  <img src={ext.photoUrl} alt={ext.label} className="w-full h-32 object-cover rounded-lg border border-slate-600 hover:border-rose-400 transition-colors shadow-lg" />
                                </a>
                              ) : (
                                <div className="w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                                  <Image size={24} className="opacity-20 mb-1" />
                                  <span className="text-[10px] font-medium leading-tight">Tiada Gambar</span>
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono text-center truncate">{ext.label}</span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 w-full h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-800/80 rounded-lg border border-slate-700 border-dashed text-center p-2">
                            <Image size={24} className="opacity-20 mb-1" />
                            <span className="text-xs font-medium">Tiada Gambar Diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
