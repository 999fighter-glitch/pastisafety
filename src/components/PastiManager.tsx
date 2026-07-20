import React, { useState } from 'react';
import { collection, addDoc, doc, writeBatch, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Pasti } from '../types';
import { 
  Building2, 
  Plus, 
  Database, 
  Trash2, 
  Search, 
  ClipboardList, 
  Check, 
  AlertCircle, 
  Loader2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PastiManagerProps {
  pastis?: Pasti[];
  onPastiAdded: () => void;
  addNotification: (title: string, message: string) => void;
}

export default function PastiManager({ pastis = [], onPastiAdded, addNotification }: PastiManagerProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single mode form state
  const [name, setName] = useState('');
  const [headTeacher, setHeadTeacher] = useState('');
  const [phone, setPhone] = useState('');
  
  // Bulk mode form state
  const [bulkText, setBulkText] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search state for existing pastis
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingPasti, setEditingPasti] = useState<Pasti | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Pasti | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editHeadTeacher, setEditHeadTeacher] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const handleUpdatePasti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasti) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'pastis', editingPasti.id), {
        name: editName.trim(),
        headTeacher: editHeadTeacher.trim(),
        phone: editPhone.trim(),
      });
      setEditingPasti(null);
      onPastiAdded();
      addNotification('Maklumat Dikemaskini', 'Maklumat PASTI berjaya dikemaskini.');
      setMessage({ type: 'success', text: 'Maklumat PASTI berjaya dikemaskini.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Ralat semasa mengemaskini rekod.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAllPastis = async () => {
    setIsSubmitting(true);
    try {
      const snapshot = await getDocs(collection(db, 'pastis'));
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      onPastiAdded();
      addNotification('Senarai Dikosongkan', 'Senarai PASTI berjaya dikosongkan.');
      setMessage({ type: 'success', text: 'Senarai PASTI berjaya dikosongkan.' });
      setSearchQuery('');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Ralat semasa mengosongkan senarai.' });
    } finally {
      setIsSubmitting(false);
      setShowClearModal(false);
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      await addDoc(collection(db, 'pastis'), {
        name: name.trim(),
        headTeacher: headTeacher.trim(),
        phone: phone.trim(),
      });
      
      const addedName = name.trim();
      setName('');
      setHeadTeacher('');
      setPhone('');
      
      setMessage({ type: 'success', text: `PASTI "${addedName}" berjaya ditambah ke senarai.` });
      addNotification('PASTI Ditambah', `PASTI "${addedName}" berjaya ditambah.`);
      onPastiAdded();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Ralat semasa menambah prasekolah PASTI.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (names.length === 0) {
      setMessage({ type: 'error', text: 'Sila masukkan sekurang-kurangnya satu nama prasekolah.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const batch = writeBatch(db);
      const colRef = collection(db, 'pastis');

      names.forEach(pastiName => {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          name: pastiName,
          headTeacher: '', // Left blank for public users to fill in feedback
          phone: '',       // Left blank for public users to fill in feedback
        });
      });

      await batch.commit();
      setBulkText('');
      setMessage({ type: 'success', text: `${names.length} prasekolah PASTI berjaya ditambah secara berkumpulan!` });
      addNotification('PASTI Ditambah', `${names.length} prasekolah PASTI berjaya ditambah.`);
      onPastiAdded();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Ralat semasa menambah nama PASTI secara berkumpulan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePasti = async (id: string) => {
    setIsDeletingId(id);
    try {
      await deleteDoc(doc(db, 'pastis', id));
      onPastiAdded();
      addNotification('PASTI Dipadam', 'Rekod prasekolah berjaya dipadam.');
    } catch (error) {
      console.error(error);
      alert('Ralat semasa memadam rekod prasekolah.');
    } finally {
      setIsDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const filteredPastis = pastis.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.headTeacher && p.headTeacher.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 w-full max-w-[710px] mx-auto md:ml-[30px] space-y-6">
      {/* Header and Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 size={22} className="text-emerald-600" />
          <span>Pengurusan Senarai PASTI</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Uruskan senarai prasekolah berdaftar di daerah Kuala Langat.
        </p>
      </div>

      {/* Tabs configuration for Single vs Bulk */}
      <div className="flex border-b border-slate-100 p-0.5 bg-slate-50 rounded-lg">
        <button
          onClick={() => { setActiveTab('single'); setMessage(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'single' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Plus size={14} className="text-emerald-500" />
          <span>Tambah Tunggal</span>
        </button>
        <button
          onClick={() => { setActiveTab('bulk'); setMessage(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'bulk' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ClipboardList size={14} className="text-emerald-500" />
          <span>Tambah Senarai / Pukal</span>
        </button>
      </div>

      {/* Message Output wrapper */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}
          >
            {message.type === 'success' ? (
              <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forms Area */}
      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
        {activeTab === 'single' ? (
          /* SINGLE ADD FORM */
          <form onSubmit={handleAddSingle} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Nama PASTI (Satu-satunya bahagian wajib oleh Admin) *</label>
                <input
                  type="text"
                  placeholder="Contoh: PASTI Al-Huda Sijangkang"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-200 bg-white p-2.5 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Guru Kanan (Boleh dikosongkan dahulu) </label>
                  <input
                    type="text"
                    placeholder="Nama Guru Kanan"
                    value={headTeacher}
                    onChange={e => setHeadTeacher(e.target.value)}
                    className="w-full border border-slate-200 bg-white p-2.5 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">No Telefon (Boleh dikosongkan dahulu)</label>
                  <input
                    type="text"
                    placeholder="No. Telefon"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border border-slate-200 bg-white p-2.5 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-400 select-none flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-500" />
                <span>Pengguna awam boleh mengemas kini nombor & nama guru kemudian.</span>
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 border border-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin text-emerald-400" />
                ) : (
                  <Plus size={13} className="text-emerald-400" />
                )}
                <span>Daftarkan PASTI</span>
              </button>
            </div>
          </form>
        ) : (
          /* BULK / LIST ADD FORM */
          <form onSubmit={handleAddBulk} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                Masukkan Senarai Nama PASTI (Satu baris untuk setiap prasekolah) *
              </label>
              <textarea
                rows={5}
                placeholder="Contoh:&#10;PASTI Al-Huda&#10;PASTI Mawaddah&#10;PASTI Nurul Iman"
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full border border-slate-200 bg-white p-3 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-sans placeholder-slate-300 leading-relaxed"
                required
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="text-[10px] text-slate-400 select-none flex items-center gap-1">
                <Database size={11} className="text-emerald-500" />
                <span>Setiap baris akan didaftarkan sebagai prasekolah baru berasingan.</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 border border-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin text-emerald-400" />
                ) : (
                  <ClipboardList size={13} className="text-emerald-400" />
                )}
                <span>Muatkan Senarai</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Listing existing pastis for deletion & review */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800">Prasekolah Berdaftar ({pastis.length})</h3>
              {pastis.length > 0 && (
                <button
                  onClick={() => setShowClearModal(true)}
                  className="text-[10px] text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Senarai semasa yang boleh dipilih dalam borang awam.</p>
          </div>
          
          {/* Internal search filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari PASTI..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full sm:w-44 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* Clear All Modal */}
        <AnimatePresence>
          {showClearModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowClearModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-base font-bold text-slate-900 mb-2">Kosongkan Senarai PASTI?</h3>
                <p className="text-xs text-slate-500 mb-6">Tindakan ini akan memadam SEmua rekod PASTI secara kekal. Perbuatan ini tidak boleh diundurkan.</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleClearAllPastis}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Memadam...' : 'Ya, Padam Semua'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm"
                >
                    <h3 className="text-base font-bold text-slate-900 mb-2">Padam PASTI?</h3>
                    <p className="text-xs text-slate-500 mb-6">Adakah anda pasti mahu memadam prasekolah "{deleteConfirm.name}"?</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer">Batal</button>
                        <button onClick={() => handleDeletePasti(deleteConfirm.id)} className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer">Ya, Padam</button>
                    </div>
                </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingPasti && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm"
                >
                    <h3 className="text-base font-bold text-slate-900 mb-4">Edit PASTI: {editingPasti.name}</h3>
                    <form onSubmit={handleUpdatePasti} className="space-y-4">
                        <input type="text" placeholder="Nama PASTI" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-slate-200 p-2.5 text-xs rounded-xl" required />
                        <input type="text" placeholder="Guru Kanan" value={editHeadTeacher} onChange={e => setEditHeadTeacher(e.target.value)} className="w-full border border-slate-200 p-2.5 text-xs rounded-xl" />
                        <input type="text" placeholder="No. Telefon" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border border-slate-200 p-2.5 text-xs rounded-xl" />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingPasti(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer">Batal</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer disabled:opacity-50">Simpan</button>
                        </div>
                    </form>
                </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* List render layout */}
        <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50/20 divide-y divide-slate-100">
          {filteredPastis.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Tiada prasekolah ditemui. Sila tambah menggunakan borang di atas.
            </div>
          ) : (
            filteredPastis.map(pasti => (
              <div key={pasti.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs text-slate-800 block truncate">{pasti.name}</span>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 truncate">
                    {pasti.headTeacher ? (
                      <span className="truncate">Guru: <span className="text-slate-600 font-medium">{pasti.headTeacher}</span></span>
                    ) : (
                      <span className="italic text-slate-400">Maklumat Guru Belum Diisi</span>
                    )}
                    {pasti.phone && (
                      <span className="font-mono">{pasti.phone}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                        setEditingPasti(pasti);
                        setEditName(pasti.name);
                        setEditHeadTeacher(pasti.headTeacher || '');
                        setEditPhone(pasti.phone || '');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all cursor-pointer select-none"
                    title="Edit prasekolah"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(pasti)}
                    disabled={isDeletingId === pasti.id}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all cursor-pointer select-none"
                    title="Padam prasekolah"
                  >
                    {isDeletingId === pasti.id ? (
                      <Loader2 size={13} className="animate-spin text-rose-500" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
