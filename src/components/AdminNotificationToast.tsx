import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Globe, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface NotificationToastProps {
  notifications: any[];
  user?: any;
}

export default function AdminNotificationToast({ notifications, user }: NotificationToastProps) {
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [showPublicPopup, setShowPublicPopup] = useState<boolean>(false);
  const [toastQueue, setToastQueue] = useState<any[]>([]);

  // Check initial public access popup on mount
  useEffect(() => {
    const publicPopupDismissed = sessionStorage.getItem('public_access_popup_dismissed');
    if (!user && !publicPopupDismissed) {
      setShowPublicPopup(true);
    }
  }, [user]);

  // Queue and trigger notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setActiveToast(latest);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const dismissPublicPopup = () => {
    setShowPublicPopup(false);
    try {
      sessionStorage.setItem('public_access_popup_dismissed', 'true');
    } catch (e) {
      console.warn('sessionStorage not available', e);
    }
  };

  return (
    <>
      {/* 1. PUBLIC USER ACCESS WELCOME POPUP MODAL/TOAST */}
      <AnimatePresence>
        {showPublicPopup && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[80] sm:w-96 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-5 backdrop-blur-md"
          >
            <div className="flex items-start gap-3.5">
              <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30 shrink-0 mt-0.5">
                <Globe size={20} className="animate-pulse" />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> Akses Awam (Public User)
                  </span>
                  <button
                    onClick={dismissPublicPopup}
                    className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                    title="Tutup Notifikasi"
                  >
                    <X size={16} />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 pt-1">
                  Akses Awam Dibenarkan!
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Selamat datang! Anda sedang mengakses <b>Sistem Pengurusan Keselamatan PASTI Kuala Langat</b> sebagai Pengguna Awam. Sila gunakan borang semakan untuk rekod laporan keselamatan.
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-400" /> Sesi Live Aktif
                  </span>
                  <button
                    onClick={dismissPublicPopup}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    Faham & Teruskan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. REAL-TIME SYSTEM ACTIVITY TOAST */}
      <AnimatePresence>
        {activeToast && !showPublicPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[70] bg-white text-slate-900 rounded-2xl shadow-2xl border border-emerald-200 p-4 w-88 sm:w-96"
          >
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl text-white mt-0.5 shadow-md shadow-emerald-500/20 shrink-0">
                <Bell size={18} className="animate-bounce" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Notifikasi Real-time
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-xs font-extrabold text-slate-900 truncate mt-1">
                  {activeToast.title}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {activeToast.message}
                </p>
              </div>

              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
