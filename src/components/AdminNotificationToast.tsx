import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';

interface NotificationToastProps {
  notifications: any[];
}

export default function AdminNotificationToast({ notifications }: NotificationToastProps) {
  const [activeToast, setActiveToast] = useState<any | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      setActiveToast(notifications[0]);
      const timer = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[60] bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 w-80"
        >
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 mt-0.5">
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">{activeToast.title}</h4>
              <p className="text-xs text-slate-600 mt-1">{activeToast.message}</p>
            </div>
            <button onClick={() => setActiveToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
