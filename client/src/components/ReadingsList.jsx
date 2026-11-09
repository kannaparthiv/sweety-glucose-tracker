import React, { useState } from 'react';
import { getGlucoseBadge } from './ReadingFormModal';
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';

export default function ReadingsList({
  readings = [],
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  onPageChange,
  onEdit,
  onDelete,
  filterSlot,
  setFilterSlot,
  filterDate,
  setFilterDate,
  onOpenAdd,
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async (id) => {
    await onDelete(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* List Header & Filters */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recorded Glucose Readings</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {readings.length} of {pagination.total} logged readings
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <select
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50 text-slate-700"
          >
            <option value="">All Time Slots</option>
            <option value="Morning (fasting)">Morning (fasting)</option>
            <option value="After breakfast">After breakfast</option>
            <option value="After lunch">After lunch</option>
            <option value="After dinner">After dinner</option>
          </select>

          {(filterDate || filterSlot) && (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterSlot('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table / Readings list */}
      {readings.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <p className="text-sm font-medium">No readings match the selected filters</p>
          <button
            onClick={onOpenAdd}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
          >
            Add a new reading
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Time Slot</th>
                <th className="py-3 px-5">Glucose Level</th>
                <th className="py-3 px-5">Clinical Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.map((r) => {
                const badge = getGlucoseBadge(r.value);
                const isConfirming = deleteConfirmId === r.id;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5 font-medium text-slate-900 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{r.time_slot}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900">{r.value}</span>{' '}
                      <span className="text-slate-400 font-medium">mg/dl</span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {badge && (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {isConfirming ? (
                        <div className="inline-flex items-center space-x-2">
                          <span className="text-[11px] text-rose-600 font-medium">Confirm?</span>
                          <button
                            onClick={() => handleConfirmDelete(r.id)}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[11px] hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => onEdit(r)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit reading"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(r.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete reading"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer (Bonus task: ?page=1&limit=20) */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total}{' '}
            readings)
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, pagination.page - 3), pagination.page + 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg font-semibold transition ${
                    pagination.page === p
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
