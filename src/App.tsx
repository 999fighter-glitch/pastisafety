/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, doc, updateDoc, deleteDoc, writeBatch, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, handleFirestoreError, OperationType } from './firebase';
import Dashboard from './components/Dashboard';
import FeedbackForm from './components/FeedbackForm';
import PastiManager from './components/PastiManager';
import TelegramSimulator from './components/TelegramSimulator';
import ExtinguisherMonitor from './components/ExtinguisherMonitor';
import AdminDataManagement from './components/AdminDataManagement';
import AdminNotificationToast from './components/AdminNotificationToast';
import PublicReportsList from './components/PublicReportsList';
import VisitorStats from './components/VisitorStats';
import UserGuide from './components/UserGuide';
import { Pasti } from './types';
import { ShieldCheck, ArrowRight, Loader2, BookOpen, Pin, PinOff, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [pastis, setPastis] = useState<Pasti[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showOwnerWelcomeModal, setShowOwnerWelcomeModal] = useState(false);
  const [view, setView] = useState<'dashboard' | 'feedback' | 'manage' | 'telegrams' | 'extinguisher-monitor' | 'reports-list' | 'admin' | 'guide'>('feedback');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavPinned, setIsNavPinned] = useState(false);
  const [isIntroLoading, setIsIntroLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleNavMouseEnter = () => {
    setIsSidebarOpen(true);
  };

  const handleNavMouseLeave = () => {
    if (!isNavPinned) {
      setIsSidebarOpen(false);
    }
  };

  // Notifications listener
  const addNotification = async (title: string, message: string, noLocalToast: boolean = false) => {
    if (!noLocalToast) {
      setNotifications(prev => [{ title, message, timestamp: Date.now() }, ...prev].slice(0, 50));
    }
    
    // Send to Telegram Bot via server API
    try {
        fetch('/api/send-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `[${title}]\n${message}` }),
        });
    } catch(e) { console.error("Error triggering Telegram bot: ", e); }

    // Save to Firestore for Admin Data Management panel (submit inbox)
    try {
        await addDoc(collection(db, 'adminNotifications'), {
            title,
            message,
            createdAt: new Date()
        });
    } catch(e) { handleFirestoreError(e, OperationType.CREATE, 'adminNotifications'); }
  };

  // Simulate loading progress
  useEffect(() => {
    if (isIntroLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsIntroLoading(false);
            }, 600);
            return 100;
          }
          return prev + 10;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isIntroLoading]);

  // Track page view changes for Browse Count analytics
  useEffect(() => {
    if (!isIntroLoading) {
      setDoc(doc(db, 'siteStats', 'visitors'), { browseCount: increment(1) }, { merge: true }).catch(() => {});
    }
  }, [view, isIntroLoading]);

  useEffect(() => {
    // Session start notification (Telegram Bot & Internal Log)
    const sessionStarted = sessionStorage.getItem('session_notified');
    if (!sessionStarted) {
      // Don't show locally to public user, let it just send to Firestore
      addNotification('Sistem Diakses', 'Seorang pengguna baru telah membuka sistem PASTI Kuala Langat.', true);
      sessionStorage.setItem('session_notified', 'true');
    }

    // Check for auth redirect result (useful when popup is blocked on mobile browsers)
    getRedirectResult(auth).then(result => {
      if (result && result.user) {
        addNotification('Admin Login', `Admin (${result.user.displayName || result.user.email}) telah log masuk ke sistem.`, false);
      }
    }).catch(err => {
      console.warn('Redirect auth error:', err);
    });

    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // Admin Notification real-time listener
  useEffect(() => {
    if (!user || user.email !== 'muhaiminzeeismail@gmail.com') return;
    let isFirstLoad = true;
    const unsub = onSnapshot(collection(db, 'adminNotifications'), (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // To avoid duplicating toasts that the admin triggered themselves (e.g., 'Rekod Dipadam'), 
          // we only trigger the local popup if it's 'Sistem Diakses' or similar incoming from other users.
          if (data.title === 'Sistem Diakses' || data.title === 'Rekod Baru Dihantar' || data.title === 'Rekod Dikemaskini') {
            setNotifications(prev => [{ title: data.title, message: data.message, timestamp: Date.now() }, ...prev].slice(0, 50));
          }
        }
      });
    }, (error) => {
      console.error('Error listening to adminNotifications:', error);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (user && user.email === 'muhaiminzeeismail@gmail.com') {
      let alreadyShown = false;
      try {
        alreadyShown = sessionStorage.getItem('owner_welcome_shown') === 'true';
      } catch (e) {
        console.warn('sessionStorage access denied:', e);
      }
      
      if (!alreadyShown) {
        setShowOwnerWelcomeModal(true);
        try {
          sessionStorage.setItem('owner_welcome_shown', 'true');
        } catch (e) {
          console.warn('sessionStorage access denied:', e);
        }
        
        // Save notification to Admin Data Management list (Firestore)
        // No telegram notification is triggered for privacy / silent log.
        addDoc(collection(db, 'adminNotifications'), {
          title: 'Akses Owner Dicas',
          message: `Owner (${user.email}) telah mendaftar masuk ke aplikasi pada ${new Date().toLocaleString()}. Panel kawalan Data Management kini aktif.`,
          createdAt: new Date()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'adminNotifications'));
      }
    }
  }, [user]);

  async function fetchPastis() {
    try {
      const snapshot = await getDocs(collection(db, 'pastis'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pasti));
      // Sort alphabetically by name (A to Z)
      data.sort((a, b) => a.name.localeCompare(b.name));
      setPastis(data);
    } catch (e) {
      console.error('Error fetching pastis:', e);
      handleFirestoreError(e, OperationType.GET, 'pastis');
    }
  }

  async function fetchSubmissions() {
    try {
      const subSnapshot = await getDocs(collection(db, 'submissions'));
      const subData = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(subData);
    } catch (e) {
      console.error('Error fetching submissions:', e);
      handleFirestoreError(e, OperationType.GET, 'submissions');
    }
  }

  useEffect(() => {
    fetchPastis();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const handleFeedbackSubmit = async (data: any) => {
    try {
      // Create a clean payload copy of the data without any undefined keys (like id)
      const cleanData = { ...data };
      if ('id' in cleanData) {
        delete cleanData.id;
      }
      // Safely delete any other potential undefined properties to prevent Firestore errors
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      // 1. Check if record has an 'id' (meaning we're updating an existing report to avoid duplicate)
      if (data.id) {
        const subRef = doc(db, 'submissions', data.id);
        await updateDoc(subRef, {
          ...cleanData,
          updatedAt: new Date()
        });
        addNotification('Rekod Dikemaskini', `Rekod Dikemaskini oleh PASTI: ${cleanData.name || 'Tiada Nama'} pada ${new Date().toLocaleString()}`);
      } else {
        // Save the safety check submission record
        await addDoc(collection(db, 'submissions'), { ...cleanData, createdAt: new Date() });
        addNotification('Rekod Baru Dihantar', `Rekod Baru Dihantar oleh PASTI: ${cleanData.name || 'Tiada Nama'} pada ${new Date().toLocaleString()}`);
      }
      
      // 2. Benarkan user awam kemaskini maklumat pasti (Update registered contact/teacher if exists)
      if (data.pastiId) {
        const pastiRef = doc(db, 'pastis', data.pastiId);
        await updateDoc(pastiRef, {
          headTeacher: data.headTeacher || '',
          phone: data.phone || ''
        });
      }
      
      fetchPastis();
      fetchSubmissions();
      return true;
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.WRITE, `submissions/${data.pastiId || 'new'}`);
      return false;
    }
  };

  const handleUpdateStatus = async (submissionId: string, field: 'emergencyDoor' | 'exitLight' | 'notificationReceived', value: string) => {
    try {
      const docRef = doc(db, 'submissions', submissionId);
      await updateDoc(docRef, {
        [field]: value
      });
      addNotification('Status Dikemaskini', `Status ${field} berjaya diubah.`);
      fetchSubmissions();
      return true;
    } catch (e) {
      console.error('Error updating status:', e);
      handleFirestoreError(e, OperationType.UPDATE, `submissions/${submissionId}`);
      return false;
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      const docRef = doc(db, 'submissions', submissionId);
      await deleteDoc(docRef);
      addNotification('Rekod Dipadam', 'Rekod PASTI berjaya dipadam.');
      fetchSubmissions();
      return true;
    } catch (e) {
      console.error('Error deleting submission:', e);
      handleFirestoreError(e, OperationType.DELETE, `submissions/${submissionId}`);
      return false;
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        const docRef = doc(db, 'submissions', id);
        batch.delete(docRef);
      });
      await batch.commit();
      addNotification('Rekod Dipadam', `${ids.length} Rekod PASTI berjaya dipadam.`);
      fetchSubmissions();
      return true;
    } catch (e) {
      console.error('Error deleting submissions:', e);
      handleFirestoreError(e, OperationType.DELETE, 'submissions/bulk');
      return false;
    }
  };

  const handleClearAllSubmissions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'submissions'));
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      fetchSubmissions();
      return true;
    } catch (e) {
      console.error('Error clearing submissions:', e);
      handleFirestoreError(e, OperationType.DELETE, 'submissions/all');
      return false;
    }
  };

  const isAdmin = user && user.email === 'muhaiminzeeismail@gmail.com';

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        addNotification('Admin Login', `Admin (${result.user.displayName || result.user.email}) telah log masuk ke sistem.`);
      }
    } catch (e: any) {
      console.error('Login error:', e);
      if (e.code === 'auth/cancelled-popup-request') {
        console.warn('Login popup closed by user.');
        return;
      }

      if (e.code === 'auth/unauthorized-domain') {
        alert(`❌ Ralat Domain Tidak Dibenarkan (auth/unauthorized-domain):\n\nDomain "${window.location.hostname}" belum didaftarkan dalam Authorized Domains di Firebase Console.\n\nSila rujuk panduan dalam fail NETLIFY_DEPLOYMENT_GUIDE.md untuk mendaftarkan domain anda atau bertukar ke Projek Firebase peribadi anda.`);
        return;
      }

      // If popup is blocked by browser or fails on mobile, fallback to Redirect method
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user' || /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect login error:', redirectErr);
        }
      }

      alert(`Gagal log masuk (${e.code || 'Ralat Popup'}). Sila pastikan pop-up dibenarkan dalam pelayar anda atau gunakan projek Firebase peribadi.`);
    }
  };
  return (
    <AnimatePresence mode="wait">
      {isIntroLoading ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white"
        >
          {/* Atmospheric background glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative text-center max-w-lg px-6 flex flex-col items-center">
            {/* Animated Badge Icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 90 }}
              className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6"
            >
              <ShieldCheck size={42} className="text-white" />
            </motion.div>

            {/* Text Title & Subtitle */}
            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent mb-2"
            >
              Sistem Pantauan Keselamatan & Kesihatan
            </motion.h1>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-slate-400 font-semibold tracking-widest text-xs uppercase mb-12"
            >
              PASTI KUALA LANGAT
            </motion.p>

            {/* Custom Progress Bar Indicator */}
            <div className="w-64 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mb-4 p-[2px]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-slate-500 font-mono"
            >
              <Loader2 size={12} className="animate-spin text-emerald-500" />
              <span>Memuat turun sistem... {loadingProgress}%</span>
            </motion.div>

            {/* Skip Option */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: loadingProgress > 20 ? 1 : 0 }}
              onClick={() => setIsIntroLoading(false)}
              className="mt-8 flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/30 bg-slate-900/50 hover:bg-emerald-950/20 px-4 py-2 rounded-full transition-all cursor-pointer"
            >
              <span>Langkau Masuk</span>
              <ArrowRight size={12} />
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="main-app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex h-screen bg-slate-50 font-sans text-slate-800 relative overflow-hidden"
        >
          {/* Left edge hover trigger zone when sidebar is closed */}
          {!isSidebarOpen && (
            <div 
              onMouseEnter={handleNavMouseEnter}
              className="fixed top-0 left-0 bottom-0 w-3 z-30 cursor-pointer group flex items-center justify-center bg-transparent hover:bg-emerald-500/10 transition-colors"
              title="Tuding tetikus di sini untuk Papar Menu Nav"
            >
              <div className="w-1 h-12 bg-emerald-500/30 rounded-full group-hover:bg-emerald-500 group-hover:h-20 transition-all" />
            </div>
          )}

          {/* Sidebar drawer/navigation */}
          <aside 
            onMouseEnter={handleNavMouseEnter}
            onMouseLeave={handleNavMouseLeave}
            className={`${
              isSidebarOpen 
                ? 'flex w-64 p-6 translate-x-0 opacity-100 shadow-2xl' 
                : 'hidden w-0 p-0 overflow-hidden -translate-x-full opacity-0 pointer-events-none'
            } bg-slate-900 text-white flex-col z-40 shrink-0 h-full fixed lg:relative transition-all duration-300 ease-in-out border-r border-slate-800`}
          >
            <div className="min-w-[200px]">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold tracking-tight">PASTI <span className="text-emerald-400">Kuala Langat</span></h1>
                <button
                  onClick={() => setIsNavPinned(!isNavPinned)}
                  className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center gap-1 ${
                    isNavPinned 
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isNavPinned ? "Menu Disemat (Klik untuk Auto-Sembunyi pada hover)" : "Semat Menu (Kekal Terbuka)"}
                >
                  <Pin size={13} className={isNavPinned ? "fill-emerald-400 text-emerald-400" : ""} />
                  <span className="text-[10px] font-medium">{isNavPinned ? 'Pinned' : 'Auto'}</span>
                </button>
              </div>

              <nav className="space-y-2">
                  <button 
                    onClick={() => { setView('feedback'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                    className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'feedback' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    Borang Maklum Balas
                  </button>
                  <button 
                    onClick={() => { setView('reports-list'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                    className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'reports-list' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    📋 Rekod Laporan (Awam)
                  </button>
                  <button 
                    onClick={() => { setView('guide'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                    className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'guide' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    📖 Panduan Pengguna
                  </button>
                  {user && (
                    <>
                      <button 
                        onClick={() => { setView('dashboard'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                        className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'dashboard' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        Dashboard
                      </button>
                      <button 
                        onClick={() => { setView('manage'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                        className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'manage' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        Pengurusan Kontak PASTI
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => { setView('admin'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                          className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'admin' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                          ⚙️ Data Management
                        </button>
                      )}
                      {isAdmin && (
                        <button 
                          onClick={() => { setView('extinguisher-monitor'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                          className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'extinguisher-monitor' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                          📅 Kalendar & Pemadam Api
                        </button>
                      )}
                      <button 
                        onClick={() => { setView('telegrams'); if (window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }} 
                        className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${view === 'telegrams' ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        Simulasi Bot Telegram
                      </button>
                    </>
                  )}
              </nav>
            </div>
            <div className="mt-auto min-w-[200px] pt-4 border-t border-slate-800">
                {user ? (
                  <button 
                    onClick={() => { 
                      const userEmail = user.email;
                      signOut(auth); 
                      addNotification('Admin Logout', `Admin (${userEmail}) telah log keluar dari sistem.`);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false); 
                    }} 
                    className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                ) : (
                  <button 
                    onClick={() => { login(); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                    className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors font-medium cursor-pointer"
                  >
                    Admin Login
                  </button>
                )}
            </div>
          </aside>

          {/* Click away overlay when sidebar is open on smaller screen layouts/clean interaction */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/40 z-10 transition-opacity duration-300 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main content viewport */}
          <main 
            onClick={() => { if (isSidebarOpen && window.innerWidth < 1024 && !isNavPinned) setIsSidebarOpen(false); }}
            className="flex-1 overflow-auto flex flex-col"
          >
            <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsSidebarOpen(!isSidebarOpen); 
                    if (isSidebarOpen) setIsNavPinned(false);
                  }} 
                  onMouseEnter={handleNavMouseEnter}
                  className="mr-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                  title="Tuding tetikus untuk Papar Menu, atau Klik untuk Buka/Tutup"
                >
                  <Menu className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">{isSidebarOpen ? "Sembunyi Menu" : "Papar Menu Nav"}</span>
                  <span className="text-[10px] text-slate-400 font-normal hidden lg:inline ml-0.5">(Hover)</span>
                </button>
                <span className="text-slate-500 text-xs sm:text-sm font-medium">{user ? `Selamat Datang, ${user.displayName} (${user.email})` : 'Mod Awam'}</span>
                <div className="ml-auto">
                    <VisitorStats />
                </div>
            </header>

            <div className="p-8 space-y-6 max-w-7xl mx-auto flex-1">
                {view === 'feedback' && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <FeedbackForm pastis={pastis} submissions={submissions} onSubmit={handleFeedbackSubmit} isAdmin={!!isAdmin} />
                  </motion.div>
                )}
                {view === 'reports-list' && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <PublicReportsList pastis={pastis} submissions={submissions} />
                  </motion.div>
                )}
                {view === 'guide' && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <UserGuide user={user} isAdmin={!!isAdmin} setView={setView} />
                  </motion.div>
                )}
                {user && view === 'admin' && isAdmin && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <AdminDataManagement />
                  </motion.div>
                )}
                {user && view === 'dashboard' && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <Dashboard isAdmin={!!isAdmin} pastis={pastis} submissions={submissions} onUpdateStatus={handleUpdateStatus} onDeleteSubmission={handleDeleteSubmission} onDeleteMultiple={handleDeleteMultiple} onClearAllSubmissions={handleClearAllSubmissions} />
                  </motion.div>
                )}
                {user && view === 'manage' && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <PastiManager pastis={pastis} onPastiAdded={fetchPastis} addNotification={addNotification} />
                  </motion.div>
                )}
                {user && view === 'extinguisher-monitor' && isAdmin && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <ExtinguisherMonitor pastis={pastis} submissions={submissions} onUpdateStatus={handleUpdateStatus} onRefresh={fetchSubmissions} />
                  </motion.div>
                )}
                {user && view === 'telegrams' && (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <TelegramSimulator notifications={notifications} />
                  </motion.div>
                )}
            </div>
          </main>
          {/* Floating Toasts (Visible to admin only) */}
          {isAdmin && <AdminNotificationToast notifications={notifications} user={user} />}

          {showOwnerWelcomeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-sm w-full border border-emerald-100 shadow-2xl p-6 relative overflow-hidden"
              >
                {/* Background Accent Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-500" />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl">
                    👑
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">Selamat Pulang, Owner!</h3>
                    <p className="text-[11px] font-mono text-slate-400">muhaiminzeeismail@gmail.com</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <p>
                    Sistem mengesan log masuk oleh pemilik asal aplikasi. Akses pentadbiran penuh telah diaktifkan secara automatik.
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600">Aktiviti Direkodkan</span>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Aktiviti log masuk ini telah disimpan dalam log keselamatan keselamatan Data Management (Notifikasi). Tiada mesej dihantar ke bot telegram bagi menjaga kerahsiaan.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setView('admin');
                      setShowOwnerWelcomeModal(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all text-center cursor-pointer"
                  >
                    Urus Data Management
                  </button>
                  <button
                    onClick={() => setShowOwnerWelcomeModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

}

