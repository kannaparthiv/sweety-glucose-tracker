import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ReadingFormModal from './components/ReadingFormModal';
import ReadingsList from './components/ReadingsList';
import ReportsView from './components/ReportsView';
import {
  Plus,
  Activity,
  BarChart2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Heart,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState('readings'); // 'readings' | 'reports'

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [readingDefaultDate, setReadingDefaultDate] = useState('');

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Readings Data
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filterDate, setFilterDate] = useState('');
  const [filterSlot, setFilterSlot] = useState('');
  const [readingsLoading, setReadingsLoading] = useState(false);

  // Fetch Readings
  const fetchReadings = useCallback(
    async (page = 1) => {
      if (!isAuthenticated) return;
      setReadingsLoading(true);
      try {
        const res = await api.getReadings({
          page,
          limit: 20,
          date: filterDate,
          slot: filterSlot,
        });
        setReadings(res.readings);
        setPagination(res.pagination);
      } catch (err) {
        showToast(err.message || 'Failed to fetch readings', 'error');
      } finally {
        setReadingsLoading(false);
      }
    },
    [isAuthenticated, filterDate, filterSlot]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchReadings(1);
    }
  }, [isAuthenticated, filterDate, filterSlot, fetchReadings]);

  // Reading Actions
  const handleOpenAdd = (date = '') => {
    setEditingReading(null);
    setReadingDefaultDate(date || '');
    setReadingModalOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setReadingModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteReading(id);
      showToast('Reading deleted successfully.', 'success');
      fetchReadings(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to delete reading', 'error');
    }
  };

  const handleReadingSuccess = () => {
    showToast(
      editingReading ? 'Reading updated successfully!' : 'Blood glucose reading recorded!',
      'success'
    );
    fetchReadings(pagination.page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Loading Sweety...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <Navbar
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs font-semibold border ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          /* Logged-out Landing View */
          <div className="max-w-3xl mx-auto py-12 text-center space-y-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kenpath Engineering Take-Home Assignment</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                Track blood glucose with <span className="text-emerald-600">clarity</span> & ease.
              </h1>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                Sweety helps diabetes patients record up to 4 readings a day and generates
                instant daily, month-to-date, and previous-month clinical reports.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition hover:-translate-y-0.5"
              >
                Sign In to Demo Account
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setAuthModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-sm transition"
              >
                Create New Patient Account
              </button>
            </div>

            {/* Quick Demo Credentials Info */}
            <div className="mt-8 p-4 rounded-2xl bg-white border border-slate-200 max-w-md mx-auto text-left shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Pre-seeded Demo Patient</span>
              </div>
              <p className="text-xs text-slate-600 mb-1">
                <strong>Email:</strong> demo@sweety.com
              </p>
              <p className="text-xs text-slate-600 mb-2">
                <strong>Password:</strong> Password123!
              </p>
              <p className="text-[11px] text-slate-400">
                Pre-loaded with 45+ days of readings to immediately test Daily, Month-to-date, and
                Previous Month reports!
              </p>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="space-y-6">
            {/* Top Bar: Navigation Tabs & Add Reading CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2 bg-slate-200/70 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('readings')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeTab === 'readings'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Readings Log</span>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeTab === 'reports'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <span>Reports & Analytics</span>
                </button>
              </div>

              <button
                onClick={() => handleOpenAdd()}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Reading</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'readings' ? (
              <div className="space-y-6">
                <ReadingsList
                  readings={readings}
                  pagination={pagination}
                  onPageChange={(p) => fetchReadings(p)}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  filterSlot={filterSlot}
                  setFilterSlot={setFilterSlot}
                  filterDate={filterDate}
                  setFilterDate={setFilterDate}
                  onOpenAdd={() => handleOpenAdd()}
                />
              </div>
            ) : (
              <ReportsView onOpenAddReading={handleOpenAdd} />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <ReadingFormModal
        isOpen={readingModalOpen}
        onClose={() => setReadingModalOpen(false)}
        onSuccess={handleReadingSuccess}
        initialData={editingReading}
        defaultDate={readingDefaultDate}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">
            Sweety – Blood Glucose Tracker (MERN + PostgreSQL)
          </p>
          <p>Kenpath Engineering Recruitment Assignment</p>
        </div>
      </footer>
    </div>
  );
}
