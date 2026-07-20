import React from 'react';
import { Pasti, Submission } from '../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReportStatusProps {
  pastis: Pasti[];
  submissions: Submission[];
}

export default function ReportStatus({ pastis, submissions }: ReportStatusProps) {
  const reportedNames = new Set(submissions.map(s => s.name?.toUpperCase().trim()));

  const statusData = pastis.map(p => ({
    ...p,
    reported: reportedNames.has(p.name?.toUpperCase().trim())
  })).sort((a, b) => (a.reported === b.reported ? 0 : a.reported ? 1 : -1));

  const countNotReported = statusData.filter(p => !p.reported).length;
  const countReported = statusData.filter(p => p.reported).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Statistik Status Laporan</h2>
          <p className="text-[11px] text-slate-400">Status penghantaran laporan mengikut PASTI</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md text-rose-700 text-[9px] font-bold">
            <AlertCircle size={9} />
            {countNotReported} Belum Lapor
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md text-emerald-700 text-[9px] font-bold">
            <CheckCircle2 size={9} />
            {countReported} Diterima
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 max-h-14 overflow-y-auto pr-2">
        {statusData.map(p => (
          <div key={p.id} className={`flex items-center justify-between p-1 rounded-lg border text-[9px] ${p.reported ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
            <span className={`font-semibold truncate ${p.reported ? 'text-emerald-800' : 'text-rose-900'}`}>{p.name}</span>
            {p.reported ? (
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={12} className="text-rose-500 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
