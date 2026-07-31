import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ShieldCheck, 
  User, 
  Lock, 
  Settings, 
  HelpCircle, 
  Sparkles, 
  CheckCircle, 
  Flame, 
  Calendar, 
  Database,
  ArrowRight,
  Info,
  Server,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';

interface UserGuideProps {
  user: any;
  isAdmin: boolean;
  setView: (view: any) => void;
}

export default function UserGuide({ user, isAdmin, setView }: UserGuideProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'public' | 'admin' | 'whatsapp'>('about');
  const [copiedText, setCopiedText] = useState(false);

  const whatsappMessage = `*PEMBERITAHUAN & HEBAHAN MAKLUM BALAS KESELAMATAN PASTI KUALA LANGAT*

Assalamu'alaikum WBT dan Salam Sejahtera,

Diberitahukan kepada semua **Muallimah PASTI Kawasan Kuala Langat**,

Unit Keselamatan dan Kesihatan PASTI Kawasan Kuala Langat memohon kerjasama daripada semua Muallimah untuk melengkapkan **Borang Saringan Maklum Balas Keselamatan & Kelengkapan Kecemasan** cawangan masing-masing.

Kerjasama ini amat penting bagi memudahkan pihak Unit Keselamatan mengambil tindakan susulan dan memastikan tahap keselamatan cawangan PASTI berada dalam keadaan terbaik.

📌 *Sila isi borang maklum balas melalui pautan di bawah:*
🔗 https://pasti-safety-kualalangat.netlify.app/

⏰ *Tarikh Akhir Maklum Balas (Due Date):*
*10 Ogos 2026*

Diharapkan semua Muallimah dari seluruh PASTI Kawasan Kuala Langat dapat memberikan kerjasama sepenuhnya demi keselamatan bersama.

Sekian, terima kasih.

*Unit Keselamatan dan Kesihatan*
*PASTI Kawasan Kuala Langat*`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden" id="user-guide-container">
      {/* Premium Gradient Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute -bottom-8 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold tracking-wider uppercase backdrop-blur-xs">
              <BookOpen size={13} />
              <span>Pusat Bantuan & Panduan</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Panduan Sistem Pantauan Keselamatan
            </h1>
            <p className="text-emerald-100 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
              Ketahui cara memantau, melaporkan, dan mengurus standard keselamatan kebakaran serta kemudahan kecemasan untuk cawangan PASTI Kuala Langat.
            </p>
          </div>
          
          <div className="shrink-0 flex flex-col gap-2">
            <div className="bg-slate-900/30 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                {user ? '👤' : '🌍'}
              </div>
              <div>
                <span className="block text-[10px] text-slate-300 font-mono uppercase tracking-wider">Mod Semasa</span>
                <span className="text-xs font-bold text-white">
                  {isAdmin ? '👑 Pentadbir Penuh' : user ? '👤 Guru Berdaftar' : '🌍 Capaian Awam'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Menu */}
      <div className="border-b border-slate-100 bg-slate-50 p-2 flex flex-wrap gap-1.5 shrink-0">
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'about'
              ? 'bg-white text-emerald-700 shadow-md shadow-slate-100 border border-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Info size={14} className={activeTab === 'about' ? 'text-emerald-600' : 'text-slate-400'} />
          Mengenai Sistem
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'public'
              ? 'bg-white text-emerald-700 shadow-md shadow-slate-100 border border-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User size={14} className={activeTab === 'public' ? 'text-emerald-600' : 'text-slate-400'} />
          Akses Awam (Guru)
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-white text-emerald-700 shadow-md shadow-slate-100 border border-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Lock size={14} className={activeTab === 'admin' ? 'text-emerald-600' : 'text-slate-400'} />
          Akses Pentadbir (Admin)
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare size={14} className={activeTab === 'whatsapp' ? 'text-white' : 'text-emerald-600'} />
          Teks Hebahan WhatsApp
        </button>
      </div>

      {/* Content Area with smooth animations */}
      <div className="p-8">
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 text-lg">
                  🔥
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Standard Keselamatan</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sistem memantau kesediaan pintu kecemasan, keaktifan lampu kecemasan, ketersediaan lampu keluar 'EXIT', dan kelayakan pemadam api secara berterusan.
                  </p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-lg">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Telegram Bot Simulator</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Setiap penghantaran borang atau penemuan kecacatan dihantar sebagai isyarat keselamatan secara langsung ke bot simulasi Telegram demi respon pantas.
                  </p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-100/50 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 shrink-0 text-lg">
                  💾
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Pangkalan Data Segera</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Disokong sepenuhnya oleh Google Cloud Firestore bagi membolehkan kemas kini data secara dinamik dan laras masa nyata tanpa kehilangan maklumat penting.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-500" />
                Matlamat Utama Pembangunan Aplikasi
              </h2>
              <div className="prose prose-slate max-w-none text-xs text-slate-600 leading-relaxed space-y-3">
                <p>
                  Sistem ini direka bentuk sebagai sebahagian daripada inisiatif keselamatan bersepadu untuk seluruh cawangan PASTI di kawasan Kuala Langat. Objektif utama adalah menggantikan kaedah laporan manual mingguan/bulanan yang rumit kepada format pengauditan digital yang mesra pengguna.
                </p>
                <p>
                  Dengan adanya sistem ini, mana-mana guru atau pengurus cawangan dapat membuat kemas kini kelengkapan fizikal mereka dalam masa kurang dari 1 minit, manakala pihak jawatankuasa pentadbiran daerah mendapat paparan masa nyata (real-time dashboard) yang komprehensif bagi mengambil tindakan penyelenggaraan atau pembekalan kelengkapan pemadam api yang tamat tempoh.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Sila pilih tab "Akses Awam (Guru)" di atas untuk memulakan panduan pengisian.</p>
              <button
                onClick={() => setActiveTab('public')}
                className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                <span>Seterusnya: Panduan Guru</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'public' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="border-l-4 border-emerald-500 pl-4 py-1">
              <h2 className="text-base font-extrabold text-slate-800">Panduan Melapor (Guru PASTI & Orang Awam)</h2>
              <p className="text-xs text-slate-500">Tiada log masuk diperlukan untuk melaporkan status keselamatan premis anda.</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs">Pilih Tab "Borang Maklum Balas"</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Gunakan panel navigasi kiri untuk pergi ke <span className="font-semibold text-emerald-600 cursor-pointer" onClick={() => setView('feedback')}>Borang Maklum Balas</span>. Ini adalah borang pengisytiharan utama.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs">Pilih Cawangan & Kemaskini Maklumat</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Pilih nama cawangan PASTI anda daripada senarai dropdown. Masukkan nama **Guru Besar** semasa serta **Nombor Telefon** terkini. Sistem akan merekodkan maklumat ini ke dalam pangkalan data kontak cawangan tersebut secara automatik.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs">Isytihar Kelengkapan Fizikal & Pemadam Api</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Tandakan status kelengkapan pintu kecemasan, lampu keluar, dan lampu kecemasan. Masukkan tarikh luput pemadam api premis. Jika premis mempunyai lebih daripada 1 tong pemadam api, anda boleh klik **"Tambah Pemadam Api"** untuk menambah baris pemadam api baharu.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  4
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs">Semak Rekod & Notifikasi Telegram</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Selesai menghantar, rekod anda akan terpapar di bawah tab <span className="font-semibold text-emerald-600 cursor-pointer" onClick={() => setView('reports-list')}>📋 Rekod Laporan (Awam)</span>. Anda juga boleh pergi ke tab <span className="font-semibold text-emerald-600 cursor-pointer" onClick={() => setView('telegrams')}>Simulasi Bot Telegram</span> untuk melihat simulasi mesej bot yang baru dihantar oleh tindakan anda tadi!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Ingin tahu cara menguruskan data sebagai pentadbir?</p>
              <button
                onClick={() => setActiveTab('admin')}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                <span>Seterusnya: Panduan Admin</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="border-l-4 border-indigo-500 pl-4 py-1">
              <h2 className="text-base font-extrabold text-slate-800">Panduan Pentadbiran (Akses Admin)</h2>
              <p className="text-xs text-slate-500">Ciri eksklusif untuk penyelia dan pemilik sistem yang log masuk.</p>
            </div>

            {/* Warning badge */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-3">
              <span className="text-lg">🔐</span>
              <div>
                <span className="font-bold block mb-0.5">Sekatan Log Masuk</span>
                <p className="leading-relaxed">
                  Akses admin memerlukan log masuk Google yang sah. E-mel rasmi pentadbir dengan kawalan penuh yang didaftarkan dalam sistem adalah <strong className="font-mono text-[11px]">muhaiminzeeismail@gmail.com</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="text-lg">📊</span>
                  <h4 className="font-bold text-xs text-slate-800">Sistem Dashboard & Audit</h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Sebaik sahaja log masuk, lawati tab **Dashboard** untuk memantau status semua PASTI. Admin mempunyai kuasa untuk mengklik toggle kelengkapan secara langsung (bagi meluluskan audit fizikal) atau memadam rekod bertindih yang dihantar oleh cawangan.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="text-lg">📋</span>
                  <h4 className="font-bold text-xs text-slate-800">Pengurusan Kontak (PastiManager)</h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Melalui tab **Pengurusan Kontak PASTI**, anda boleh menambah cawangan PASTI baru yang didirikan di daerah Kuala Langat, mengemas kini butiran cawangan, atau memadam cawangan lama yang tidak lagi aktif.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="text-lg">📅</span>
                  <h4 className="font-bold text-xs text-slate-800">Kalendar & Monitor Pemadam Api</h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Tab **Kalendar & Pemadam Api** membahagikan kelengkapan keselamatan mengikut kesahan luput (Selamat, Bakal Tamat Tempoh, dan Tamat Tempoh). Ini memudahkan pemantauan susulan secara visual tanpa perlu meneliti satu demi satu tarikh.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="text-lg">⚙️</span>
                  <h4 className="font-bold text-xs text-slate-800">Utiliti Data (Data Management)</h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Terbuka eksklusif untuk emel pemilik sahaja. Menampilkan log masa nyata audit keselamatan dan utiliti database kritikal seperti butang **"Reset Submissions"** untuk mengosongkan semua laporan bagi kitaran bulan baharu.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Tahniah! Anda telah selesai meneliti semua panduan sistem utama.</p>
              <button
                onClick={() => setView('feedback')}
                className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                <span>Kembali Ke Borang Utama</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'whatsapp' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="border-l-4 border-emerald-500 pl-4 py-1 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Teks Mesej Hebahan WhatsApp</h2>
                <p className="text-xs text-slate-500">Templat khas untuk disalin dan dihantar ke Kumpulan WhatsApp Muallimah PASTI Kawasan Kuala Langat.</p>
              </div>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {copiedText ? <Check size={14} className="text-emerald-200" /> : <Copy size={14} />}
                <span>{copiedText ? 'Telah Disalin!' : 'Salin Mesej'}</span>
              </button>
            </div>

            <div className="bg-emerald-950/5 border border-emerald-200/80 rounded-2xl p-6 relative">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm font-sans text-xs md:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {whatsappMessage}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>💡 Boleh terus salin dan sebar melalui WhatsApp Group PASTI.</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-3.5 rounded-lg transition-all"
                >
                  <MessageSquare size={13} />
                  <span>Buka di WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
