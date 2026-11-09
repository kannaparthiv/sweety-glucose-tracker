import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export function getGlucoseBadge(val) {
  const num = Number(val);
  if (!num || isNaN(num)) return null;

  if (num < 70) {
    return { label: 'Low (<70)', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  } else if (num <= 140) {
    return { label: 'Normal (70-140)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  } else if (num <= 199) {
    return { label: 'Elevated (141-199)', color: 'bg-orange-100 text-orange-800 border-orange-300' };
  } else {
    return { label: 'High (200+)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
}

export default function ReadingFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  defaultDate = '',
}) {
  const todayStr = new Date().toLocaleDateString('en-CA');

  const [date, setDate] = useState(defaultDate || todayStr);
  const [timeSlot, setTimeSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || todayStr);
      setTimeSlot(initialData.time_slot || SLOTS[0]);
      setValue(initialData.value !== undefined ? String(initialData.value) : '');
    } else {
      setDate(defaultDate || todayStr);
      setTimeSlot(SLOTS[0]);
      setValue('');
    }
    setError('');
  }, [initialData, defaultDate, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    // 1. Value is required
    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Please enter a glucose value.';
    }

    // 2. Whole number between 40 and 600
    const num = Number(value);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    // 3. Date check
    if (!date) {
      return 'Please select a date.';
    }

    // 4. Future date check
    if (date > todayStr) {
      return 'Date cannot be in the future.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationMsg = validate();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date,
        time_slot: timeSlot,
        value: parseInt(value, 10),
      };

      if (initialData && initialData.id) {
        await api.updateReading(initialData.id, payload);
      } else {
        await api.createReading(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save glucose reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const badge = getGlucoseBadge(value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialData ? 'Edit Blood Glucose Reading' : 'Log Blood Glucose Reading'}
              </h3>
              <p className="text-xs text-slate-500">
                Record your daily measurement (40 – 600 mg/dl)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-sm text-rose-800"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reading Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                max={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Select today or a past date.</p>
          </div>

          {/* Time Slot Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Time Slot (Up to 4 per day)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SLOTS.map((slot) => {
                const isSelected = timeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{slot}</span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 ml-1 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Glucose Value (mg/dl)
              </label>
              {badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${badge.color}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="40"
                max="600"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 110"
                className="w-full px-3 py-2.5 text-base font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 placeholder:font-normal placeholder:text-slate-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                mg/dl
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Whole number between 40 and 600</span>
              <span>Target: 70–140 mg/dl</span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm shadow-emerald-600/20 transition flex items-center space-x-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <span>{initialData ? 'Update Reading' : 'Save Reading'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
