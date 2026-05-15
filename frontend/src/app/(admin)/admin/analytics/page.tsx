'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// Generates a local YYYY-MM string
const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const COLORS = ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function AdminAnalyticsPage() {
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonth());

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['admin-analytics-summary', filterMonth],
    queryFn: () => adminApi.getAdminAnalyticsSummary({ month: filterMonth }),
    staleTime: 30000,
  });

  const handleQuickFilter = (type: 'THIS_MONTH' | 'LAST_MONTH') => {
    const d = new Date();
    if (type === 'LAST_MONTH') {
      d.setMonth(d.getMonth() - 1);
    }
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm font-semibold text-slate-400 animate-pulse uppercase tracking-widest">
          Loading Analytics...
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm font-semibold text-red-400 bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/20">
          Failed to load analytics data.
        </div>
      </div>
    );
  }

  const { bookingMetrics, revenueMetrics, paymentMetrics, courtMetrics, timeMetrics } = summary;
  
  const hasData = bookingMetrics.periodBookings > 0;
  
  // Format dates for charts
  const dailyData = timeMetrics.bookingsByDay.map((d: any) => ({
    ...d,
    shortDate: d.date.split('-').slice(1).join('/')
  }));

  const revenueSourcesData = [
    { name: 'Wallet', value: revenueMetrics.walletPaymentRevenue },
    { name: 'Manual QR', value: revenueMetrics.manualQrRevenue },
    { name: 'Stripe Top-ups', value: revenueMetrics.stripeTopUpRevenue },
  ].filter(d => d.value > 0);

  const bookingStatusData = [
    { name: 'Confirmed', value: bookingMetrics.confirmedBookings },
    { name: 'Pending', value: bookingMetrics.pendingBookings },
    { name: 'Expired', value: bookingMetrics.expiredBookings },
    { name: 'Cancelled', value: bookingMetrics.cancelledBookings },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">Analytics</h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">Professional SaaS Dashboard & Insight Metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 border border-slate-700/50 p-2 rounded-2xl shadow-lg">
          <button 
            onClick={() => handleQuickFilter('THIS_MONTH')}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            This Month
          </button>
          <button 
            onClick={() => handleQuickFilter('LAST_MONTH')}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Last Month
          </button>
          <div className="w-px h-6 bg-slate-700/50 mx-1" />
          <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-sm font-bold px-4 py-2 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
          />
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 px-6 py-4 rounded-r-2xl">
        <span className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Showing data for: {summary.selectedRange?.label || filterMonth}
        </span>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Period Revenue" value={`RM ${revenueMetrics.periodRevenue.toFixed(2)}`} highlight />
        <MetricCard title="Period Bookings" value={bookingMetrics.periodBookings} />
        <MetricCard title="Confirmed" value={bookingMetrics.confirmedBookings} color="text-green-400" />
        <MetricCard title="Expired" value={bookingMetrics.expiredBookings} color="text-red-400" />
        <MetricCard title="Pending Reviews" value={paymentMetrics.pendingManualReviews} alert={paymentMetrics.pendingManualReviews > 0} />
        <MetricCard title="Most Popular Court" value={courtMetrics.mostPopularCourt?.courtName || 'N/A'} subValue={courtMetrics.mostPopularCourt ? `${courtMetrics.mostPopularCourt.bookingCount} bookings` : ''} />
        <MetricCard title="Peak Booking Hour" value={timeMetrics.peakBookingHour?.hour || 'N/A'} subValue={timeMetrics.peakBookingHour?.bookingCount > 0 ? `${timeMetrics.peakBookingHour.bookingCount} peak load` : ''} />
        <MetricCard title="Avg Rev / Booking" value={`RM ${revenueMetrics.averageRevenuePerBooking?.toFixed(2) || '0.00'}`} />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
          <div className="p-4 bg-slate-800/50 rounded-full mb-4 border border-slate-700/50">
            <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-widest">No booking activity for this period.</h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">Adjust your date filters to see analytical insights.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Charts Row 1: Line & Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Daily Revenue Trend" subtitle="Revenue generated per day across the selected period">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `RM${val}`} />
                  <Tooltip content={<CustomTooltip prefix="RM" />} cursor={{ stroke: '#4ade80', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Bookings Per Day" subtitle="Daily booking volume">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip suffix=" bookings" />} cursor={{ fill: '#334155', opacity: 0.4 }} />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts Row 2: Donut & Horizontal Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Revenue Sources" subtitle="Distribution of payment methods">
              {revenueSourcesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueSourcesData}
                      cx="50%" cy="45%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueSourcesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip prefix="RM" />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="No revenue" />
              )}
            </ChartCard>

            <ChartCard title="Court Performance" subtitle="Total bookings by court">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courtMetrics.courtUtilization} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="courtName" type="category" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip suffix=" bookings" />} cursor={{ fill: '#334155', opacity: 0.4 }} />
                  <Bar dataKey="bookingCount" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts Row 3: Peak Hours & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Peak Booking Hours" subtitle="Hourly distribution of bookings">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeMetrics.bookingsByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} dy={10} interval="preserveStartEnd" />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip suffix=" bookings" />} cursor={{ fill: '#334155', opacity: 0.4 }} />
                  <Bar dataKey="bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Booking Status Breakdown" subtitle="Confirmed vs Expired vs Cancelled">
              {bookingStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%" cy="45%"
                      innerRadius={0} outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {bookingStatusData.map((entry, index) => {
                        let color = '#64748b';
                        if (entry.name === 'Confirmed') color = '#4ade80';
                        if (entry.name === 'Pending') color = '#f59e0b';
                        if (entry.name === 'Expired') color = '#ef4444';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip suffix=" bookings" />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="No bookings" />
              )}
            </ChartCard>
          </div>

          {/* Monthly Summary Section */}
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-8 shadow-2xl mt-8">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Period Summary Report</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <SummaryItem label="Total Revenue" value={`RM ${revenueMetrics.periodRevenue.toFixed(2)}`} />
              <SummaryItem label="Confirmed Bookings" value={bookingMetrics.confirmedBookings} />
              <SummaryItem label="Avg Rev / Booking" value={`RM ${revenueMetrics.averageRevenuePerBooking?.toFixed(2) || '0.00'}`} />
              <SummaryItem label="Wallet Payments" value={`RM ${revenueMetrics.walletPaymentRevenue.toFixed(2)}`} />
              <SummaryItem label="Manual QR" value={`RM ${revenueMetrics.manualQrRevenue.toFixed(2)}`} />
              <SummaryItem label="Stripe Top-ups" value={`RM ${revenueMetrics.stripeTopUpRevenue.toFixed(2)}`} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, subValue, highlight, alert, color }: { title: string, value: any, subValue?: string, highlight?: boolean, alert?: boolean, color?: string }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-center shadow-lg ${
      alert ? 'bg-red-500/10 border-red-500/30' : 
      highlight ? 'bg-green-500/10 border-green-500/20' : 
      'bg-slate-900/60 border-slate-700/50 hover:border-slate-600/80'
    }`}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{title}</p>
      <p className={`text-2xl font-black truncate ${alert ? 'text-red-400' : highlight ? 'text-green-400' : color || 'text-white'}`}>
        {value}
      </p>
      {subValue && <p className="mt-1 text-xs text-slate-500 font-medium truncate">{subValue}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 flex flex-col shadow-xl h-[360px]">
      <div className="mb-6 shrink-0">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
      </div>
      <div className="flex-1 w-full min-h-0">
        {children}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
      <span className="text-lg font-black text-white">{value}</span>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center border border-dashed border-slate-700 rounded-2xl">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{label}</span>
    </div>
  );
}

// Custom Recharts Tooltip
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-2xl">
        {label && <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm font-black text-white" style={{ color: entry.color }}>
            {entry.name && entry.name !== 'value' ? `${entry.name}: ` : ''}
            {prefix}{Number(entry.value).toLocaleString()}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
