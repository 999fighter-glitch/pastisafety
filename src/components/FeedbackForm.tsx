import React, { useState, useRef, useEffect } from 'react';
import { Pasti, EquipmentItem } from '../types';
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
  Edit2,
  Camera,
  Upload,
  Image as ImageIcon,
  Flame,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackFormProps {
  pastis: Pasti[];
  submissions: any[];
  onSubmit: (data: any) => Promise<boolean>;
}

// Compress uploaded image for fast & safe Firestore storage
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => reject(new Error('Image load error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

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
    emergencyDoorsList: EquipmentItem[];
    exitLightsList: EquipmentItem[];
    lampuKecemasanList: EquipmentItem[];
    fireExtinguishers: EquipmentItem[];
    notificationReceived: string;
    isDemo?: boolean;
    remark?: string;
  }>({
    pastiId: '',
    name: '',
    headTeacher: '',
    phone: '',
    emergencyDoor: true,
    exitLight: true,
    lampuKecemasan: true,
    extinguisherExpiryDate: '',
    emergencyDoorsList: [
      { id: '1', label: 'Pintu Kecemasan Utama', status: 'ADA', photoUrl: '' }
    ],
    exitLightsList: [
      { id: '1', label: 'Lampu Exit Utama', status: 'ADA', photoUrl: '' }
    ],
    lampuKecemasanList: [
      { id: '1', label: 'Lampu Kecemasan Kelas', status: 'ADA', photoUrl: '' }
    ],
    fireExtinguishers: [
      { id: '1', label: 'Pemadam Api 1', expiryDate: '', serialNo: '', status: 'ADA', photoUrl: '' }
    ],
    notificationReceived: 'BELUM DIHANTAR',
    isDemo: false,
    remark: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedSnapshot, setSubmittedSnapshot] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    handlePastiChange(pastiId);
    
    setTimeout(() => {
      const formCard = document.getElementById('feedback-form-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
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
          emergencyDoorsList: existingSub.emergencyDoorsList && existingSub.emergencyDoorsList.length > 0
            ? existingSub.emergencyDoorsList
            : [{ id: '1', label: 'Pintu Kecemasan Utama', status: 'ADA', photoUrl: '' }],
          exitLightsList: existingSub.exitLightsList && existingSub.exitLightsList.length > 0
            ? existingSub.exitLightsList
            : [{ id: '1', label: 'Lampu Exit Utama', status: 'ADA', photoUrl: '' }],
          lampuKecemasanList: existingSub.lampuKecemasanList && existingSub.lampuKecemasanList.length > 0
            ? existingSub.lampuKecemasanList
            : [{ id: '1', label: 'Lampu Kecemasan Kelas', status: 'ADA', photoUrl: '' }],
          fireExtinguishers: existingSub.fireExtinguishers && existingSub.fireExtinguishers.length > 0
            ? existingSub.fireExtinguishers
            : [{ id: '1', label: 'Pemadam Api 1', expiryDate: existingSub.extinguisherExpiryDate || '', serialNo: '', status: 'ADA', photoUrl: '' }],
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
          emergencyDoorsList: [{ id: '1', label: 'Pintu Kecemasan Utama', status: 'ADA', photoUrl: '' }],
          exitLightsList: [{ id: '1', label: 'Lampu Exit Utama', status: 'ADA', photoUrl: '' }],
          lampuKecemasanList: [{ id: '1', label: 'Lampu Kecemasan Kelas', status: 'ADA', photoUrl: '' }],
          fireExtinguishers: [{ id: '1', label: 'Pemadam Api 1', expiryDate: '', serialNo: '', status: 'ADA', photoUrl: '' }],
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
        emergencyDoorsList: [{ id: '1', label: 'Pintu Kecemasan Utama', status: 'ADA', photoUrl: '' }],
        exitLightsList: [{ id: '1', label: 'Lampu Exit Utama', status: 'ADA', photoUrl: '' }],
        lampuKecemasanList: [{ id: '1', label: 'Lampu Kecemasan Kelas', status: 'ADA', photoUrl: '' }],
        fireExtinguishers: [{ id: '1', label: 'Pemadam Api 1', expiryDate: '', serialNo: '', status: 'ADA', photoUrl: '' }],
        notificationReceived: 'BELUM DIHANTAR',
      });
    }
  };

  const handleFileUploadForItem = async (
    listType: 'doors' | 'exits' | 'spaceLights' | 'extinguishers',
    itemId: string,
    file: File
  ) => {
    try {
      const compressed = await compressImage(file);
      if (listType === 'doors') {
        setFormData(prev => ({
          ...prev,
          emergencyDoorsList: prev.emergencyDoorsList.map(item =>
            item.id === itemId ? { ...item, photoUrl: compressed } : item
          )
        }));
      } else if (listType === 'exits') {
        setFormData(prev => ({
          ...prev,
          exitLightsList: prev.exitLightsList.map(item =>
            item.id === itemId ? { ...item, photoUrl: compressed } : item
          )
        }));
      } else if (listType === 'spaceLights') {
        setFormData(prev => ({
          ...prev,
          lampuKecemasanList: prev.lampuKecemasanList.map(item =>
            item.id === itemId ? { ...item, photoUrl: compressed } : item
          )
        }));
      } else if (listType === 'extinguishers') {
        setFormData(prev => ({
          ...prev,
          fireExtinguishers: prev.fireExtinguishers.map(item =>
            item.id === itemId ? { ...item, photoUrl: compressed } : item
          )
        }));
      }
    } catch (err) {
      console.error('Error compressing image:', err);
      alert('Gagal memproses gambar. Sila cuba gambar lain.');
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
      
      // Auto clear form inputs
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
        emergencyDoorsList: [{ id: '1', label: 'Pintu Kecemasan Utama', status: 'ADA', photoUrl: '' }],
        exitLightsList: [{ id: '1', label: 'Lampu Exit Utama', status: 'ADA', photoUrl: '' }],
        lampuKecemasanList: [{ id: '1', label: 'Lampu Kecemasan Kelas', status: 'ADA', photoUrl: '' }],
        fireExtinguishers: [{ id: '1', label: 'Pemadam Api 1', expiryDate: '', serialNo: '', status: 'ADA', photoUrl: '' }],
        notificationReceived: 'BELUM DIHANTAR',
        isDemo: false,
        remark: '',
      });

      setTimeout(() => {
        setShowToast(false);
      }, 6000);
    } else {
      setErrorMsg('Gagal menghantar laporan keselamatan. Sila semak sambungan internet anda.');
    }
  };

  const handleFillDemoData = () => {
    // Select the first PASTI for demo if available
    const demoPasti = pastis.length > 0 ? pastis[0] : null;
    
    // Set a complete sample data
    setFormData({
      id: undefined,
      pastiId: demoPasti ? demoPasti.id : 'demo-pasti-123',
      name: demoPasti ? `${demoPasti.name} (Demo)` : 'PASTI Demo Al-Amin',
      headTeacher: demoPasti ? demoPasti.headTeacher : 'Ustazah Sarah',
      phone: demoPasti ? demoPasti.phone : '0198765432',
      emergencyDoor: true,
      exitLight: true,
      lampuKecemasan: true,
      extinguisherExpiryDate: '2026-12-31',
      emergencyDoorsList: [
        { id: '1', label: 'Pintu Kecemasan Utama', status: 'ADA', photoUrl: 'https://images.unsplash.com/photo-1596541223130-5d5644156784?q=80&w=150&auto=format&fit=crop' },
        { id: '2', label: 'Pintu Kecemasan Belakang', status: 'ADA', photoUrl: 'https://images.unsplash.com/photo-1520188740392-67aca6327c1a?q=80&w=150&auto=format&fit=crop' }
      ],
      exitLightsList: [
        { id: '1', label: 'Lampu Exit Utama', status: 'ADA', photoUrl: 'https://images.unsplash.com/photo-1574044692737-13351ec3c8f8?q=80&w=150&auto=format&fit=crop' }
      ],
      lampuKecemasanList: [
        { id: '1', label: 'Lampu Kecemasan Kelas A', status: 'ADA', photoUrl: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?q=80&w=150&auto=format&fit=crop' }
      ],
      fireExtinguishers: [
        { id: '1', label: 'Pemadam Api Debu Kering', expiryDate: '2026-12-31', serialNo: 'FE-26-001', status: 'ADA', photoUrl: 'https://images.unsplash.com/photo-1621213564177-336e147e411b?q=80&w=150&auto=format&fit=crop' },
        { id: '2', label: 'Pemadam Api CO2', expiryDate: '2025-10-15', serialNo: 'FE-25-102', status: 'TIADA', photoUrl: '' }
      ],
      notificationReceived: 'BELUM DIHANTAR',
      isDemo: true,
      remark: 'Ini adalah data demo/sampel untuk tujuan ujian dan paparan.',
    });
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

                {/* Dynamic Equipment Summary Breakdown with Photos */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 md:col-span-2 space-y-3">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ringkasan Peralatan & Gambar yang Dimuat Naik</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Doors */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-emerald-600" /> Pintu Kecemasan ({submittedSnapshot.emergencyDoorsList?.length || 1})
                      </span>
                      <div className="space-y-2">
                        {(submittedSnapshot.emergencyDoorsList || [{ label: 'Pintu Utama', status: submittedSnapshot.emergencyDoor ? 'ADA' : 'TIADA' }]).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                            <div>
                              <span className="font-medium text-slate-800 block">{item.label}</span>
                              <span className={`text-[10px] font-bold ${item.status === 'ADA' || item.status === true ? 'text-emerald-600' : 'text-rose-600'}`}>Status: {item.status === 'ADA' || item.status === true ? 'ADA' : 'TIADA'}</span>
                            </div>
                            {item.photoUrl && (
                              <img src={item.photoUrl} alt={item.label} className="w-12 h-10 object-cover rounded border border-slate-300 shadow-3xs cursor-pointer hover:scale-105 transition-all" onClick={() => setPreviewImage(item.photoUrl)} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exit Lights */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Lightbulb size={14} className="text-emerald-600" /> Lampu Signage EXIT ({submittedSnapshot.exitLightsList?.length || 1})
                      </span>
                      <div className="space-y-2">
                        {(submittedSnapshot.exitLightsList || [{ label: 'Lampu Exit Utama', status: submittedSnapshot.exitLight ? 'ADA' : 'TIADA' }]).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                            <div>
                              <span className="font-medium text-slate-800 block">{item.label}</span>
                              <span className={`text-[10px] font-bold ${item.status === 'ADA' || item.status === true ? 'text-emerald-600' : 'text-rose-600'}`}>Status: {item.status === 'ADA' || item.status === true ? 'ADA' : 'TIADA'}</span>
                            </div>
                            {item.photoUrl && (
                              <img src={item.photoUrl} alt={item.label} className="w-12 h-10 object-cover rounded border border-slate-300 shadow-3xs cursor-pointer hover:scale-105 transition-all" onClick={() => setPreviewImage(item.photoUrl)} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Space Lights */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Lightbulb size={14} className="text-amber-600" /> Lampu Kecemasan Ruang ({submittedSnapshot.lampuKecemasanList?.length || 1})
                      </span>
                      <div className="space-y-2">
                        {(submittedSnapshot.lampuKecemasanList || [{ label: 'Lampu Kecemasan Kelas', status: submittedSnapshot.lampuKecemasan ? 'ADA' : 'TIADA' }]).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                            <div>
                              <span className="font-medium text-slate-800 block">{item.label}</span>
                              <span className={`text-[10px] font-bold ${item.status === 'ADA' || item.status === true ? 'text-emerald-600' : 'text-rose-600'}`}>Status: {item.status === 'ADA' || item.status === true ? 'ADA' : 'TIADA'}</span>
                            </div>
                            {item.photoUrl && (
                              <img src={item.photoUrl} alt={item.label} className="w-12 h-10 object-cover rounded border border-slate-300 shadow-3xs cursor-pointer hover:scale-105 transition-all" onClick={() => setPreviewImage(item.photoUrl)} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fire Extinguishers */}
                    <div className="bg-white p-3 rounded-lg border border-rose-200 space-y-2">
                      <span className="font-bold text-rose-800 flex items-center gap-1.5">
                        <Flame size={14} className="text-rose-600" /> Pemadam Api ({submittedSnapshot.fireExtinguishers?.length || 1})
                      </span>
                      <div className="space-y-2">
                        {(submittedSnapshot.fireExtinguishers || [{ label: 'Pemadam Api 1', expiryDate: submittedSnapshot.extinguisherExpiryDate }]).map((ext: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-2 bg-rose-50/50 p-2 rounded border border-rose-100">
                            <div>
                              <span className="font-medium text-slate-800 block">{ext.label}</span>
                              {ext.serialNo && <span className="text-[10px] font-mono text-slate-500 block">Siri: {ext.serialNo}</span>}
                              <span className="text-[10px] font-bold text-rose-700">Luput: {ext.expiryDate || '-'}</span>
                            </div>
                            {ext.photoUrl && (
                              <img src={ext.photoUrl} alt={ext.label} className="w-12 h-10 object-cover rounded border border-rose-300 shadow-3xs cursor-pointer hover:scale-105 transition-all" onClick={() => setPreviewImage(ext.photoUrl)} />
                            )}
                          </div>
                        ))}
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
              
              {/* 🚪 1. PINTU KECEMASAN (Dynamic List + Photo Upload) */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorOpen size={16} className="text-emerald-600" />
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Pintu Kecemasan ({formData.emergencyDoorsList.length} Unit)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = String(Date.now());
                      setFormData({
                        ...formData,
                        emergencyDoorsList: [
                          ...formData.emergencyDoorsList,
                          { id: nextId, label: `Pintu Kecemasan ${formData.emergencyDoorsList.length + 1}`, status: 'ADA', photoUrl: '' }
                        ]
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer"
                  >
                    <Plus size={12} strokeWidth={3} />
                    <span>Tambah Pintu</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.emergencyDoorsList.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.label}
                          placeholder="Nama Pintu (cth: Pintu Dapur / Hadapan)"
                          onChange={(e) => {
                            const updated = formData.emergencyDoorsList.map(d => d.id === item.id ? { ...d, label: e.target.value } : d);
                            setFormData({ ...formData, emergencyDoorsList: updated });
                          }}
                          className="w-full border border-slate-200 p-2 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs font-semibold">
                          <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${item.status === 'ADA' || item.status === true ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <input
                              type="radio"
                              name={`door-status-${item.id}`}
                              checked={item.status === 'ADA' || item.status === true}
                              onChange={() => {
                                const updated = formData.emergencyDoorsList.map(d => d.id === item.id ? { ...d, status: 'ADA' } : d);
                                setFormData({ ...formData, emergencyDoorsList: updated });
                              }}
                              className="hidden"
                            />
                            Ada
                          </label>
                          <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${item.status === 'TIADA' || item.status === false ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <input
                              type="radio"
                              name={`door-status-${item.id}`}
                              checked={item.status === 'TIADA' || item.status === false}
                              onChange={() => {
                                const updated = formData.emergencyDoorsList.map(d => d.id === item.id ? { ...d, status: 'TIADA' } : d);
                                setFormData({ ...formData, emergencyDoorsList: updated });
                              }}
                              className="hidden"
                            />
                            Tiada
                          </label>
                        </div>

                        {/* Photo Upload for Door */}
                        <div className="relative shrink-0">
                          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition-all">
                            <Camera size={14} className="text-emerald-600" />
                            <span>{item.photoUrl ? 'Tukar Gambar' : 'Muat Naik Gambar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUploadForItem('doors', item.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {formData.emergencyDoorsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, emergencyDoorsList: formData.emergencyDoorsList.filter(d => d.id !== item.id) });
                            }}
                            className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {item.photoUrl && (
                        <div className="w-full sm:w-auto relative group">
                          <img src={item.photoUrl} alt={item.label} className="w-16 h-12 object-cover rounded-lg border border-emerald-300 shadow-2xs" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.emergencyDoorsList.map(d => d.id === item.id ? { ...d, photoUrl: '' } : d);
                              setFormData({ ...formData, emergencyDoorsList: updated });
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full shadow hover:scale-110 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 💡 2. LAMPU EXIT (Dynamic List + Photo Upload) */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-emerald-600" />
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lampu Signage 'EXIT' ({formData.exitLightsList.length} Unit)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = String(Date.now());
                      setFormData({
                        ...formData,
                        exitLightsList: [
                          ...formData.exitLightsList,
                          { id: nextId, label: `Lampu Exit ${formData.exitLightsList.length + 1}`, status: 'ADA', photoUrl: '' }
                        ]
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer"
                  >
                    <Plus size={12} strokeWidth={3} />
                    <span>Tambah Lampu Exit</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.exitLightsList.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.label}
                          placeholder="Nama Lampu (cth: Exit Dewan Utama)"
                          onChange={(e) => {
                            const updated = formData.exitLightsList.map(d => d.id === item.id ? { ...d, label: e.target.value } : d);
                            setFormData({ ...formData, exitLightsList: updated });
                          }}
                          className="w-full border border-slate-200 p-2 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs font-semibold">
                          <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${item.status === 'ADA' || item.status === true ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <input
                              type="radio"
                              name={`exit-status-${item.id}`}
                              checked={item.status === 'ADA' || item.status === true}
                              onChange={() => {
                                const updated = formData.exitLightsList.map(d => d.id === item.id ? { ...d, status: 'ADA' } : d);
                                setFormData({ ...formData, exitLightsList: updated });
                              }}
                              className="hidden"
                            />
                            Ada
                          </label>
                          <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${item.status === 'TIADA' || item.status === false ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <input
                              type="radio"
                              name={`exit-status-${item.id}`}
                              checked={item.status === 'TIADA' || item.status === false}
                              onChange={() => {
                                const updated = formData.exitLightsList.map(d => d.id === item.id ? { ...d, status: 'TIADA' } : d);
                                setFormData({ ...formData, exitLightsList: updated });
                              }}
                              className="hidden"
                            />
                            Tiada
                          </label>
                        </div>

                        {/* Photo Upload */}
                        <div className="relative shrink-0">
                          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition-all">
                            <Camera size={14} className="text-emerald-600" />
                            <span>{item.photoUrl ? 'Tukar Gambar' : 'Muat Naik Gambar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUploadForItem('exits', item.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {formData.exitLightsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, exitLightsList: formData.exitLightsList.filter(d => d.id !== item.id) });
                            }}
                            className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {item.photoUrl && (
                        <div className="w-full sm:w-auto relative group">
                          <img src={item.photoUrl} alt={item.label} className="w-16 h-12 object-cover rounded-lg border border-emerald-300 shadow-2xs" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.exitLightsList.map(d => d.id === item.id ? { ...d, photoUrl: '' } : d);
                              setFormData({ ...formData, exitLightsList: updated });
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full shadow hover:scale-110 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 💡 3. LAMPU KECEMASAN RUANG (Dynamic List + Photo Upload) */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-600" />
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lampu Kecemasan Setiap Ruang ({formData.lampuKecemasanList.length} Unit)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = String(Date.now());
                      setFormData({
                        ...formData,
                        lampuKecemasanList: [
                          ...formData.lampuKecemasanList,
                          { id: nextId, label: `Lampu Kecemasan ${formData.lampuKecemasanList.length + 1}`, status: 'ADA', photoUrl: '' }
                        ]
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] text-amber-800 font-bold bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 transition-all cursor-pointer"
                  >
                    <Plus size={12} strokeWidth={3} />
                    <span>Tambah Lampu Kecemasan</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.lampuKecemasanList.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.label}
                          placeholder="Lokasi Lampu (cth: Kelas A / Koridor)"
                          onChange={(e) => {
                            const updated = formData.lampuKecemasanList.map(d => d.id === item.id ? { ...d, label: e.target.value } : d);
                            setFormData({ ...formData, lampuKecemasanList: updated });
                          }}
                          className="w-full border border-slate-200 p-2 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs font-semibold">
                          <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${item.status === 'ADA' || item.status === true ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <input
                              type="radio"
                              name={`space-light-status-${item.id}`}
                              checked={item.status === 'ADA' || item.status === true}
                              onChange={() => {
                                const updated = formData.lampuKecemasanList.map(d => d.id === item.id ? { ...d, status: 'ADA' } : d);
                                setFormData({ ...formData, lampuKecemasanList: updated });
                              }}
                              className="hidden"
                            />
                            Ada
                          </label>
                          <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${item.status === 'TIADA' || item.status === false ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <input
                              type="radio"
                              name={`space-light-status-${item.id}`}
                              checked={item.status === 'TIADA' || item.status === false}
                              onChange={() => {
                                const updated = formData.lampuKecemasanList.map(d => d.id === item.id ? { ...d, status: 'TIADA' } : d);
                                setFormData({ ...formData, lampuKecemasanList: updated });
                              }}
                              className="hidden"
                            />
                            Tiada
                          </label>
                        </div>

                        {/* Photo Upload */}
                        <div className="relative shrink-0">
                          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition-all">
                            <Camera size={14} className="text-amber-600" />
                            <span>{item.photoUrl ? 'Tukar Gambar' : 'Muat Naik Gambar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUploadForItem('spaceLights', item.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {formData.lampuKecemasanList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, lampuKecemasanList: formData.lampuKecemasanList.filter(d => d.id !== item.id) });
                            }}
                            className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {item.photoUrl && (
                        <div className="w-full sm:w-auto relative group">
                          <img src={item.photoUrl} alt={item.label} className="w-16 h-12 object-cover rounded-lg border border-amber-300 shadow-2xs" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.lampuKecemasanList.map(d => d.id === item.id ? { ...d, photoUrl: '' } : d);
                              setFormData({ ...formData, lampuKecemasanList: updated });
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full shadow hover:scale-110 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 🧯 4. PEMADAM API (Dynamic List + Serial No + Expiry Date + Photo Upload) */}
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-rose-600" />
                    <label className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Rekod Pemadam Api & Tarikh Luput ({formData.fireExtinguishers.length} Unit)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = String(Date.now());
                      setFormData({
                        ...formData,
                        fireExtinguishers: [
                          ...formData.fireExtinguishers,
                          { id: nextId, label: `Pemadam Api ${formData.fireExtinguishers.length + 1}`, expiryDate: '', serialNo: '', status: 'ADA', photoUrl: '' }
                        ]
                      });
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-rose-800 font-bold bg-rose-100 hover:bg-rose-200 px-2.5 py-1.5 rounded-lg border border-rose-300 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Plus size={12} strokeWidth={3} />
                    <span>Tambah Pemadam Api</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.fireExtinguishers.map((ext) => (
                    <div key={ext.id} className="bg-white p-3.5 rounded-xl border border-rose-200/90 shadow-2xs flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Label Unit:</label>
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
                            className="w-full border border-slate-200 bg-white p-2 text-xs rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-semibold"
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">No. Siri / Kod (Opsional):</label>
                          <input 
                            type="text" 
                            placeholder="cth: FE-2026-99" 
                            value={ext.serialNo || ''} 
                            onChange={(e) => {
                              const updated = formData.fireExtinguishers.map(item => 
                                item.id === ext.id ? { ...item, serialNo: e.target.value } : item
                              );
                              setFormData({ ...formData, fireExtinguishers: updated });
                            }}
                            className="w-full border border-slate-200 bg-white p-2 text-xs rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-rose-700 uppercase mb-1">Tarikh Luput (Expiry Date):</label>
                          <input 
                            type="date" 
                            value={ext.expiryDate} 
                            onChange={(e) => {
                              const updated = formData.fireExtinguishers.map(item => 
                                item.id === ext.id ? { ...item, expiryDate: e.target.value } : item
                              );
                              setFormData({ ...formData, fireExtinguishers: updated });
                            }}
                            className="w-full border border-rose-300 bg-rose-50/30 p-2 text-xs rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all cursor-pointer font-bold text-rose-900"
                            required 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Status:</label>
                          <div className="flex gap-2 text-xs font-semibold">
                            <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${ext.status === 'ADA' || ext.status === true ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              <input
                                type="radio"
                                name={`ext-status-${ext.id}`}
                                checked={ext.status === 'ADA' || ext.status === true}
                                onChange={() => {
                                  const updated = formData.fireExtinguishers.map(d => d.id === ext.id ? { ...d, status: 'ADA' } : d);
                                  setFormData({ ...formData, fireExtinguishers: updated });
                                }}
                                className="hidden"
                              />
                              Ada & Baik
                            </label>
                            <label className={`px-2.5 py-1 rounded-lg border cursor-pointer ${ext.status === 'TIADA' || ext.status === false ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              <input
                                type="radio"
                                name={`ext-status-${ext.id}`}
                                checked={ext.status === 'TIADA' || ext.status === false}
                                onChange={() => {
                                  const updated = formData.fireExtinguishers.map(d => d.id === ext.id ? { ...d, status: 'TIADA' } : d);
                                  setFormData({ ...formData, fireExtinguishers: updated });
                                }}
                                className="hidden"
                              />
                              Rosak / Tiada
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer transition-all">
                            <Camera size={14} className="text-rose-600" />
                            <span>{ext.photoUrl ? 'Tukar Gambar' : 'Muat Naik Gambar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUploadForItem('extinguishers', ext.id, file);
                              }}
                              className="hidden"
                            />
                          </label>

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
                      </div>

                      {ext.photoUrl && (
                        <div className="relative group inline-block mt-1">
                          <img src={ext.photoUrl} alt={ext.label} className="h-20 w-auto object-cover rounded-lg border border-rose-300 shadow-sm" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.fireExtinguishers.map(d => d.id === ext.id ? { ...d, photoUrl: '' } : d);
                              setFormData({ ...formData, fireExtinguishers: updated });
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full shadow hover:scale-110 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {formData.isDemo && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-800 uppercase mb-2">Remark / Nota (Untuk Demo):</label>
                  <textarea
                    value={formData.remark || ''}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    className="w-full border border-amber-300 bg-white p-3 text-sm rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none h-20"
                    placeholder="Masukkan nota tambahan (cth: Data ini dijana automatik untuk tujuan demonstrasi)..."
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleFillDemoData}
                  className="w-full sm:w-auto bg-amber-100 text-amber-800 px-5 py-3 rounded-xl font-bold hover:bg-amber-200 active:bg-amber-300 transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-sm border border-amber-300"
                >
                  <FileText size={15} className="text-amber-600" />
                  <span>Isi Data Demo</span>
                </button>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex-1 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 active:bg-slate-950 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm font-semibold"
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
              </div>
            </form>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 cursor-pointer shadow-lg"
            >
              <X size={20} />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

