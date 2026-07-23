import React, { useState } from 'react';
import { Pasti, Submission } from '../types';
import { 
  Search, 
  Clock, 
  User, 
  Phone, 
  DoorClosed, 
  Sparkles, 
  ShieldCheck, 
  Signpost, 
  Lightbulb, 
  AlertTriangle, 
  FlameKindling,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublicReportsListProps {
  pastis: Pasti[];
  submissions: Submission[];
}

export default function PublicReportsList({ pastis, submissions }: PublicReportsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPastiId, setExpandedPastiId] = useState<string | null>(null);

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

  // Match submission 
  const getSubmissionForPasti = (pastiId: string) => {
    return submissions.find(s => s.pastiId?.toString() === pastiId.toString());
  };

  // Status mapping functions
  const renderStatusBadge = (fieldVal: any, labelText: string) => {
    const isGood = fieldVal === true || fieldVal === 'ADA' || fieldVal === 'KEADAAN BAIK' || fieldVal === 'BERFUNGSI' || fieldVal === 'OK';
    if (isGood) {
      return (
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-150 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>{labelText}: ADA & BAIK</span>
        </div>
      );
    } else if (fieldVal === undefined || fieldVal === 'BELUM DIKAJI') {
      return (
        <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide">
          <AlertCircle size={12} className="text-slate-400" />
          <span>{labelText}: BELUM DIKAJI</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-150 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide">
          <AlertTriangle size={12} className="text-rose-600 animate-bounce" />
          <span>{labelText}: TIDAK MEMUASKAN / TIADA</span>
        </div>
      );
    }
  };

  // Filter PASTI list based on search Input
  const filteredPastis = pastis.filter(pasti => 
    pasti.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pasti.headTeacher && pasti.headTeacher.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 🔮 Header Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-900/60 text-emerald-250 border border-emerald-500/35 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
            <Sparkles size={11} className="text-emerald-400" />
            <span>AKSES AWAM</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-none">📋 Rekod Laporan Keselamatan PASTI</h1>
          <p className="text-xs text-emerald-105 font-medium max-w-2xl text-emerald-50/90 leading-relaxed">
            Semak laporan bulanan keselamatan yang merangkumi pemantauan tarikh luput pemadam api, pintu rintangan api, lampu tanda 'EXIT', dan lampu kecemasan premis.
          </p>
        </div>
      </div>

      {/* 🔍 Search bar with full-width response */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Ketik carian nama PASTI atau nama guru (Contoh: PASTI Al-Mursyidin)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
          />
        </div>
        <div className="flex items-center text-slate-500 font-mono text-[10px] uppercase font-bold bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shrink-0 self-start sm:self-center">
          Dijumpai: {filteredPastis.length} Premis
        </div>
      </div>

      {/* 📋 Result list cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPastis.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic text-xs shadow-sm">
            Tiada rekod PASTI sepadan dengan "{searchTerm}". Sila masukkan kata kunci yang berbeza.
          </div>
        ) : (
          filteredPastis.map((pasti) => {
            const sub = getSubmissionForPasti(pasti.id);
            const isExpanded = expandedPastiId === pasti.id;

            // Extinguisher items
            const extinguishers = sub && sub.fireExtinguishers && sub.fireExtinguishers.length > 0
              ? sub.fireExtinguishers
              : sub 
                ? [{ id: '1', label: 'Pemadam Api 1', expiryDate: sub.extinguisherExpiryDate }]
                : [];

            return (
              <div 
                key={pasti.id} 
                className="bg-white border border-slate-180 hover:border-emerald-500/30 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* School Header Row */}
                <div 
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedPastiId(isExpanded ? null : pasti.id)}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">{pasti.name}</h3>
                      {sub ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase">
                          Laporan Sah
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase">
                          Belum Melapor
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span>Mualimah {pasti.headTeacher || 'Tidak Dinyatakan'}</span>
                      </span>
                      {pasti.phone && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span>{pasti.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission date highlight */}
                  <div className="flex items-center gap-4">
                    {sub ? (
                      <div className="flex flex-col sm:items-end text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 sm:justify-end">
                          <Clock size={11} className="text-emerald-500 shrink-0" />
                          <span>Tarikh Diterima</span>
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">
                          {(() => {
                            const rawDate = sub.createdAt;
                            if (!rawDate) return 'Sedia Ada';
                            const dateObj = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
                            return isNaN(dateObj.getTime()) ? 'Sedia Ada' : dateObj.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                          })()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:items-end text-sm text-rose-600 font-extrabold bg-rose-50/50 px-3 py-1 rounded-xl border border-rose-100 uppercase tracking-wider text-[10px]">
                        Laporan Dinanti
                      </div>
                    )}
                    <div className="text-slate-400 hover:text-slate-700 font-bold text-xs">
                      {isExpanded ? '▲ Ringkas' : '▼ Perincian'}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Checklist */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4 overflow-hidden"
                    >
                      {sub ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: General hardware status checklist */}
                          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-150">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                              <ShieldCheck size={12} className="text-emerald-500" />
                              <span>Sistem Keselamatan Fizikal</span>
                            </h4>

                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                  <DoorClosed size={14} className="text-slate-400 shrink-0" />
                                  <span>Pintu Rintangan Api:</span>
                                </span>
                                {renderStatusBadge(sub.emergencyDoor, 'Pintu')}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                  <Signpost size={14} className="text-slate-400 shrink-0" />
                                  <span>Lampu Kecemasan Tanda 'EXIT':</span>
                                </span>
                                {renderStatusBadge(sub.exitLight, 'Tanda EXIT')}
                              </div>

                              {/* Equipment List Breakdown with Uploaded Photos */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gambar & Butiran Peralatan:</span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {sub.emergencyDoorsList?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <div>
                                        <span className="font-semibold text-slate-800 block">{item.label}</span>
                                        <span className="text-[10px] text-emerald-700 font-bold">Status: {item.status === 'ADA' || item.status === true ? 'ADA' : 'TIADA'}</span>
                                      </div>
                                      {item.photoUrl && (
                                        <img src={item.photoUrl} alt={item.label} className="w-12 h-10 object-cover rounded border border-slate-300 shadow-2xs cursor-pointer hover:scale-105 transition-all" onClick={() => window.open(item.photoUrl, '_blank')} />
                                      )}
                                    </div>
                                  ))}

                                  {sub.exitLightsList?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <div>
                                        <span className="font-semibold text-slate-800 block">{item.label}</span>
                                        <span className="text-[10px] text-emerald-700 font-bold">Status: {item.status === 'ADA' || item.status === true ? 'ADA' : 'TIADA'}</span>
                                      </div>
                                      {item.photoUrl && (
                                        <img src={item.photoUrl} alt={item.label} className="w-12 h-10 object-cover rounded border border-slate-300 shadow-2xs cursor-pointer hover:scale-105 transition-all" onClick={() => window.open(item.photoUrl, '_blank')} />
                                      )}
                                    </div>
                                  ))}

                                  {sub.lampuKecemasanList?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <div>
                                        <span className="font-semibold text-slate-800 block">{item.label}</span>
                                        <span className="text-[10px] text-emerald-700 font-bold">Status: {item.status === 'ADA' || item.status === true ? 'ADA' : 'TIADA'}</span>
                                      </div>
                                      {item.photoUrl && (
                                        <img src={item.photoUrl} alt={item.label} className="w-12 h-10 object-cover rounded border border-slate-300 shadow-2xs cursor-pointer hover:scale-105 transition-all" onClick={() => window.open(item.photoUrl, '_blank')} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Detailed Extinguishers Status */}
                          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-150">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                              <FlameKindling size={12} className="text-emerald-500" />
                              <span>Alat Pemadam Api</span>
                            </h4>

                            <div className="space-y-2">
                              {extinguishers.length > 0 ? (
                                extinguishers.map((ext: any, idx) => {
                                  const days = ext.expiryDate ? getDaysLeft(ext.expiryDate) : null;
                                  let extColor = 'bg-slate-100 text-slate-700 border-slate-200';
                                  let textStatus = 'Tiada tarikh';

                                  if (days !== null) {
                                    if (days < 0) {
                                      extColor = 'bg-rose-50 text-rose-700 border-rose-200';
                                      textStatus = 'Tamat Tempoh Luput!';
                                    } else if (days <= 30) {
                                      extColor = 'bg-amber-50 text-amber-700 border-amber-200';
                                      textStatus = `Hampir Tamat Tempoh (${days} hari lagi)`;
                                    } else {
                                      extColor = 'bg-emerald-50 text-emerald-700 border-emerald-150';
                                      textStatus = `Selamat & Aktif (${days} hari lagi)`;
                                    }
                                  }

                                  return (
                                    <div 
                                      key={ext.id || idx}
                                      className={`flex justify-between items-center bg-white border p-2.5 rounded-xl text-xs font-bold gap-2 ${extColor}`}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-extrabold text-slate-800">{ext.label || `Pemadam Api ${idx+1}`}</span>
                                        {ext.serialNo && <span className="text-[10px] font-mono text-slate-500">Siri: {ext.serialNo}</span>}
                                        <span className="text-[10px] font-medium opacity-80">Luput: {ext.expiryDate || 'Tiada Tarikh'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-tight">{textStatus}</span>
                                        {ext.photoUrl && (
                                          <img src={ext.photoUrl} alt={ext.label} className="w-10 h-10 object-cover rounded border border-rose-300 cursor-pointer shadow-3xs" onClick={() => window.open(ext.photoUrl, '_blank')} />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-[11px] italic text-slate-400">Tiada alat pemadam api khusus didaftarkan dalam laporan.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-2xl border border-slate-150 text-center space-y-1.5">
                          <p className="text-xs text-slate-600 font-bold">Laporan bulanan untuk premis ini belum dihantar lagi.</p>
                          <p className="text-[11px] text-slate-400">Sila hubungi mualimah atau pihak pengurusan untuk mengisi borang maklum balas bulanan secepat mungkin.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
