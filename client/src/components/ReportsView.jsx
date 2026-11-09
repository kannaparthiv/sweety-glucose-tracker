import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatCard from './StatCard';
import EmptyState from './EmptyState';
import GlucoseChart from './GlucoseChart';
import { getGlucoseBadge } from './ReadingFormModal';
import {
  Calendar,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Clock,
  Layers,
} from 'lucide-react';

function formatDateHuman(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateRangeHuman(startStr, endStr) {
  if (!startStr || !endStr) return '';
  return `${formatDateHuman(startStr)} – ${formatDateHuman(endStr)}`;
}

export default function ReportsView({ onOpenAddReading }) {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'daily', 'mtd', 'monthly'

  const fetchReports = async (date) => {
    setLoading(true);
    try {
      const data = await api.getReports(date);
      setReportsData(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedDate);
  }, [selectedDate]);

  const daily = reportsData?.daily;
  const mtd = reportsData?.monthToDate;
  const monthly = reportsData?.monthly;

  return (
    <div className="space-y-6">
      {/* Date Filter & Control Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <span>Glucose Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an anchor date to generate Daily, Month-to-date and Previous Month reports
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Selected Date:
          </label>
          <div className="relative">
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-medium pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation for quick focus */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'all', label: 'All 3 Reports' },
          { id: 'daily', label: '1. Daily Report' },
          { id: 'mtd', label: '2. Month-to-Date' },
          { id: 'monthly', label: '3. Previous Month' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-600 mb-2"></div>
          <p className="text-xs">Computing glucose report analytics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. DAILY REPORT */}
          {(activeTab === 'all' || activeTab === 'daily') && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Report 1
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Daily Report</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Date: <strong className="text-slate-800">{formatDateHuman(selectedDate)}</strong>
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Total Readings:{' '}
                  <span className="font-bold text-slate-800">{daily?.count || 0} / 4 max</span>
                </div>
              </div>

              {daily?.count === 0 ? (
                <EmptyState
                  title={`No readings on ${formatDateHuman(selectedDate)}`}
                  message="You haven't logged any blood glucose readings for this selected day."
                  onAction={() => onOpenAddReading(selectedDate)}
                  actionText="Log Reading for this Day"
                />
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      title="Highest"
                      value={daily?.highest}
                      icon={ArrowUpRight}
                      color="rose"
                      description="Peak value recorded"
                    />
                    <StatCard
                      title="Lowest"
                      value={daily?.lowest}
                      icon={ArrowDownRight}
                      color="blue"
                      description="Lowest value recorded"
                    />
                    <StatCard
                      title="Average"
                      value={daily?.average}
                      icon={TrendingUp}
                      color="emerald"
                      description="Rounded to 1 decimal"
                    />
                    <StatCard
                      title="Readings"
                      value={daily?.count}
                      unit="logged"
                      icon={Activity}
                      color="purple"
                      description="Max 4 readings/day"
                    />
                  </div>

                  {/* Daily Readings Breakdown (Lists each reading with its slot) */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Slot Readings for {formatDateHuman(selectedDate)}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {daily?.readings?.map((r) => {
                        const badge = getGlucoseBadge(r.value);
                        return (
                          <div
                            key={r.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                              <span className="font-semibold text-slate-800">{r.time_slot}</span>
                              {badge && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.color}`}
                                >
                                  {badge.label.split(' ')[0]}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-2xl font-extrabold text-slate-900">
                                {r.value}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">mg/dl</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* 2. MONTH-TO-DATE REPORT */}
          {(activeTab === 'all' || activeTab === 'mtd') && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                      Report 2
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Month-to-Date Report</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Date Range:{' '}
                    <strong className="text-slate-800">
                      {formatDateRangeHuman(mtd?.dateRange?.startDate, mtd?.dateRange?.endDate)}
                    </strong>
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Readings Count:{' '}
                  <span className="font-bold text-slate-800">{mtd?.count || 0}</span>
                </div>
              </div>

              {mtd?.count === 0 ? (
                <EmptyState
                  title="No readings in Month-to-Date range"
                  message={`No glucose measurements were recorded between ${formatDateRangeHuman(
                    mtd?.dateRange?.startDate,
                    mtd?.dateRange?.endDate
                  )}.`}
                  onAction={() => onOpenAddReading(selectedDate)}
                  actionText="Log Reading"
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Highest"
                    value={mtd?.highest}
                    icon={ArrowUpRight}
                    color="rose"
                    description="Month peak"
                  />
                  <StatCard
                    title="Lowest"
                    value={mtd?.lowest}
                    icon={ArrowDownRight}
                    color="blue"
                    description="Month low"
                  />
                  <StatCard
                    title="Average"
                    value={mtd?.average}
                    icon={TrendingUp}
                    color="emerald"
                    description="Rounded to 1 decimal"
                  />
                  <StatCard
                    title="Total Readings"
                    value={mtd?.count}
                    unit="entries"
                    icon={Activity}
                    color="purple"
                    description="Month-to-date total"
                  />
                </div>
              )}
            </section>
          )}

          {/* 3. MONTHLY REPORT (PREVIOUS MONTH) */}
          {(activeTab === 'all' || activeTab === 'monthly') && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                      Report 3
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Monthly Report (Whole Previous Month)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Date Range:{' '}
                    <strong className="text-slate-800">
                      {formatDateRangeHuman(
                        monthly?.dateRange?.startDate,
                        monthly?.dateRange?.endDate
                      )}
                    </strong>
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Readings Count:{' '}
                  <span className="font-bold text-slate-800">{monthly?.count || 0}</span>
                </div>
              </div>

              {monthly?.count === 0 ? (
                <EmptyState
                  title="No readings in previous month"
                  message={`No glucose measurements were recorded between ${formatDateRangeHuman(
                    monthly?.dateRange?.startDate,
                    monthly?.dateRange?.endDate
                  )}.`}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Highest"
                    value={monthly?.highest}
                    icon={ArrowUpRight}
                    color="rose"
                    description="Previous month peak"
                  />
                  <StatCard
                    title="Lowest"
                    value={monthly?.lowest}
                    icon={ArrowDownRight}
                    color="blue"
                    description="Previous month low"
                  />
                  <StatCard
                    title="Average"
                    value={monthly?.average}
                    icon={TrendingUp}
                    color="emerald"
                    description="Rounded to 1 decimal"
                  />
                  <StatCard
                    title="Total Readings"
                    value={monthly?.count}
                    unit="entries"
                    icon={Activity}
                    color="purple"
                    description="Whole month total"
                  />
                </div>
              )}
            </section>
          )}

          {/* BONUS: Line Chart of readings over the month */}
          <section>
            <GlucoseChart data={reportsData?.chartData || []} />
          </section>
        </div>
      )}
    </div>
  );
}
