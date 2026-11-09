import React from 'react';
import { Activity, PlusCircle } from 'lucide-react';

export default function EmptyState({
  title = 'No glucose readings yet',
  message = 'Record your first blood glucose measurement to see daily averages and trends.',
  onAction,
  actionText = 'Log Reading',
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
        <Activity className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="max-w-md mx-auto text-xs text-slate-500 mt-1 mb-5">{message}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
