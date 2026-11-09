import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 text-xs">
        <p className="font-semibold text-slate-800">{item.date}</p>
        <p className="text-slate-500 mb-1">{item.time_slot}</p>
        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
          <span className="text-sm">{item.value}</span>
          <span className="text-[11px] text-slate-400">mg/dl</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function GlucoseChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-2xl bg-white p-6">
        <p className="text-sm font-medium">No chart data available for this range</p>
        <p className="text-xs text-slate-400 mt-1">Log readings across multiple days to view monthly trends</p>
      </div>
    );
  }

  // Format data for Recharts
  const chartPoints = data.map((d, index) => ({
    id: d.id || index,
    date: d.date,
    time_slot: d.time_slot,
    label: `${d.date.slice(5)} (${d.time_slot.split(' ')[0]})`,
    value: d.value,
  }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <h4 className="text-base font-bold text-slate-900">Glucose Trend (Month-to-Date)</h4>
          <p className="text-xs text-slate-500">
            Target healthy range highlighted between 70 and 140 mg/dl
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-600">Reading</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block"></span>
            <span className="text-slate-600">Target Range (70-140)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              domain={[40, 260]}
              tickCount={6}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Target Normal Zone: 70 - 140 mg/dl */}
            <ReferenceArea
              y1={70}
              y2={140}
              fill="#10b981"
              fillOpacity={0.08}
            />
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#059669', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
