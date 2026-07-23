import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Send, Settings, Save, CheckCircle, Database, Server, Key, Eye, EyeOff } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface TelegramSimulatorProps {
  notifications: any[];
}

export default function TelegramSimulator({ notifications }: TelegramSimulatorProps) {
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Telegram config state
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [configStatus, setConfigStatus] = useState<{ tokenConfigured: boolean; chatIdConfigured: boolean; token?: string; chatId?: string }>({
    tokenConfigured: false,
    chatIdConfigured: false
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  // Firebase status state
  const [firebaseConfigInfo, setFirebaseConfigInfo] = useState<{ projectId: string; databaseId: string; authDomain: string; status: string }>({
    projectId: 'sustained-sandbox-w5xj8',
    databaseId: 'ai-studio-8f3dbb41-3cc2-4a80-9f09-efcd98f45929',
    authDomain: 'sustained-sandbox-w5xj8.firebaseapp.com',
    status: 'connected'
  });

  // Fetch current telegram configuration status from server and firestore on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // 1. Fetch server API status
      const res = await fetch('/api/telegram-config');
      if (res.ok) {
        const data = await res.json();
        setConfigStatus(data);
      }

      // 2. Fetch server Firebase details
      const fbRes = await fetch('/api/firebase-config');
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        setFirebaseConfigInfo(fbData);
      }

      // 3. Fetch from Firestore systemConfig document
      const docSnap = await getDoc(doc(db, 'systemConfig', 'telegram'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.botToken) setBotToken(data.botToken);
        if (data.chatId) setChatId(data.chatId);
      }
    } catch (e) {
      console.warn('Error fetching bot config:', e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigMessage(null);

    try {
      // 1. Save to server backend via API
      const response = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken, chatId }),
      });
      const data = await response.json();

      // 2. Save directly to Firestore systemConfig/telegram document
      await setDoc(doc(db, 'systemConfig', 'telegram'), {
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (response.ok) {
        setConfigMessage('✅ Tetapan Telegram Bot berjaya disimpan di server & Firebase Database!');
        fetchConfig();
      } else {
        setConfigMessage('⚠️ ' + (data.message || 'Gagal menyimpan tetapan server.'));
      }
    } catch (e) {
      setConfigMessage('❌ Ralat berlaku semasa menyimpan tetapan.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test-telegram');
      const data = await response.json();
      if (data.ok) {
        await fetch('/api/send-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Ujian sambungan bot berjaya: Bot @${data.result.username} aktif.` }),
        });
        alert(`Berjaya disambungkan ke: ${data.result.first_name} (@${data.result.username})`);
      } else {
        alert('Gagal disambungkan: ' + (data.error || data.description || 'Sila pastikan Bot Token & Chat ID ditetapkan.'));
      }
    } catch (e) {
      alert('Ralat rangkaian semasa ujian sambungan.');
    } finally {
      setTesting(false);
    }
  };

  const handleTestMessage = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Ujian mesej daripada bot Telegram Safety Pasti' }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Ralat penghantaran: ' + (data.error || 'Sila semak token & Chat ID.'));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-sky-100 p-2.5 rounded-xl text-sky-700">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Simulasi Bot Telegram & Backend Setup</h2>
            <p className="text-xs text-slate-500">Notifikasi & Konfigurasi Server Firebase & Bot Telegram</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <Settings size={14} />
            {showConfig ? 'Sembunyi Tetapan' : 'Konfigurasi Bot & Server'}
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
          >
            {testing ? 'Memeriksa...' : 'Uji Sambungan'}
          </button>
          <button
            onClick={handleTestMessage}
            disabled={sending}
            className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} />
            {sending ? 'Menghantar...' : 'Uji Bot'}
          </button>
        </div>
      </div>

      {/* Configuration Drawer / Form */}
      {showConfig && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Server size={16} />
              <span>Tetapan Pelayan Backend & Telegram Bot</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              .env & Firebase Database Mode
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key size={13} className="text-sky-400" />
                  Telegram Bot Token:
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {configStatus.tokenConfigured && (
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle size={10} /> Dikesan dari Server: <span className="font-mono">{configStatus.token}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-amber-400" />
                  Telegram Chat ID:
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Contoh: -100123456789 atau 987654321"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                {configStatus.chatIdConfigured && (
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle size={10} /> Dikesan dari Server: <span className="font-mono">{configStatus.chatId}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} />
                {savingConfig ? 'Menyimpan...' : 'Simpan Tetapan Bot ke Server & Firebase'}
              </button>

              <p className="text-[11px] text-slate-400">
                Tetapan juga akan disimpan secara automatik dalam fail <code className="text-amber-300 font-mono">.env</code> & Firebase Firestore.
              </p>
            </div>

            {configMessage && (
              <div className="p-2.5 bg-slate-850 rounded-xl text-xs font-medium border border-slate-700 text-emerald-300">
                {configMessage}
              </div>
            )}
          </form>

          {/* Firebase Server Integration Info */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-300 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Database size={14} /> Status Pangkalan Data Firebase Backend:
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">
                {firebaseConfigInfo.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
              <div>Project ID: <span className="text-white">{firebaseConfigInfo.projectId}</span></div>
              <div>Database ID: <span className="text-white">{firebaseConfigInfo.databaseId}</span></div>
              <div>Auth Domain: <span className="text-white">{firebaseConfigInfo.authDomain}</span></div>
              <div>Collection Setup: <span className="text-emerald-400">systemConfig/telegram</span></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">Tiada notifikasi bot terkini.</div>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="flex gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-tighter">Dihantar ke Bot</span>
              </div>
              <div className="text-sky-500 pt-1"><MessageSquare size={16} /></div>
              <div>
                <p className="text-xs font-bold text-slate-800">{n.title}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-2">{new Date(n.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

