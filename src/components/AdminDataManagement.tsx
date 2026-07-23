import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Clock, User, Bell, Trash2, RefreshCw, Layers, AlertTriangle, Eye, Globe, MousePointer, BarChart3, Filter, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDataManagement() {
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [activeViewers, setActiveViewers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [browseCount, setBrowseCount] = useState<number | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'public' | 'admin'>('all');

  // Deletion/Reset State
  const [isResettingOwner, setIsResettingOwner] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [isResettingActive, setIsResettingActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'owner' | 'active' | 'all';
    title: string;
    message: string;
    confirmText: string;
    badgeStyle: string;
    btnStyle: string;
  } | null>(null);

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

  const openConfirmModal = (type: 'owner' | 'active' | 'all') => {
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
