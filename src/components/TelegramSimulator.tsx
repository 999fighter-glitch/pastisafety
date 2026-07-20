import React, { useState } from 'react';
import { Bot, MessageSquare, Send } from 'lucide-react';

interface Submission {
  id: string;
  name: string;
  updatedAt?: { seconds: number };
  createdAt?: { seconds: number };
}

interface TelegramSimulatorProps {
  notifications: any[];
}

export default function TelegramSimulator({ notifications }: TelegramSimulatorProps) {
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);

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
        alert('Gagal disambungkan: ' + (data.description || 'Ralat tidak diketahui'));
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
      await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Ujian mesej daripada bot Telegram Safety Pasti' }),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-sky-100 p-2 rounded-xl text-sky-700">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Simulasi Bot Telegram</h2>
            <p className="text-xs text-slate-500">Notifikasi Safety Pasti Kuala Langat Bot</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
          >
            {testing ? 'Memeriksa...' : 'Uji Sambungan'}
          </button>
          <button
            onClick={handleTestMessage}
            disabled={sending}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} />
            {sending ? 'Menghantar...' : 'Uji Bot'}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">Tiada notifikasi bot terkini.</div>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="flex gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
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
