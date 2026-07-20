import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Calendar, 
  Search, 
  Filter, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  User, 
  Phone, 
  Sparkles, 
  Lightbulb,
  BellRing,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Pasti, Submission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ExtinguisherMonitorProps {
  pastis: Pasti[];
  submissions: Submission[];
  onUpdateStatus?: (submissionId: string, field: 'emergencyDoor' | 'exitLight' | 'lampuKecemasan' | 'notificationReceived', value: string) => Promise<boolean>;
  onRefresh?: () => void;
}

export default function ExtinguisherMonitor({ pastis, submissions, onUpdateStatus, onRefresh }: ExtinguisherMonitorProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const todayDate = new Date();
  const [calendarYear, setCalendarYear] = useState(todayDate.getFullYear() || 2026);
  const [calendarMonth, setCalendarMonth] = useState(todayDate.getMonth() !== undefined ? todayDate.getMonth() : 5); // 0-indexed: 5 is June
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'warning' | 'active' | 'no-submission'>('all');
  const [selectedPasti, setSelectedPasti] = useState<Pasti | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Month Names in Bahasa Melayu
  const MONTHS_MS = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  // Weekdays in Bahasa Melayu
  const DAYS_MS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  // Modal input fields
  const [eventTitle, setEventTitle] = useState('Penyelenggaraan Pemadam Api');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [selectedExtinguisherId, setSelectedExtinguisherId] = useState<string>('all');
  const [customNotes, setCustomNotes] = useState('Sila hubungi kontraktor servis pembekal pemadam api yang diiktiraf bagi memperbaharui peranti.');
  const [editingExtinguishers, setEditingExtinguishers] = useState<{ id: string; label: string; expiryDate: string }[]>([]);

  // Clean and parse date
  const parseDate = (dStr: string) => {
    if (!dStr) return null;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(dStr);
  };

  // Days left helper
  const getDaysLeft = (expiryDateStr: string) => {
    if (!expiryDateStr) return null;
    const exp = parseDate(expiryDateStr);
    if (!exp) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Extinguisher overall status solver
  const getPastiExtinguisherStatus = (pasti: Pasti) => {
    const actualSub = submissions.find(s => s.pastiId?.toString() === pasti.id?.toString());
    if (!actualSub) return { label: 'Tiada Laporan', code: 'no-submission', color: 'slate' };

    // Check individual fire extinguishers if they exist, or check fallback extinguisherExpiryDate
    const extinguishers = actualSub.fireExtinguishers && actualSub.fireExtinguishers.length > 0 
      ? actualSub.fireExtinguishers 
      : [{ id: '1', label: 'Pemadam Api 1', expiryDate: actualSub.extinguisherExpiryDate }];

    let hasExpired = false;
    let hasWarning = false;

    extinguishers.forEach(ext => {
      if (!ext.expiryDate) return;
      const days = getDaysLeft(ext.expiryDate);
      if (days !== null) {
        if (days < 0) hasExpired = true;
        else if (days <= 30) hasWarning = true;
      }
    });

    if (hasExpired) return { label: 'Tamat Tempoh', code: 'expired', color: 'rose' };
    if (hasWarning) return { label: 'Akan Luput (30 Hari)', code: 'warning', color: 'amber' };
    
    const hasAnyDate = extinguishers.some(e => !!e.expiryDate);
    if (!hasAnyDate) return { label: 'Tiada Rekod Tarikh', code: 'no-date', color: 'slate' };

    return { label: 'Selamat / Aktif', code: 'active', color: 'emerald' };
  };

  // Pre-fill modal states for extinguisher notification
  const handleOpenReminderModal = (pasti: Pasti, sub: Submission | undefined) => {
    setSelectedPasti(pasti);
    setSelectedSubmission(sub || null);
    
    // Calculate initial dates
    const extinguishers = sub && sub.fireExtinguishers && sub.fireExtinguishers.length > 0 
      ? sub.fireExtinguishers 
      : sub 
        ? [{ id: '1', label: 'Pemadam Api 1', expiryDate: sub.extinguisherExpiryDate || '' }]
        : [{ id: '1', label: 'Pemadam Api 1', expiryDate: '' }];
    
    setEditingExtinguishers(extinguishers.map((e, idx) => ({
      id: e.id || `${idx + 1}-${Math.random().toString(36).substr(2, 4)}`,
      label: e.label || `Pemadam Api ${idx + 1}`,
      expiryDate: e.expiryDate || ''
    })));

    if (sub) {
      const firstWithDate = extinguishers.find(e => !!e.expiryDate);
      setEventDate(firstWithDate ? firstWithDate.expiryDate : '');
      setEventTitle(`Servis Pemadam Api - ${pasti.name}`);
      setSelectedExtinguisherId(firstWithDate ? firstWithDate.id : 'all');
    } else {
      setEventDate('');
      setEventTitle(`Kemas Kini Laporan Keselamatan - ${pasti.name}`);
      setSelectedExtinguisherId('all');
    }
    
    setIsModalOpen(true);
  };

  // Direct manual save to Firestore
  const handleSaveExtinguishersManually = async () => {
    if (!selectedPasti) return;
    
    // Calculate overall extinguisherExpiryDate (earliest of the dates)
    const activeDates = editingExtinguishers.map(e => e.expiryDate).filter(Boolean);
    let overallExpiry = '';
    if (activeDates.length > 0) {
      activeDates.sort();
      overallExpiry = activeDates[0];
    }

    try {
      if (selectedSubmission) {
        // Update existing submission on Firebase
        const docRef = doc(db, 'submissions', selectedSubmission.id);
        await updateDoc(docRef, {
          fireExtinguishers: editingExtinguishers,
          extinguisherExpiryDate: overallExpiry,
          updatedAt: new Date()
        });
      } else {
        // Create new report database entry
        const newDocPayload = {
          pastiId: selectedPasti.id,
          name: selectedPasti.name,
          headTeacher: selectedPasti.headTeacher || '',
          phone: selectedPasti.phone || '',
          fireExtinguishers: editingExtinguishers,
          extinguisherExpiryDate: overallExpiry,
          createdAt: new Date(),
          updatedAt: new Date(),
          emergencyDoor: 'BELUM DIKAJI',
          exitLight: 'BELUM DIKAJI',
          lampuKecemasan: 'BELUM DIKAJI',
          notificationReceived: 'BELUM DIHANTAR'
        };
        await addDoc(collection(db, 'submissions'), newDocPayload);
      }

      alert('Rekod pemadam api berjaya disimpan!');
      if (onRefresh) {
        onRefresh();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving extinguishers manually:', error);
      alert('Gagal menyimpan rekod pemadam api. Sila cuba lagi.');
    }
  };

  // Generate Google Calendar template URL
  const generateGoogleCalendarUrl = (title: string, dateStr: string, timeStr: string, location: string, desc: string) => {
    if (!dateStr) return '';
    
    // Dates formatting should be YYYYMMDD or YYYYMMDDTdec
    const cleanDate = dateStr.replace(/-/g, ''); // 2026-11-15 -> 20261115
    const cleanTime = timeStr.replace(/:/g, ''); // 09:00 -> 090000
    
    // Ensure properly formatted UTC event or local dateTime
    const startDateTime = `${cleanDate}T${cleanTime}00`;
    const endDateTime = `${cleanDate}T${String(parseInt(cleanTime.slice(0, 2)) + 1).padStart(2, '0')}${cleanTime.slice(2)}00`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
  };

  // Build current visual reminder text
  const buildReminderText = () => {
    if (!selectedPasti) return '';
    
    const matchedSub = selectedSubmission;
    const teacherName = (selectedPasti.headTeacher || 'Mualimah').toUpperCase();
    const pastiName = selectedPasti.name;

    // List of extinguisher lines
    let extinguisherSection = '';
    if (matchedSub && matchedSub.fireExtinguishers && matchedSub.fireExtinguishers.length > 0) {
      if (selectedExtinguisherId === 'all') {
        extinguisherSection = matchedSub.fireExtinguishers.map((ext: any) => 
          `• *${ext.label}* - Luput: ${ext.expiryDate || 'Tiada tarikh'}`
        ).join('\n');
      } else {
        const singleExt = matchedSub.fireExtinguishers.find((e: any) => e.id === selectedExtinguisherId);
        if (singleExt) {
          extinguisherSection = `• *${singleExt.label}* - Luput: ${singleExt.expiryDate || 'Tiada tarikh'}`;
        }
      }
    } else if (matchedSub) {
      extinguisherSection = `• *Pemadam Api Utama* - Tarikh Luput: ${matchedSub.extinguisherExpiryDate || 'Tiada tarikh'}`;
    } else {
      extinguisherSection = `• Belum menghantar saringan / rekod tarikh luput.`;
    }

    // Generate link 
    const googleCalDescription = `Servis Penyelenggaraan Pemadam Api bagi premis ${pastiName}. Tanggungjawab: Mualimah ${teacherName}. Sila bersiap sedia sebelum tarikh tamat tempoh keselamatan.`;
    const googleCalUrl = eventDate ? generateGoogleCalendarUrl(eventTitle, eventDate, eventTime, pastiName, googleCalDescription) : '';

    return `*📅 ACARA PERINGATAN KALENDAR PENYELENGGARAAN PEMADAM API*

Assalamualaikum Muallimah ${teacherName},

Pihak Pentadbiran PASTI Kuala Langat ingin mengingatkan bahawa tarikh luput pemadam api bagi premis anda semakin hampir atau telah tamat.

Sila masukkan peringatan ini ke dalam aplikasi Kalendar telefon anda dengan menekan pautan di bawah agar mualimah menerima notifikasi peringatan:

🔗 *Daftar Acara Kalendar:*
${googleCalUrl || '(Sila masukkan tarikh terlebih dahulu)'}

*Butiran Acara:*
📌 Perkara: ${eventTitle}
🏢 Premis: ${pastiName}
🗓️ Tarikh Peringatan: ${eventDate || 'Sila Nyatakan'} pada pukul ${eventTime}
📝 Nota: ${customNotes}

*Senarai Pemadam Api Terlibat:*
${extinguisherSection}

Mohon mualimah mengambil tindakan awal demi menjamin keselamatan anak-anak prasekolah di PASTI ${pastiName}. Terima kasih!

_Mesej gandingan dijana oleh: Sistem Pantauan Keselamatan & Kesihatan PASTI Kuala Langat_`;
  };

  // WhatsApp sender
  const handleSendReminderToWa = async () => {
    if (!selectedPasti) return;
    
    // Format phone
    let cleanedPhone = selectedPasti.phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '6' + cleanedPhone;
    } else if (!cleanedPhone.startsWith('60') && cleanedPhone.startsWith('1')) {
      cleanedPhone = '60' + cleanedPhone;
    }

    const message = buildReminderText();
    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noreferrer');

    // Update status in submission if exists
    if (selectedSubmission && onUpdateStatus) {
      await onUpdateStatus(selectedSubmission.id, 'notificationReceived', 'DIHANTAR');
    }

    setIsModalOpen(false);
  };

  // Copy helper
  const handleCopyText = () => {
    navigator.clipboard.writeText(buildReminderText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute stats for overview of extinguishers
  const totalPastiCount = pastis.length;
  let expiredCount = 0;
  let warningCount = 0;
  let activeCount = 0;
  let noSubCount = 0;

  pastis.forEach(pasti => {
    const status = getPastiExtinguisherStatus(pasti);
    if (status.code === 'expired') expiredCount++;
    else if (status.code === 'warning') warningCount++;
    else if (status.code === 'active') activeCount++;
    else if (status.code === 'no-submission') noSubCount++;
  });

  // Filtered PASTI list
  const filteredPastis = pastis.filter(pasti => {
    // Search match
    const sub = submissions.find(s => s.pastiId?.toString() === pasti.id?.toString());
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = pasti.name.toLowerCase().includes(searchLower) || 
                      pasti.headTeacher.toLowerCase().includes(searchLower) ||
                      pasti.phone.includes(searchTerm);
    
    if (!nameMatch) return false;

    // Filter status match
    const status = getPastiExtinguisherStatus(pasti);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'expired' && status.code === 'expired') return true;
    if (statusFilter === 'warning' && status.code === 'warning') return true;
    if (statusFilter === 'active' && status.code === 'active') return true;
    if (statusFilter === 'no-submission' && status.code === 'no-submission') return true;
    
    return false;
  });

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-6">
      
      {/* Title block */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-700 px-3 py-1 rounded-full text-xs font-bold text-emerald-250 text-emerald-200 mb-3">
            <BellRing size={12} className="animate-bounce" />
            <span>Hab Peringatan Tarikh Luput</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Pemantauan & Kalendar Pemadam Api</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pantau tarikh tamat tempoh keselamatan pemadam api dan hantar jemputan acara Google Calendar yang diposkan ke WhatsApp guru PASTI sebagai rekod.
          </p>
        </div>
      </div>

      {/* Overview stats layout */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Sekolah</span>
          <strong className="text-xl font-extrabold text-slate-800 leading-none mt-2">{totalPastiCount} PASTI</strong>
        </div>

        <div className="bg-white rounded-2xl border border-slate-250 border-slate-200/85 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-rose-650 text-rose-600">
            <AlertTriangle size={14} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Tamat Tempoh</span>
          </div>
          <strong className="text-xl font-extrabold text-rose-600 leading-none mt-2">{expiredCount} Premis</strong>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-amber-600">
            <Clock size={14} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Akan Luput</span>
          </div>
          <strong className="text-xl font-extrabold text-amber-500 leading-none mt-2">{warningCount} Premis</strong>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 size={14} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Lunas / Selamat</span>
          </div>
          <strong className="text-xl font-extrabold text-emerald-600 leading-none mt-2">{activeCount} Premis</strong>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white rounded-2xl border border-slate-200/85 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Belum Melapor</span>
          <strong className="text-xl font-extrabold text-slate-500 leading-none mt-2">{noSubCount} Premis</strong>
        </div>
      </div>

      {/* Navigation Tabs for List vs Calendar View */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1 gap-2 shadow-sm">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
          }`}
        >
          📋 Senarai Pemantauan (Senarai)
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
          }`}
        >
          📅 Paparan Kalendar (Papar Nama PASTI)
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Control panel and Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama PASTI atau nama guru..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              <Filter size={13} className="text-slate-400 mr-1" />
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'expired' ? 'bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
              >
                Tamat Tempoh ({expiredCount})
              </button>
              <button
                onClick={() => setStatusFilter('warning')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'warning' ? 'bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
              >
                Akan Luput ({warningCount})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'active' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
              >
                Aktif / Selamat ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('no-submission')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'no-submission' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
              >
                Belum Hantar ({noSubCount})
              </button>
            </div>
          </div>

          {/* Main Grid View of School Fire Extinguishers */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredPastis.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic text-xs">
                  Tiada rekod PASTI sepadan dijumpai. Sila cuba kata kunci lain.
                </div>
              ) : (
                filteredPastis.map((pasti) => {
                  const sub = submissions.find(s => s.pastiId?.toString() === pasti.id?.toString());
                  const status = getPastiExtinguisherStatus(pasti);

                  // Extract unique fire extinguishers
                  const extinguishers = sub && sub.fireExtinguishers && sub.fireExtinguishers.length > 0
                    ? sub.fireExtinguishers
                    : sub 
                      ? [{ id: '1', label: 'Pemadam Api 1', expiryDate: sub.extinguisherExpiryDate }]
                      : [];

                  return (
                    <div key={pasti.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight truncate">{pasti.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            status.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            status.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            status.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <User size={13} className="text-slate-400 shrink-0" />
                            <span>Mualimah {pasti.headTeacher || 'Tidak Dinyatakan'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <span>{pasti.phone || '-'}</span>
                          </span>
                          {sub && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <Clock size={12} className="text-emerald-500 shrink-0" />
                              <span>Laporan Diterima: {
                                (() => {
                                  const rawDate = sub.createdAt || sub.updatedAt;
                                  if (!rawDate) return 'Sedia Ada';
                                  const dateObj = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
                                  return isNaN(dateObj.getTime()) ? 'Sedia Ada' : dateObj.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                })()
                              }</span>
                            </span>
                          )}
                        </div>

                        {/* Expiry list detail */}
                        {extinguishers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-1">
                            {extinguishers.map((ext: any, idx) => {
                              const days = ext.expiryDate ? getDaysLeft(ext.expiryDate) : null;
                              let extBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                              if (days !== null) {
                                if (days < 0) extBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                                else if (days <= 30) extBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                                else extBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-150';
                              }

                              return (
                                <div key={ext.id || idx} className={`inline-flex items-center gap-1.5 border px-2 py-1 rounded-lg text-[10px] font-bold ${extBadgeColor}`} title={`ID: ${ext.id}`}>
                                  <span className="opacity-60">{ext.label || `Pemadam Api ${idx+1}`}:</span>
                                  <span className="font-mono">{ext.expiryDate || 'Tiada Tarikh'}</span>
                                  {days !== null && (
                                    <span className="opacity-85 font-sans font-medium">
                                      {days < 0 ? '(Tamat Tempoh)' : days === 0 ? '(Hari ini!)' : `(${days} hari)`}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] italic text-slate-400 mt-2">
                            Tiada maklumat unit pemadam api direkodkan. Guru belum menyelesaikan maklum balas.
                          </div>
                        )}
                      </div>

                      {/* Actions Area */}
                      <div className="shrink-0 flex items-center md:justify-end gap-2">
                        <button
                          onClick={() => handleOpenReminderModal(pasti, sub)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                            status.code === 'no-submission'
                              ? 'bg-slate-150 text-slate-700 border-slate-200 hover:bg-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200/80 shadow-sm'
                          }`}
                        >
                          <Calendar size={13} strokeWidth={2.5} />
                          <span>{status.code === 'no-submission' ? 'Desak Laporan' : 'Atur Peringatan Kalendar'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar top controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all text-slate-600"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-extrabold text-slate-800 min-w-[125px] text-center">
                {MONTHS_MS[calendarMonth]} {calendarYear}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all text-slate-600"
                title="Bulan Seterusnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick action: jump to today & Legend */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  setCalendarYear(todayDate.getFullYear() || 2026);
                  setCalendarMonth(todayDate.getMonth() !== undefined ? todayDate.getMonth() : 5);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-xs text-slate-750 text-slate-700 cursor-pointer transition-all"
              >
                Bulan Ini
              </button>

              {/* Mini Indicators Legend */}
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" />
                  <span>Tamat Tempoh</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                  <span>Akan Luput</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                  <span>Selamat</span>
                </span>
              </div>
            </div>
          </div>

          {/* Monthly grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4">
            
            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-2">
              {DAYS_MS.map((day) => (
                <div key={day} className="py-2 bg-slate-50 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                const numDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

                const cells = [];
                // Previous month days padding
                if (firstDay > 0) {
                  const prevMonthNumDays = new Date(calendarYear, calendarMonth, 0).getDate();
                  for (let i = firstDay - 1; i >= 0; i--) {
                    cells.push({
                      day: prevMonthNumDays - i,
                      isCurrentMonth: false,
                      monthOffset: -1
                    });
                  }
                }

                // Current month days
                for (let d = 1; d <= numDays; d++) {
                  cells.push({
                    day: d,
                    isCurrentMonth: true,
                    monthOffset: 0
                  });
                }

                // Next month days padding
                const totalCells = cells.length;
                const nextDaysNeeded = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
                for (let d = 1; d <= nextDaysNeeded; d++) {
                  cells.push({
                    day: d,
                    isCurrentMonth: false,
                    monthOffset: 1
                  });
                }

                return cells.map((cell, idx) => {
                  let year = calendarYear;
                  let month = calendarMonth + cell.monthOffset;
                  if (month < 0) {
                    month = 11;
                    year -= 1;
                  } else if (month > 11) {
                    month = 0;
                    year += 1;
                  }

                  const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                  const isToday = todayDate.getFullYear() === year &&
                                  todayDate.getMonth() === month &&
                                  todayDate.getDate() === cell.day;

                  // Find expiring extinguishers for this date
                  const dayEvents: any[] = [];
                  pastis.forEach(pasti => {
                    const sub = submissions.find(s => s.pastiId?.toString() === pasti.id?.toString());
                    if (sub) {
                      const extinguishers = sub.fireExtinguishers && sub.fireExtinguishers.length > 0
                        ? sub.fireExtinguishers
                        : [{ id: '1', label: 'Pemadam Api 1', expiryDate: sub.extinguisherExpiryDate }];

                      extinguishers.forEach((ext: any, extIdx) => {
                        if (ext.expiryDate === cellDateStr) {
                          dayEvents.push({
                            pasti,
                            sub,
                            extLabel: ext.label || `Pemadam Api ${extIdx + 1}`,
                            extId: ext.id || extIdx
                          });
                        }
                      });
                    }
                  });

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] border border-slate-100 rounded-xl p-1.5 flex flex-col justify-between transition-all ${
                        cell.isCurrentMonth
                          ? isToday
                            ? 'bg-emerald-50/20 border-emerald-300 ring-1 ring-emerald-300/30'
                            : 'bg-white hover:bg-slate-50/30'
                          : 'bg-slate-50/60 opacity-60 pointer-events-none'
                      }`}
                    >
                      {/* Day number & Event counts */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${
                          cell.isCurrentMonth
                            ? isToday
                              ? 'bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-black animate-pulse'
                              : 'text-slate-800'
                            : 'text-slate-400'
                        }`}>
                          {cell.day}
                        </span>

                        {dayEvents.length > 0 && cell.isCurrentMonth && (
                          <span className="text-[8px] bg-red-105 bg-rose-50 text-rose-700 border border-rose-200/50 px-1 py-0.2 rounded font-bold leading-none shrink-0 scale-90">
                            {dayEvents.length} Pemadam
                          </span>
                        )}
                      </div>

                      {/* Day events: show fire extinguisher warning & PASTI name */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                        {dayEvents.map((evt, evtIdx) => {
                          const days = getDaysLeft(cellDateStr);
                          let badgeBg = 'bg-slate-50 text-slate-700 border-slate-100';
                          if (days !== null) {
                            if (days < 0) badgeBg = 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 hover:border-rose-200';
                            else if (days <= 30) badgeBg = 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 hover:border-amber-200';
                            else badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200';
                          }

                          return (
                            <button
                              key={evtIdx}
                              onClick={() => handleOpenReminderModal(evt.pasti, evt.sub)}
                              className={`w-full text-left p-1 rounded border text-[9px] font-bold block transition-all hover:scale-[1.02] cursor-pointer shadow-sm truncate ${badgeBg}`}
                              title={`${evt.pasti.name} - ${evt.extLabel} (${days !== null && days < 0 ? 'Tamat tempoh keselamatan!' : `${days} hari berbaki`})`}
                            >
                              <div className="truncate font-black text-rose-955 text-[8.5px] uppercase">{evt.pasti.name}</div>
                              <div className="truncate text-[7.5px] opacity-75 font-medium leading-none mt-0.5">{evt.extLabel}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Invitation Preview Modal */}
      <AnimatePresence>
        {isModalOpen && selectedPasti && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-100 shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-800">Sediakan Peringatan Kalendar</h2>
                    <p className="text-[10px] text-slate-400">{selectedPasti.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable contents */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1.5">
                
                {/* Configuration Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tajuk Acara Kalendar:</label>
                    <input 
                      type="text" 
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tarikh Acara:</label>
                      <input 
                        type="date" 
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Masa:</label>
                      <input 
                        type="time" 
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Extinguisher selector */}
                {selectedSubmission && selectedSubmission.fireExtinguishers && selectedSubmission.fireExtinguishers.length > 1 && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pilih Pemadam Api (Butiran WhatsApp):</label>
                    <select
                      value={selectedExtinguisherId}
                      onChange={(e) => {
                        setSelectedExtinguisherId(e.target.value);
                        if (e.target.value !== 'all') {
                          const found = selectedSubmission.fireExtinguishers?.find((ex: any) => ex.id === e.target.value);
                          if (found && found.expiryDate) {
                            setEventDate(found.expiryDate);
                          }
                        }
                      }}
                      className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="all">Semua Unit Pemadam Api</option>
                      {selectedSubmission.fireExtinguishers.map((ext: any) => (
                        <option key={ext.id} value={ext.id}>{ext.label} (Luput: {ext.expiryDate || 'Tiada'})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ⚙️ Seksyen Maklumat Pemadam Api (Boleh Diubah oleh Admin) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      ⚙️ Pengurusan Pemadam Api (Admin)
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExtinguishers(prev => [
                          ...prev,
                          { id: `ext-${Math.random().toString(36).substr(2, 4)}`, label: `Pemadam Api ${prev.length + 1}`, expiryDate: '' }
                        ]);
                      }}
                      className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-150 hover:bg-emerald-100 cursor-pointer transition-all active:scale-95"
                    >
                      + Tambah Unit
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editingExtinguishers.length === 0 ? (
                      <p className="text-[10px] italic text-slate-400">Tiada unit pemadam api didaftarkan. Sila klik '+ Tambah Unit'.</p>
                    ) : (
                      editingExtinguishers.map((ext, idx) => (
                        <div key={ext.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-150">
                          <input
                            type="text"
                            value={ext.label}
                            placeholder="Label (contoh: Unit Dapur)"
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingExtinguishers(prev => prev.map(item => item.id === ext.id ? { ...item, label: val } : item));
                            }}
                            className="flex-1 min-w-0 border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                          <input
                            type="date"
                            value={ext.expiryDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingExtinguishers(prev => prev.map(item => item.id === ext.id ? { ...item, expiryDate: val } : item));
                              // Also update the event date helper if it's the first or primary
                              if (idx === 0) {
                                setEventDate(val);
                              }
                            }}
                            className="w-32 border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExtinguishers(prev => prev.filter(item => item.id !== ext.id));
                            }}
                            className="p-1 px-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                            title="Padam Alat Pemadam"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveExtinguishersManually}
                      className="text-[10px] font-black uppercase tracking-tight text-white bg-slate-800 hover:bg-slate-900 px-3.5 py-1.5 rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                    >
                      <CheckCircle2 size={11} />
                      <span>Simpan & Kemas Kini Rekod</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nota Tambahan:</label>
                  <textarea 
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                    placeholder="Masukkan ulasan atau cadangan tindakan..."
                  />
                </div>

                {/* Google Calendar Link Preview Indicator */}
                <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100 flex items-start gap-2 text-xs">
                  <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950 block">Pemberian Peringatan Pintar Kalendar</span>
                    <p className="text-[10px] text-emerald-800/80 leading-relaxed mt-0.5">
                      Sistem ini merumus parameter di atas untuk menjana rentetan jemputan Google Calendar dinamik. Sebaik guru PASTI menekan pautan dari WhatsApp, acara kalendar berperingatan rasmi akan sedia dimasukkan ke telefon pintar mereka secara spontan.
                    </p>
                  </div>
                </div>

                {/* Textarea View-only/whatsapp message body preview */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pratonton Mesej WhatsApp:</label>
                    <button
                      onClick={handleCopyText}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded cursor-pointer transition-all"
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copied ? 'Tersalin' : 'Salin Mesej'}</span>
                    </button>
                  </div>
                  <div className="w-full border border-slate-200 bg-slate-100 p-3 rounded-2xl text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border-dashed">
                    {buildReminderText()}
                  </div>
                </div>

              </div>

              {/* Modal action bar buttons */}
              <div className="border-t pt-4 mt-4 flex items-center justify-between gap-3 shrink-0">
                <div className="flex gap-1 items-center font-medium text-[10px] text-slate-400">
                  <span>No Guru: </span>
                  <strong className="font-bold font-mono text-slate-600">{selectedPasti.phone}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 font-bold text-slate-700 text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReminderToWa}
                    disabled={!eventDate}
                    className={`flex items-center gap-1.5 px-5 py-2 font-black text-xs text-white rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer ${
                      !eventDate 
                        ? 'bg-slate-300 pointer-events-none' 
                        : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'
                    }`}
                  >
                    <Send size={12} />
                    <span>Hantar Peringatan ke WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
