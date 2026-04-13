'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { courtsApi } from '@/lib/api/courts.api';
import { PickleballLoader } from '@/components/ui/PickleballLoader';

const formatDateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
const formatTimeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type StatusKey = 'CONFIRMED' | 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED' | 'UNPAID';

const STATUS_MAP: Record<StatusKey, { bg: string; text: string; border: string }> = {
  CONFIRMED: { bg: 'rgba(74,222,128,0.08)',   text: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  PAID:      { bg: 'rgba(74,222,128,0.08)',   text: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  PENDING:   { bg: 'rgba(234,179,8,0.08)',    text: '#eab308', border: 'rgba(234,179,8,0.25)'  },
  CANCELLED: { bg: 'rgba(239,68,68,0.07)',    text: '#f87171', border: 'rgba(239,68,68,0.2)'   },
  FAILED:    { bg: 'rgba(239,68,68,0.07)',    text: '#f87171', border: 'rgba(239,68,68,0.2)'   },
  UNPAID:    { bg: 'rgba(51,65,85,0.4)',      text: '#94a3b8', border: 'rgba(71,85,105,0.5)'   },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusKey] ?? { bg: 'rgba(30,41,59,0.6)', text: '#64748b', border: 'rgba(51,65,85,0.5)' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {status}
    </span>
  );
}

const STATUS_FILTERS = ['All', 'PENDING', 'CONFIRMED', 'CANCELLED'];

const downloadCSV = (bookingsData: any[]) => {
  if (!bookingsData || bookingsData.length === 0) return;

  const headers = ['Reference', 'Customer Name', 'Customer Email', 'Courts', 'First Slot Date', 'First Slot Time', 'Total (RM)', 'Booking Status', 'Payment Status'];
  
  const rows = bookingsData.map(b => {
    const courtNames = Array.from(new Set(b.items?.map((i: any) => i.court?.name) || [])).join(' / ');
    const firstDate = b.items?.[0]?.startTime ? formatDateLabel(b.items[0].startTime).replace(/,/g, '') : '';
    const firstTime = b.items?.[0]?.startTime ? `${formatTimeLabel(b.items[0].startTime)} - ${formatTimeLabel(b.items[0].endTime)}` : '';
    
    return [
      b.bookingReference,
      b.user?.fullName || '',
      b.user?.email || '',
      courtNames,
      firstDate,
      firstTime,
      parseFloat(b.totalAmount).toFixed(2),
      b.status,
      b.paymentStatus
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `repok_bookings_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter,   setDateFilter]   = useState('');
  const [courtFilter,  setCourtFilter]  = useState('');
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: courts } = useQuery({
    queryKey: ['admin-courts'],
    queryFn: () => courtsApi.getAllCourts(),
  });

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['admin-bookings', statusFilter, dateFilter, courtFilter],
    queryFn: () => adminApi.getAllBookings({
      status:  statusFilter || undefined,
      date:    dateFilter   || undefined,
      courtId: courtFilter  || undefined,
    }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkDeleteBookings(ids),
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      alert('Selected bookings have been permanently removed.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to delete bookings.')
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => adminApi.deleteAllBookings(),
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      alert('All bookings have been wiped from the system.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to wipe bookings.')
  });

  const { data: expandedBooking, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-booking-detail', expandedId],
    queryFn: () => adminApi.getBookingById(expandedId!),
    enabled: !!expandedId,
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === bookings?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bookings?.map((b: any) => b.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you absolutely sure you want to delete ${selectedIds.length} bookings? This action is irreversible and will release all court slots.`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleDeleteAll = () => {
    if (confirm('CRITICAL ACTION: Are you sure you want to delete EVERY booking in the database? All revenue data and court blocks will be lost forever.')) {
      deleteAllMutation.mutate();
    }
  };

  const hasFilters = !!(statusFilter || dateFilter || courtFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-up">

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ borderBottom: '1px solid rgba(51,65,85,0.45)', paddingBottom: '1.5rem' }}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-green-400 font-bold mb-2">Admin › Bookings</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Bookings Hub</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">System-wide reservation ledger with administrative filtering.</p>
        </div>

        <div className="flex items-center gap-3">
           {selectedIds.length > 0 && (
             <button
               onClick={handleBulkDelete}
               disabled={bulkDeleteMutation.isPending}
               className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl hover:bg-red-500/20 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
             >
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
               Delete Selected ({selectedIds.length})
             </button>
           )}
           <button
             onClick={handleDeleteAll}
             disabled={deleteAllMutation.isPending}
             className="text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-red-500 transition-colors px-2 py-1"
           >
             Clear All Data
           </button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-2xl"
        style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(51,65,85,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        {/* Status pill tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(2,9,23,0.6)', border: '1px solid rgba(51,65,85,0.45)' }}>
          {STATUS_FILTERS.map(s => {
            const val = s === 'All' ? '' : s;
            const active = statusFilter === val;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-150 ${
                  active
                    ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                    : 'text-slate-600 hover:text-slate-300 border border-transparent'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Court dropdown */}
        <select
          value={courtFilter}
          onChange={e => setCourtFilter(e.target.value)}
          className="input-premium px-3 py-2 text-sm"
        >
          <option value="">All Courts</option>
          {courts?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Date filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="input-premium px-3 py-2 font-mono text-sm"
        />

        {/* CSV Export Button & Clear filter container */}
        <div className="ml-auto flex items-center gap-2">
          {bookings && bookings.length > 0 && (
            <button
              onClick={() => downloadCSV(bookings)}
              className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 transition-all px-3 py-2 rounded-lg hover:bg-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.15)]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          )}

          {hasFilters && (
          <button
            onClick={() => { setStatusFilter(''); setDateFilter(''); setCourtFilter(''); }}
            className="ml-auto flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-slate-600 hover:text-slate-300 transition-colors px-3 py-2 rounded-lg hover:bg-slate-800/50"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Clear
          </button>
        )}
        </div>
      </div>

      {/* ── States: Loading / Error / Empty ─────────── */}
      {isLoading && (
        <div className="flex justify-center py-32">
          <PickleballLoader size="lg" label="Loading bookings…" />
        </div>
      )}

      {isError && (
        <div className="p-6 rounded-xl text-center text-sm font-semibold text-red-400"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to fetch booking records. Check server availability.
        </div>
      )}

      {!isLoading && !isError && (!bookings || bookings.length === 0) && (
        <div className="flex flex-col items-center justify-center py-32 rounded-2xl"
          style={{ background: 'rgba(15,23,42,0.4)', border: '1px dashed rgba(51,65,85,0.5)' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-slate-700 mb-3">
            <rect x="5" y="8" width="30" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 8V5M27 8V5M5 17h30" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M13 24h8M13 29h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".5"/>
          </svg>
          <p className="text-slate-400 font-bold text-sm">No Bookings Found</p>
          <p className="text-slate-600 text-xs mt-1">Adjust filters or wait for customer activity.</p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────── */}
      {!isLoading && !isError && bookings && bookings.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.5)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'rgba(2,9,23,0.8)', borderBottom: '1px solid rgba(51,65,85,0.45)' }}>
                <th className="px-4 py-3 pl-6 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === bookings.length}
                    onChange={toggleSelectAll}
                    className="accent-green-500 cursor-pointer w-4 h-4 bg-slate-900 border-slate-700 rounded"
                  />
                </th>
                {['Reference', 'Customer', 'Court', 'Date', 'Amount', 'Status', 'Payment', ''].map(h => (
                  <th key={h} className="px-4 py-3 last:pr-6 text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any, idx: number) => {
                const courtNames = Array.from(new Set(b.items?.map((i: any) => i.court?.name) || [])).join(', ');
                const firstDate  = b.items?.[0]?.startTime ? formatDateLabel(b.items[0].startTime) : '—';
                const isExpanded = expandedId === b.id;
                const isSelected = selectedIds.includes(b.id);

                return (
                  <>
                    <tr
                      key={b.id}
                      className="transition-colors duration-100"
                      style={{
                        borderBottom: isExpanded ? '1px solid rgba(74,222,128,0.15)' : '1px solid rgba(51,65,85,0.3)',
                        background: isSelected ? 'rgba(74,222,128,0.08)' : isExpanded ? 'rgba(74,222,128,0.03)' : idx % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(2,9,23,0.3)',
                      }}
                    >
                      <td className="px-4 py-3.5 pl-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(b.id)}
                          className="accent-green-500 cursor-pointer w-4 h-4 bg-slate-900 border-slate-700 rounded"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-300">{b.bookingReference}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-slate-200 block">{b.user?.fullName || '—'}</span>
                        <span className="text-[10px] font-mono text-slate-600">{b.user?.email || ''}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 font-medium max-w-[140px] truncate">{courtNames || '—'}</td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-500 font-mono">{firstDate}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-black text-white">RM <span className="text-green-400">{parseFloat(b.totalAmount).toFixed(0)}</span></span>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={b.paymentStatus} /></td>
                      <td className="px-4 py-3.5 pr-6 text-right">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : b.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-150 border ${
                            isExpanded
                              ? 'text-green-400 bg-green-500/10 border-green-500/25'
                              : 'text-slate-600 bg-slate-900/50 border-slate-700/60 hover:text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {isExpanded ? (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                          {isExpanded ? 'Close' : 'View'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${b.id}-detail`}>
                        <td colSpan={9} className="px-6 py-6" style={{ borderBottom: '1px solid rgba(51,65,85,0.35)', background: 'rgba(2,9,23,0.7)', borderLeft: '2px solid rgba(74,222,128,0.25)' }}>
                          {isDetailLoading ? (
                            <div className="flex justify-center py-6">
                              <PickleballLoader size="md" label="Loading detail…" />
                            </div>
                          ) : expandedBooking ? (
                            <div className="space-y-5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-sm font-black text-white">Booking #{expandedBooking.bookingReference}</h3>
                                  <p className="text-[10px] text-slate-600 font-mono mt-0.5">ID: {expandedBooking.id}</p>
                                </div>
                                <button onClick={() => setExpandedId(null)} className="text-slate-600 hover:text-white transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                </button>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                  { label: 'Customer',      value: expandedBooking.user?.fullName || '—', sub: expandedBooking.user?.email },
                                  { label: 'Booking Status', badge: expandedBooking.status },
                                  { label: 'Payment Status', badge: expandedBooking.paymentStatus },
                                  { label: 'Total',          money: parseFloat(expandedBooking.totalAmount).toFixed(2) },
                                ].map(({ label, value, sub, badge, money }) => (
                                  <div key={label} className="flex flex-col gap-1.5 p-3.5 rounded-xl"
                                    style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.45)' }}>
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black">{label}</span>
                                    {value  && <span className="text-xs font-bold text-white">{value}{sub && <span className="text-[10px] text-slate-600 font-mono block">{sub}</span>}</span>}
                                    {badge  && <StatusBadge status={badge} />}
                                    {money  && <span className="text-lg font-black text-green-400">RM {money}</span>}
                                  </div>
                                ))}
                              </div>

                              {expandedBooking.items?.length > 0 && (
                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black mb-2.5">Booked Slots</p>
                                  <div className="flex flex-wrap gap-2">
                                    {expandedBooking.items.map((item: any) => (
                                      <div key={item.id} className="flex flex-col px-4 py-3 rounded-xl"
                                        style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.4)' }}>
                                        <span className="text-xs font-bold text-green-400 mb-1">{item.court?.name || 'Court'}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{formatDateLabel(item.startTime)}</span>
                                        <span className="text-sm font-mono font-black text-white mt-1">{formatTimeLabel(item.startTime)} – {formatTimeLabel(item.endTime)}</span>
                                        <span className="text-[10px] text-slate-600 mt-1 font-semibold">RM {parseFloat(item.price).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-red-400 text-xs">Failed to load booking detail.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
