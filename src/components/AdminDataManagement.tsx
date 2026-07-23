import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, writeBatch, addDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isUsingCustomFirebase, currentProjectId } from '../firebase';
import { Clock, User, Bell, Trash2, RefreshCw, Layers, AlertTriangle, Eye, Globe, MousePointer, BarChart3, Filter, Shield, Download, Upload, Database, Sparkles, CheckCircle2, Key, Copy, Check, Terminal, ExternalLink, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_PASTI_SEED = [
  { name: 'PASTI Al-Hidayah, Banting', headTeacher: 'Ustazah Noraini', phone: '0123456781' },
  { name: 'PASTI As-Syakirin, Telok Panglima Garang', headTeacher: 'Ustazah Fatimah', phone: '0139876542' },
  { name: 'PASTI Nurul Huda, Jenjarom', headTeacher: 'Ustazah Zaiton', phone: '0198765431' },
  { name: 'PASTI Al-Murom, Morib', headTeacher: 'Ustazah Salmah', phone: '0112345678' },
  { name: 'PASTI Al-Falah, Bandar Saujana Putra', headTeacher: 'Ustazah Maryam', phone: '0176543210' },
  { name: 'PASTI As-Salam, Sijangkang', headTeacher: 'Ustazah Aminah', phone: '0189012345' },
  { name: 'PASTI Al-Ikhlas, Kanchong Darat', headTeacher: 'Ustazah Rohana', phone: '0145678901' },
  { name: 'PASTI Nurul Iman, Sungai Lang', headTeacher: 'Ustazah Khadijah', phone: '0167890123' },
  { name: 'PASTI Ar-Raudhah, Jugra', headTeacher: 'Ustazah Azizah', phone: '0129012345' },
  { name: 'PASTI Al-Hikmah, Permatang Pasir', headTeacher: 'Ustazah Hasnah', phone: '0130123456' },
  { name: 'PASTI At-Taqwa, Kelanang', headTeacher: 'Ustazah Fauziah', phone: '0191234567' },
  { name: 'PASTI Al-Ehsan, Bukit Changgang', headTeacher: 'Ustazah Rashidah', phone: '0112345679' },
];

export default function AdminDataManagement() {
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [activeViewers, setActiveViewers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [browseCount, setBrowseCount] = useState<number | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'public' | 'admin'>('all');

  // Migration & Backup States
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Auto Firebase Setup Wizard State
  const [pastedConfig, setPastedConfig] = useState('');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Deletion/Reset State
  const [isResettingOwner, setIsResettingOwner] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [isResettingActive, setIsResettingActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Helper: Auto-parse pasted Firebase code snippet or JSON
  const parsedEnv = React.useMemo(() => {
    if (!pastedConfig.trim()) return null;
    const raw = pastedConfig;
    
    // Try JSON parse first
    try {
      const obj = JSON.parse(raw);
      if (obj.apiKey || obj.projectId) {
        return {
          apiKey: obj.apiKey || '',
          authDomain: obj.authDomain || (obj.projectId ? `${obj.projectId}.firebaseapp.com` : ''),
          projectId: obj.projectId || '',
          storageBucket: obj.storageBucket || (obj.projectId ? `${obj.projectId}.appspot.com` : ''),
          messagingSenderId: obj.messagingSenderId || '',
          appId: obj.appId || '',
        };
      }
    } catch (e) {
      // Ignore JSON error and fallback to regex extraction
    }

    const extract = (key: string) => {
      const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`, 'i');
      const match = raw.match(regex);
      return match ? match[1] : '';
    };

    const apiKey = extract('apiKey');
    const projectId = extract('projectId');
    const authDomain = extract('authDomain') || (projectId ? `${projectId}.firebaseapp.com` : '');
    const storageBucket = extract('storageBucket') || (projectId ? `${projectId}.appspot.com` : '');
    const messagingSenderId = extract('messagingSenderId');
    const appId = extract('appId');

    if (apiKey || projectId) {
      return {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId
      };
    }
    return null;
  }, [pastedConfig]);

  const generatedEnvText = React.useMemo(() => {
    if (!parsedEnv) return '';
    return [
      `VITE_FIREBASE_API_KEY=${parsedEnv.apiKey}`,
      `VITE_FIREBASE_AUTH_DOMAIN=${parsedEnv.authDomain}`,
      `VITE_FIREBASE_PROJECT_ID=${parsedEnv.projectId}`,
      `VITE_FIREBASE_STORAGE_BUCKET=${parsedEnv.storageBucket}`,
      `VITE_FIREBASE_MESSAGING_SENDER_ID=${parsedEnv.messagingSenderId}`,
      `VITE_FIREBASE_APP_ID=${parsedEnv.appId}`,
      `VITE_FIREBASE_DATABASE_ID=(default)`
    ].join('\n');
  }, [parsedEnv]);

  const handleSaveCustomFirebase = () => {
    if (!parsedEnv || !parsedEnv.projectId) {
      alert("Sila masukkan kod konfigurasi Firebase yang sah (mesti mengandungi projectId dan apiKey).");
      return;
    }

    localStorage.setItem('CUSTOM_FIREBASE_CONFIG', JSON.stringify(parsedEnv));
    alert(`🎉 Berjaya menyimpan konfigurasi untuk projek Firebase: "${parsedEnv.projectId}"!\n\nAplikasi akan memuat semula halaman sekarang untuk menggunakan pangkalan data projek baharu ini.`);
    window.location.reload();
  };

  const handleResetToSandbox = () => {
    if (confirm("Adakah anda pasti mahu kembali ke Projek Sandbox asal AI Studio?")) {
      localStorage.removeItem('CUSTOM_FIREBASE_CONFIG');
      alert("Telah kembali ke Projek Sandbox asal.");
      window.location.reload();
    }
  };

  const handleCopyEnvText = () => {
    if (!generatedEnvText) return;
    navigator.clipboard.writeText(generatedEnvText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'owner' | 'active' | 'all' | 'notif';
    title: string;
    message: string;
    confirmText: string;
    badgeStyle: string;
    btnStyle: string;
  } | null>(null);

  const [viewDataModal, setViewDataModal] = useState(false);
  const [dbData, setDbData] = useState<{ pastis: any[]; submissions: any[] } | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const handleFetchDbData = async () => {
    setIsFetchingData(true);
    setViewDataModal(true);
    try {
      const pastisSnap = await getDocs(collection(db, 'pastis'));
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      setDbData({
        pastis: pastisSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        submissions: submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      });
    } catch (err: any) {
      alert("Ralat mengambil data pangkalan data: " + err.message);
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    // Visitor Logs
    const qLogs = query(collection(db, 'visitorLogs'), orderBy('entryTime', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setVisitorLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'visitorLogs');
    });

    // Active Viewers
    const qActive = query(collection(db, 'activeViewers'));
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      setActiveViewers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activeViewers');
    });

    // Notifications
    const qNotif = query(collection(db, 'adminNotifications'), orderBy('createdAt', 'desc'));
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'adminNotifications');
    });

    // Total Views & Browse Count
    const unsubTotal = onSnapshot(doc(db, 'siteStats', 'visitors'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTotalViews(data.count ?? 0);
        setBrowseCount(data.browseCount || data.count || 0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'siteStats/visitors');
    });

    return () => {
      unsubLogs();
      unsubActive();
      unsubNotif();
      unsubTotal();
    };
  }, []);

  const openConfirmModal = (type: 'owner' | 'active' | 'all' | 'notif') => {
    if (type === 'owner') {
      setConfirmModal({
        type,
        title: 'Padam Rekod Pengujian Owner',
        message: 'Adakah anda pasti mahu memadamkan rekod akses & ujian oleh Owner? Ini membolehkan anda memisahkan rekod pengujian daripada data pengunjung live yang sebenar.',
        confirmText: 'Sahkan Padam Ujian',
        badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
        btnStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-amber-500/10'
      });
    } else if (type === 'active') {
      setConfirmModal({
        type,
        title: 'Bersihkan Sesi Aktif',
        message: 'Adakah anda pasti mahu membersihkan sesi aktif? Statistik sesi aktif di pangkalan data akan dilaraskan semula kepada sifar.',
        confirmText: 'Sahkan Bersih Sesi',
        badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        btnStyle: 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white shadow-indigo-500/10'
      });
    } else if (type === 'all') {
      setConfirmModal({
        type,
        title: 'Kosongkan Semua Log Pelawat',
        message: 'PERINGATAN KRITIKAL: Adakah anda pasti mahu memadam SEMUA log akses pelawat? Semua maklumat sejarah akses pengunjung live yang sebenar akan dikosongkan sepenuhnya.',
        confirmText: 'Sahkan Padam Semua',
        badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200',
        btnStyle: 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white shadow-rose-500/10'
      });
    } else if (type === 'notif') {
      setConfirmModal({
        type,
        title: 'Kosongkan Notifikasi Sistem',
        message: 'Adakah anda pasti mahu memadam SEMUA rekod notifikasi sistem dalam pangkalan data? Tindakan ini tidak boleh diundur.',
        confirmText: 'Sahkan Padam Notifikasi',
        badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
        btnStyle: 'bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-amber-500/10'
      });
    }
  };

  const handleConfirmedReset = async () => {
    if (!confirmModal) return;
    const { type } = confirmModal;
    setConfirmModal(null);

    if (type === 'owner') {
      setIsResettingOwner(true);
      setStatusMessage(null);
      try {
        const batch = writeBatch(db);
        let count = 0;
        
        // Filter logs marked as owner or matching owner email
        const ownerLogs = visitorLogs.filter(v => v.isOwner || v.email === 'muhaiminzeeismail@gmail.com');
        ownerLogs.forEach(v => {
          batch.delete(doc(db, 'visitorLogs', v.id));
          count++;
        });

        // Filter adminNotifications related to Owner logins
        const ownerNotifs = notifications.filter(n => n.title?.includes('Owner') || n.message?.includes('muhaiminzeeismail@gmail.com'));
        ownerNotifs.forEach(n => {
          batch.delete(doc(db, 'adminNotifications', n.id));
          count++;
        });

        await batch.commit();
        setStatusMessage(`Berjaya memadam ${count} rekod aktiviti/notifikasi pengujian oleh Owner.`);
        setTimeout(() => setStatusMessage(null), 5000);
      } catch (error) {
        console.error(error);
        alert("Gagal memadam rekod pengujian: " + (error as Error).message);
      } finally {
        setIsResettingOwner(false);
      }
    } else if (type === 'all') {
      setIsResettingAll(true);
      setStatusMessage(null);
      try {
        const q = query(collection(db, 'visitorLogs'));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
        setStatusMessage("Semua sejarah log masuk dan akses pelawat telah dikosongkan sepenuhnya.");
        setTimeout(() => setStatusMessage(null), 5000);
      } catch (error) {
        console.error(error);
        alert("Gagal menetapkan semula log: " + (error as Error).message);
      } finally {
        setIsResettingAll(false);
      }
    } else if (type === 'active') {
      setIsResettingActive(true);
      setStatusMessage(null);
      try {
        const q = query(collection(db, 'activeViewers'));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
        setStatusMessage("Semua sesi aktif lama telah dibersihkan.");
        setTimeout(() => setStatusMessage(null), 5000);
      } catch (error) {
        console.error(error);
        alert("Gagal membersihkan sesi aktif: " + (error as Error).message);
      } finally {
        setIsResettingActive(false);
      }
    } else if (type === 'notif') {
      setIsResettingNotif(true);
      setStatusMessage(null);
      try {
        const q = query(collection(db, 'adminNotifications'));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
        setStatusMessage("Semua notifikasi sistem telah berjaya dipadamkan.");
        setTimeout(() => setStatusMessage(null), 5000);
      } catch (error) {
        console.error(error);
        alert("Gagal memadam notifikasi: " + (error as Error).message);
      } finally {
        setIsResettingNotif(false);
      }
    }
  };

  // Export Full Database to JSON
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const pastisSnap = await getDocs(collection(db, 'pastis'));
      const feedbacksSnap = await getDocs(collection(db, 'feedbacks'));
      const statsSnap = await getDocs(collection(db, 'siteStats'));
      const logsSnap = await getDocs(collection(db, 'visitorLogs'));
      const notifsSnap = await getDocs(collection(db, 'adminNotifications'));

      const backupData = {
        exportedAt: new Date().toISOString(),
        projectName: 'PASTI Kuala Langat Safety System',
        collections: {
          pastis: pastisSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          feedbacks: feedbacksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          siteStats: statsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          visitorLogs: logsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          adminNotifications: notifsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PASTI_Kuala_Langat_Firestore_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage("✅ Backup data Firestore berjaya dimuat turun!");
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengeksport data: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Import Full Database from JSON
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.collections) {
        throw new Error("Format JSON tidak sah. Sila pastikan fail eksport daripada sistem.");
      }

      let restoredCount = 0;
      const batch = writeBatch(db);

      if (Array.isArray(backup.collections.pastis)) {
        for (const item of backup.collections.pastis) {
          const { id, ...data } = item;
          const ref = id ? doc(db, 'pastis', id) : doc(collection(db, 'pastis'));
          batch.set(ref, data, { merge: true });
          restoredCount++;
        }
      }

      if (Array.isArray(backup.collections.siteStats)) {
        for (const item of backup.collections.siteStats) {
          const { id, ...data } = item;
          const ref = doc(db, 'siteStats', id || 'visitors');
          batch.set(ref, data, { merge: true });
          restoredCount++;
        }
      }

      if (Array.isArray(backup.collections.feedbacks)) {
        for (const item of backup.collections.feedbacks) {
          const { id, ...data } = item;
          const ref = id ? doc(db, 'feedbacks', id) : doc(collection(db, 'feedbacks'));
          batch.set(ref, data, { merge: true });
          restoredCount++;
        }
      }

      await batch.commit();
      setStatusMessage(`🎉 Berjaya memindahkan & memulihkan ${restoredCount} rekod pangkalan data ke projek Firebase ini!`);
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert("Gagal memulihkan data: " + err.message);
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Auto-seed Default Data & Collections
  const handleAutoSeed = async () => {
    setIsSeeding(true);
    try {
      const pastisSnap = await getDocs(collection(db, 'pastis'));
      const batch = writeBatch(db);

      if (pastisSnap.empty) {
        DEFAULT_PASTI_SEED.forEach(pasti => {
          const ref = doc(collection(db, 'pastis'));
          batch.set(ref, pasti);
        });
      }

      const statsRef = doc(db, 'siteStats', 'visitors');
      batch.set(statsRef, { count: 1, browseCount: 1 }, { merge: true });

      const notifRef = doc(collection(db, 'adminNotifications'));
      batch.set(notifRef, {
        title: 'Pangkalan Data Baharu Dicipta',
        message: 'Koleksi pangkalan data PASTI & statistik telah auto-jana dengan jayanya.',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      setStatusMessage("🌱 Koleksi pangkalan data PASTI (12 Cawangan) & statistik kaunter telah auto-jana dengan jayanya!");
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert("Gagal auto-seed data: " + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const [isResettingNotif, setIsResettingNotif] = useState(false);

  const [testResult, setTestResult] = useState<{ status: string; ms: number; message: string } | null>(null);
  const handleTestFirebaseConnection = async () => {
    setTestResult(null);
    const startTime = performance.now();
    try {
      // Simple write & delete test or just read
      const testRef = doc(collection(db, 'system_test'), 'ping');
      await setDoc(testRef, { timestamp: new Date().toISOString() });
      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);
      
      // Determine logged in user
      const currentUserEmail = auth.currentUser ? auth.currentUser.email : 'Mod Awam';
      
      setTestResult({
        status: 'SUCCESS',
        ms: timeMs,
        message: `Sambungan ke pangkalan data berjaya! Log masuk sebagai: ${currentUserEmail} (Respons: ${timeMs}ms)`
      });
    } catch (err: any) {
      const endTime = performance.now();
      setTestResult({
        status: 'FAILED',
        ms: Math.round(endTime - startTime),
        message: `Ralat sambungan: ${err.message}`
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
          ⚙️ Admin Data Management Panel
        </h2>
        <p className="text-sm text-slate-500">Panel pemantauan sistem, akses keselamatan, notifikasi dan statistik aktiviti.</p>
      </div>

      {/* Stats Cards with Browse Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">Pelawat Aktif</p>
            <p className="text-2xl font-black text-emerald-800 mt-0.5">{activeViewers.length} Live</p>
          </div>
          <div className="text-emerald-500 bg-emerald-100 p-2.5 rounded-xl shrink-0">
            <User size={20} />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider">Jumlah Pelawat</p>
            <p className="text-2xl font-black text-blue-800 mt-0.5">{totalViews !== null ? totalViews : '...'}</p>
          </div>
          <div className="text-blue-500 bg-blue-100 p-2.5 rounded-xl shrink-0">
            <Eye size={20} />
          </div>
        </div>

        {/* PROMINENT BROWSING COUNT CARD */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <MousePointer size={12} className="text-indigo-600" /> Jumlah Layaran (Browse)
            </p>
            <p className="text-2xl font-black text-indigo-900 mt-0.5">
              {browseCount !== null ? browseCount : (totalViews || visitorLogs.length)}
            </p>
          </div>
          <div className="text-indigo-600 bg-indigo-100 p-2.5 rounded-xl shrink-0">
            <BarChart3 size={20} />
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider">Log Akses Awam</p>
            <p className="text-2xl font-black text-teal-800 mt-0.5">
              {visitorLogs.filter(v => !v.isLoggedIn && !v.isOwner).length} Awam
            </p>
          </div>
          <div className="text-teal-600 bg-teal-100 p-2.5 rounded-xl shrink-0">
            <Globe size={20} />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Mesej Notifikasi</p>
            <p className="text-2xl font-black text-amber-800 mt-0.5">{notifications.length} Alert</p>
          </div>
          <div className="text-amber-500 bg-amber-100 p-2.5 rounded-xl shrink-0">
            <Bell size={20} />
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>✨</span> {statusMessage}
        </div>
      )}

      {/* FIREBASE AUTO-SETUP & CONFIG WIZARD */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/90 text-white p-5 rounded-2xl border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Key size={18} className="animate-pulse" />
              <span>🔥 Auto-Setup Projek Firebase Baharu (Config Wizard)</span>
              {isUsingCustomFirebase ? (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-extrabold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Custom Project: {currentProjectId}
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/40 font-extrabold">
                  Sandbox Mode: {currentProjectId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Tampal kod <code>const firebaseConfig = &#123; ... &#125;</code> dari Firebase Console untuk menukar pangkalan data secara automatik & dapatkan pemboleh ubah persekitaran (Env Vars) untuk Netlify.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWizardOpen(!isWizardOpen)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Key size={14} />
              {isWizardOpen ? "Tutup Setup Wizard" : "🔥 Buka Setup Wizard Projek"}
            </button>
            {isUsingCustomFirebase && (
              <button
                onClick={handleResetToSandbox}
                className="bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-extrabold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Kembali ke Projek Sandbox AI Studio"
              >
                Reset Ke Sandbox
              </button>
            )}
          </div>
        </div>

        {/* Wizard Panel */}
        <AnimatePresence>
          {isWizardOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-amber-500/20 space-y-4 overflow-hidden"
            >
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Terminal size={14} />
                  <span>1. Tampal Kod SDK Firebase dari Firebase Console:</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Salin kod skrip dari <b>Firebase Console &gt; Project Settings &gt; General &gt; Your apps &gt; SDK setup (Config)</b> dan tampal di bawah:
                </p>
                <textarea
                  value={pastedConfig}
                  onChange={(e) => setPastedConfig(e.target.value)}
                  placeholder={`Contoh tampalan:\nconst firebaseConfig = {\n  apiKey: "AIzaSyD...",\n  authDomain: "pasti-kl.firebaseapp.com",\n  projectId: "pasti-kl",\n  storageBucket: "pasti-kl.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcde"\n};`}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 text-amber-100 font-mono text-xs p-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {parsedEnv ? (
                <div className="space-y-4 bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-emerald-300 font-black text-xs">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>Projek Berjaya Dikesan: <code className="bg-emerald-900/60 px-2 py-0.5 rounded text-white">{parsedEnv.projectId}</code></span>
                    </span>
                    <button
                      onClick={handleSaveCustomFirebase}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl cursor-pointer shadow-md transition-all animate-bounce"
                    >
                      🚀 Sambung & Tukar Pangkalan Data Sekarang
                    </button>
                  </div>

                  {/* Extracted JSON Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase">API Key</span>
                      <span className="text-amber-200 truncate block">{parsedEnv.apiKey || '-'}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase">Project ID</span>
                      <span className="text-emerald-300 font-bold truncate block">{parsedEnv.projectId || '-'}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase">Auth Domain</span>
                      <span className="text-amber-200 truncate block">{parsedEnv.authDomain || '-'}</span>
                    </div>
                  </div>

                  {/* Generated Netlify Env block */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Terminal size={14} className="text-indigo-400" />
                        <span>2. Salin Nilai Ini Ke Netlify &gt; Site Settings &gt; Environment Variables:</span>
                      </span>
                      <button
                        onClick={handleCopyEnvText}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
                      >
                        {copiedEnv ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                        <span>{copiedEnv ? "Telah Disalin!" : "Salin Semua Env Netlify"}</span>
                      </button>
                    </div>

                    <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto selection:bg-emerald-800">
                      {generatedEnvText}
                    </pre>
                  </div>
                </div>
              ) : (
                pastedConfig.trim() && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>Tidak dapat mengesan kunci Firebase yang sah. Sila pastikan anda menampal keseluruhan blok <code>const firebaseConfig = &#123; ... &#125;</code>.</span>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DATA MIGRATION & BACKUP SUITE */}
      <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900 text-white p-5 rounded-2xl border border-emerald-700/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
            <Database size={18} className="animate-pulse" />
            <span>🔄 Pindahan & Salinan Pangkalan Data (Migration Suite)</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">Firebase Helper</span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Pindahkan data dari projek sandbox ini ke projek Firebase peribadi baharu anda dalam beberapa saat. Muat turun backup JSON, atau muat naik untuk memulihkan semua koleksi PASTI, laporan & statistik.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Export JSON Button */}
          <button
            disabled={isExporting}
            onClick={handleExportBackup}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download size={14} className={isExporting ? "animate-bounce" : ""} />
            {isExporting ? "Mengeksport..." : "Eksport Backup JSON"}
          </button>

          {/* Import JSON Button */}
          <label className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-lg shadow-indigo-600/20 border border-indigo-400/30">
            <Upload size={14} className={isImporting ? "animate-spin" : ""} />
            {isImporting ? "Memulihkan..." : "Muat Naik & Pulih JSON"}
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              disabled={isImporting}
              className="hidden"
            />
          </label>

          {/* Auto-Seed Default Data */}
          <button
            disabled={isSeeding}
            onClick={handleAutoSeed}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-teal-800/80 hover:bg-teal-700 text-teal-200 font-extrabold text-xs py-2.5 px-3.5 rounded-xl cursor-pointer transition-all border border-teal-600/60"
            title="Auto-jana 12 cawangan PASTI & kaunter statistik secara automatik"
          >
            <Sparkles size={14} className={isSeeding ? "animate-spin" : ""} />
            {isSeeding ? "Penjadualan..." : "Auto-Seed 12 PASTI"}
          </button>

          {/* Test Firebase Connection */}
          <button
            onClick={handleTestFirebaseConnection}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-600/20"
            title="Uji sambungan Pangkalan Data Firebase dan kelajuan masa respons"
          >
            <RefreshCw size={14} className={testResult === null && isExporting ? "animate-spin" : ""} />
            Uji Sambungan Firebase
          </button>

          {/* View Raw Database Data */}
          <button
            onClick={handleFetchDbData}
            disabled={isFetchingData}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-lg shadow-purple-600/20"
            title="Papar data pangkalan data semasa"
          >
            <FileText size={14} className={isFetchingData ? "animate-spin" : ""} />
            {isFetchingData ? "Memuat..." : "Lihat Data Pangkalan Data"}
          </button>
        </div>
      </div>

      {viewDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Database size={16} className="text-purple-400" />
                Data Pangkalan Data (Firestore)
              </h3>
              <button 
                onClick={() => setViewDataModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-4 shrink-0 overflow-x-auto text-xs font-bold text-slate-700">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> 
                Koleksi PASTI: {dbData?.pastis?.length || 0}
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> 
                Koleksi Maklum Balas: {dbData?.feedbacks?.length || 0}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50 space-y-6">
              {!dbData ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw size={24} className="text-slate-400 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-800">Koleksi: pastis</h4>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[10px] font-mono overflow-auto border border-slate-800 shadow-inner max-h-64">
                      {JSON.stringify(dbData.pastis, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-800">Koleksi: feedbacks</h4>
                    <pre className="bg-slate-900 text-blue-400 p-4 rounded-xl text-[10px] font-mono overflow-auto border border-slate-800 shadow-inner max-h-96">
                      {JSON.stringify(dbData.feedbacks, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {testResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${testResult.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="mt-0.5">
            {testResult.status === 'SUCCESS' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-rose-500" />}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-extrabold">{testResult.status === 'SUCCESS' ? 'Ujian Berjaya' : 'Ujian Gagal'}</h4>
            <p className="font-medium text-xs opacity-90">{testResult.message}</p>
            {testResult.status === 'SUCCESS' && (
              <p className="text-[10px] font-mono font-bold bg-white/60 px-2 py-0.5 rounded-md inline-block border border-black/5">Masa Respons Pangkalan Data: {testResult.ms}ms</p>
            )}
          </div>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Clean & Reset Actions Container */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold flex items-center gap-2 text-amber-400">
            <Layers size={16} /> Pembersihan Rekod Masa Nyata & Live Traffic
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Sistem merakam semua akses termasuk semasa pembinaan. Anda boleh memadamkan rekod pengujian oleh <b>Owner</b> sahaja untuk membezakan ujian simulasi dengan pengumuman/pengaruh pelawat live yang asli.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Reset Owner Logs Button */}
          <button
            disabled={isResettingOwner}
            onClick={() => openConfirmModal('owner')}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2 px-3.5 rounded-xl cursor-pointer transition-all shadow-md shadow-amber-500/10"
          >
            <RefreshCw size={13} className={isResettingOwner ? "animate-spin" : ""} />
            {isResettingOwner ? "Memadam..." : "Reset Rekod Ujian (Owner)"}
          </button>

          {/* Reset Active Sessions */}
          <button
            disabled={isResettingActive}
            onClick={() => openConfirmModal('active')}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-300 font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer transition-all border border-slate-700"
          >
            <RefreshCw size={13} className={isResettingActive ? "animate-spin" : ""} />
            {isResettingActive ? "Menetapkan..." : "Reset Sesi Aktif"}
          </button>

          {/* Reset All Access Logs */}
          <button
            disabled={isResettingAll}
            onClick={() => openConfirmModal('all')}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl cursor-pointer transition-all shadow-md shadow-rose-600/15"
          >
            <Trash2 size={13} className={isResettingAll ? "animate-spin" : ""} />
            {isResettingAll ? "Eksport & Bersih..." : "Kosongkan Semua Log"}
          </button>

          {/* Reset Notifications */}
          <button
            disabled={isResettingNotif}
            onClick={() => openConfirmModal('notif')}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl cursor-pointer transition-all shadow-md shadow-amber-600/15"
            title="Padam Semua Notifikasi Sistem"
          >
            <Trash2 size={13} className={isResettingNotif ? "animate-spin" : ""} />
            {isResettingNotif ? "Memadam..." : "Kosongkan Notifikasi"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Viewers Column */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            Pelawat Aktif Sekarang
          </h3>
          <div className="space-y-2.5 overflow-auto max-h-[450px] flex-1">
            {activeViewers.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">Tiada pelawat aktif dikesan.</p>
            ) : (
              activeViewers.map(a => {
                // filter viewers seen in the last 2.5 minutes
                const lastSeenDate = a.lastSeen?.toDate?.() || new Date();
                const isRecentlyActive = Date.now() - lastSeenDate.getTime() < 150000;
                if (!isRecentlyActive) return null;
                
                const isOwner = a.isOwner || (a.isLoggedIn && a.email === 'muhaiminzeeismail@gmail.com');
                
                return (
                  <div key={a.id} className={`p-3 rounded-xl border text-xs transition-all ${isOwner ? 'bg-amber-50/70 border-amber-200 shadow-xs' : 'bg-emerald-50/50 border-emerald-100/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[10px] text-slate-400">ID: {a.sessionId?.substring(0, 8)}...</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isOwner ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isOwner ? '👑 Owner' : 'Online'}
                      </span>
                    </div>
                    {a.isLoggedIn ? (
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1">
                          👤 {a.displayName || 'Pengguna Gmail'}
                        </p>
                        <p className="text-slate-500 font-mono text-[10px]">{a.email}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">🌐 Pelawat Awam (Anonymous)</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      ⏱ Aktif: {lastSeenDate.toLocaleTimeString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Access History List */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:col-span-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-indigo-500" size={18} />
              Log Masuk & Layaran
            </h3>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setLogFilter('all')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${logFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua ({visitorLogs.length})
              </button>
              <button
                onClick={() => setLogFilter('public')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${logFilter === 'public' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Awam ({visitorLogs.filter(v => !v.isLoggedIn && !v.isOwner).length})
              </button>
              <button
                onClick={() => setLogFilter('admin')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${logFilter === 'admin' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="space-y-2.5 overflow-auto max-h-[450px] flex-1">
            {visitorLogs.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">Tiada rekod log akses.</p>
            ) : (
              visitorLogs
                .filter(v => {
                  const isOwner = v.isOwner || (v.isLoggedIn && v.email === 'muhaiminzeeismail@gmail.com');
                  if (logFilter === 'public') return !v.isLoggedIn && !isOwner;
                  if (logFilter === 'admin') return v.isLoggedIn || isOwner;
                  return true;
                })
                .slice(0, 40)
                .map(v => {
                  const isOwner = v.isOwner || (v.isLoggedIn && v.email === 'muhaiminzeeismail@gmail.com');
                  return (
                    <div key={v.id} className={`p-3 rounded-xl border text-xs transition-all ${isOwner ? 'bg-amber-50/70 border-amber-200 shadow-xs' : v.isLoggedIn ? 'bg-indigo-50/70 border-indigo-100' : 'bg-emerald-50/40 border-emerald-100/60'}`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isOwner ? 'bg-amber-100 text-amber-800' : v.isLoggedIn ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {isOwner ? '👑 Akses Owner' : v.isLoggedIn ? 'Google Login' : '🌐 Akses Awam'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {v.entryTime?.toDate?.() ? v.entryTime.toDate().toLocaleString() : 'Baru sahaja'}
                        </span>
                      </div>
                      {v.isLoggedIn ? (
                        <div>
                          <p className="font-bold text-slate-800">{v.displayName}</p>
                          <p className="text-slate-500 font-mono text-[10px] mt-0.5">{v.email}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                            <span>📱 Sesi Awam:</span> <span className="font-mono text-[10px] text-slate-500">{v.sessionId?.substring(0, 16)}...</span>
                          </p>
                          {v.page && (
                            <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                              Halaman: {v.page}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </section>

        {/* Notifications Column */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bell className="text-amber-500" size={18} />
            Notifikasi Sistem / Transaksi
          </h3>
          <div className="space-y-2.5 overflow-auto max-h-[450px] flex-1">
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">Tiada rekod notifikasi baru.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/50 text-xs whitespace-pre-line">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-slate-800 text-[11px]">{n.title}</p>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {n.createdAt?.toDate?.() ? n.createdAt.toDate().toLocaleTimeString() : 'Baru'}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Popup Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                confirmModal.type === 'owner' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 
                confirmModal.type === 'active' ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : 
                'bg-gradient-to-r from-rose-500 to-red-600'
              }`} />

              <div className="flex items-start gap-3.5 mb-4 mt-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'owner' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                  confirmModal.type === 'active' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                  'bg-rose-50 text-rose-600 border border-rose-150'
                }`}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${confirmModal.badgeStyle}`}>
                    {confirmModal.type === 'owner' ? 'Ujian Owner' : confirmModal.type === 'active' ? 'Sesi Footprint' : 'Padam Penuh'}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 mt-1">{confirmModal.title}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                {confirmModal.message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmedReset}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black shadow-lg transition-all text-center cursor-pointer ${confirmModal.btnStyle}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
