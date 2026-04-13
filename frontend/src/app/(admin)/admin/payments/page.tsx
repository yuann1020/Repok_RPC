'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { PickleballLoader } from '@/components/ui/PickleballLoader';

const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}  ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

type PayStatusKey = 'PAID' | 'UNPAID' | 'FAILED' | 'REFUNDED' | 'PENDING_REVIEW';

const PAY_STATUS_MAP: Record<PayStatusKey, { bg: string; text: string; border: string }> = {
  PAID:           { bg: 'rgba(74,222,128,0.08)',  text: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  UNPAID:         { bg: 'rgba(51,65,85,0.4)',     text: '#94a3b8', border: 'rgba(71,85,105,0.5)'  },
  PENDING_REVIEW: { bg: 'rgba(245,158,11,0.08)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  FAILED:         { bg: 'rgba(239,68,68,0.07)',   text: '#f87171', border: 'rgba(239,68,68,0.2)'  },
  REFUNDED:       { bg: 'rgba(167,139,250,0.08)', text: '#a78bfa', border: 'rgba(167,139,250,0.2)'},
};

function PayStatusBadge({ status }: { status: string }) {
  const s = PAY_STATUS_MAP[status as PayStatusKey] ?? { bg: 'rgba(30,41,59,0.6)', text: '#64748b', border: 'rgba(51,65,85,0.5)' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {status === 'PAID' && (
        <span className="mr-1.5 relative flex h-1.5 w-1.5">
          <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
        </span>
      )}
      {status}
    </span>
  );
}

const FILTER_OPTIONS: { label: string; val: string }[] = [
  { label: 'All',      val: ''        },
  { label: 'Pending',  val: 'PENDING_REVIEW' },
  { label: 'Paid',     val: 'PAID'    },
  { label: 'Unpaid',   val: 'UNPAID'  },
  { label: 'Failed',   val: 'FAILED'  },
  { label: 'Refunded', val: 'REFUNDED'},
];

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: payments, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: () => adminApi.getAllPayments({ status: statusFilter || undefined }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkDeletePayments(ids),
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      alert('Selected payment records have been deleted.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to delete payments.')
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => adminApi.deleteAllPayments(),
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      alert('All payment records have been cleared.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to clear payments.')
  });

  const { data: expandedPayment, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-payment-detail', expandedId],
    queryFn: () => adminApi.getPaymentById(expandedId!),
    enabled: !!expandedId,
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === payments?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(payments?.map((p: any) => p.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} payment records? This is and audit-critical action.`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleDeleteAll = () => {
    if (confirm('DANGER: This will wipe ALL payment history. This action should only be used in development or clearing test data. Proceed?')) {
      deleteAllMutation.mutate();
    }
  };

  // Running totals when data is available
  const totalPaid = payments
    ?.filter((p: any) => p.status === 'PAID')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-up">

      {/* ── Header ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ borderBottom: '1px solid rgba(51,65,85,0.45)', paddingBottom: '1.5rem' }}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-green-400 font-bold mb-2">Admin › Payments</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Payment Ledger</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Full transactional audit trail across all customer bookings.</p>
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

      {/* ── Summary strip ─────────────────────────── */}
      {payments && payments.length > 0 && (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl animate-fade-up-delay-1"
          style={{ background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.45)' }}
        >
          {[
            { label: 'Total Records', value: `${payments.length}`,        color: '#94a3b8' },
            { label: 'Paid Revenue',  value: `RM ${totalPaid.toFixed(2)}`, color: '#4ade80' },
            { label: 'Paid Count',    value: `${payments.filter((p: any) => p.status === 'PAID').length}`,   color: '#4ade80' },
            { label: 'Unpaid Count',  value: `${payments.filter((p: any) => p.status === 'UNPAID').length}`, color: '#eab308' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col gap-1 px-5 py-4" style={{ background: 'rgba(15,23,42,0.7)' }}>
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-bold">{label}</span>
              <span className="text-sm font-black" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-2xl"
        style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(51,65,85,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        {/* Pill tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(2,9,23,0.6)', border: '1px solid rgba(51,65,85,0.45)' }}>
          {FILTER_OPTIONS.map(({ label, val }) => {
            const active = statusFilter === val;
            return (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-150 ${
                  active
                    ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                    : 'text-slate-600 hover:text-slate-300 border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {payments && (
          <span className="ml-auto text-[10px] font-mono text-slate-600 tracking-wider">
            {payments.length} record{payments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Loading ────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-32">
          <PickleballLoader size="lg" label="Loading payments…" />
        </div>
      )}

      {/* ── Error ──────────────────────────────────── */}
      {isError && (
        <div className="p-6 rounded-xl text-center text-sm font-semibold text-red-400"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to fetch payment records.
        </div>
      )}

      {/* ── Empty ──────────────────────────────────── */}
      {!isLoading && !isError && (!payments || payments.length === 0) && (
        <div className="flex flex-col items-center justify-center py-32 rounded-2xl"
          style={{ background: 'rgba(15,23,42,0.4)', border: '1px dashed rgba(51,65,85,0.5)' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-slate-700 mb-3">
            <rect x="3" y="9" width="34" height="22" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 17h34" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="11" cy="25" r="2.5" fill="currentColor"/>
          </svg>
          <p className="text-slate-400 font-bold text-sm">No Payments Found</p>
          <p className="text-slate-600 text-xs mt-1">Adjust filter or wait for transaction activity.</p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────── */}
      {!isLoading && !isError && payments && payments.length > 0 && (
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
                    checked={selectedIds.length === payments.length}
                    onChange={toggleSelectAll}
                    className="accent-green-500 cursor-pointer w-4 h-4 bg-slate-900 border-slate-700 rounded"
                  />
                </th>
                {['Payment ID', 'Booking Ref', 'Amount', 'Currency', 'Provider', 'Status', 'Paid At', ''].map(h => (
                  <th key={h} className="px-4 py-3 last:pr-6 text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any, idx: number) => {
                const isExp = expandedId === p.id;
                const isSelected = selectedIds.includes(p.id);
                return (
                  <>
                    <tr
                      key={p.id}
                      className="transition-colors duration-100"
                      style={{
                        borderBottom: isExp ? '1px solid rgba(74,222,128,0.15)' : '1px solid rgba(51,65,85,0.3)',
                        background: isSelected ? 'rgba(74,222,128,0.08)' : isExp ? 'rgba(74,222,128,0.03)' : idx % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(2,9,23,0.3)',
                      }}
                    >
                      <td className="px-4 py-3.5 pl-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-green-500 cursor-pointer w-4 h-4 bg-slate-900 border-slate-700 rounded"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-slate-600 max-w-[120px] truncate">{p.id}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold text-slate-300">{p.booking?.bookingReference || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-black">RM <span className="text-green-400">{parseFloat(p.amount).toFixed(2)}</span></span>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-600 font-mono uppercase">{p.currency || 'MYR'}</td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-500 font-semibold">{p.provider || 'MOCK'}</td>
                      <td className="px-4 py-3.5"><PayStatusBadge status={p.status} /></td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-600 font-mono whitespace-nowrap">{formatDateTime(p.paidAt || p.createdAt)}</td>
                      <td className="px-4 py-3.5 pr-6 text-right">
                        <button
                          onClick={() => setExpandedId(isExp ? null : p.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-150 border ${
                            isExp
                              ? 'text-green-400 bg-green-500/10 border-green-500/25'
                              : 'text-slate-600 bg-slate-900/50 border-slate-700/60 hover:text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {isExp ? (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                          {isExp ? 'Close' : 'Detail'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {isExp && (
                      <tr key={`${p.id}-detail`}>
                        <td colSpan={9} className="px-6 py-6"
                          style={{ borderBottom: '1px solid rgba(51,65,85,0.35)', background: 'rgba(2,9,23,0.7)', borderLeft: '2px solid rgba(74,222,128,0.25)' }}>
                          {isDetailLoading ? (
                            <div className="flex justify-center py-6">
                              <PickleballLoader size="md" label="Loading detail…" />
                            </div>
                          ) : expandedPayment ? (
                            <div className="space-y-5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-sm font-black text-white">Payment Detail</h3>
                                  <p className="text-[10px] text-slate-600 font-mono mt-0.5">ID: {expandedPayment.id}</p>
                                </div>
                                <button onClick={() => setExpandedId(null)} className="text-slate-600 hover:text-white transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                </button>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                  { label: 'Amount',   money: parseFloat(expandedPayment.amount).toFixed(2) },
                                  { label: 'Status',   badge: expandedPayment.status },
                                  { label: 'Provider', value: expandedPayment.provider || 'MOCK' },
                                  { label: 'Created',  value: formatDateTime(expandedPayment.createdAt) },
                                ].map(({ label, money, badge, value }) => (
                                  <div key={label} className="flex flex-col gap-1.5 p-3.5 rounded-xl"
                                    style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.45)' }}>
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black">{label}</span>
                                    {money && <span className="text-lg font-black text-green-400">RM {money}</span>}
                                    {badge && <PayStatusBadge status={badge} />}
                                    {value && <span className="text-xs font-semibold text-slate-300 font-mono">{value}</span>}
                                  </div>
                                ))}
                              </div>

                              {expandedPayment.booking && (
                                <div className="p-4 rounded-xl" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.4)' }}>
                                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black mb-3">Linked Booking</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                      { label: 'Reference', val: expandedPayment.booking.bookingReference },
                                      { label: 'Customer',  val: expandedPayment.booking.user?.fullName || '—' },
                                      { label: 'Status',    badge: expandedPayment.booking.status },
                                      { label: 'Total',     money: parseFloat(expandedPayment.booking.totalAmount).toFixed(2) },
                                    ].map(({ label, val, badge, money }) => (
                                      <div key={label}>
                                        <span className="text-[9px] text-slate-600 block mb-1">{label}</span>
                                        {val   && <span className="text-xs font-bold text-slate-300">{val}</span>}
                                        {badge && <PayStatusBadge status={badge} />}
                                        {money && <span className="text-sm font-black text-white">RM {money}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {expandedPayment.paidAt && (
                                <p className="text-[10px] text-slate-600 font-mono">Settled: {formatDateTime(expandedPayment.paidAt)}</p>
                              )}

                              {expandedPayment.proofImageUrl && (
                                <div className="mt-6 p-4 rounded-xl border border-slate-700/50" style={{ background: 'rgba(15,23,42,0.9)' }}>
                                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black mb-3 text-center">Customer Payment Proof Image</p>
                                  <div className="flex justify-center mb-6">
                                    <img src={expandedPayment.proofImageUrl} alt="Proof" className="max-w-full md:max-w-[400px] rounded-lg border-4 border-slate-800 shadow-xl" />
                                  </div>
                                  
                                  {expandedPayment.status === 'PENDING_REVIEW' && (
                                    <div className="flex flex-wrap gap-4 justify-center border-t border-slate-700/50 pt-6">
                                      <button 
                                        onClick={async () => {
                                           if (confirm('Reject this payment proof?')) {
                                              await adminApi.reviewPayment(expandedPayment.id, 'FAILED');
                                              refetch();
                                              setExpandedId(null);
                                           }
                                        }}
                                        className="py-2.5 px-6 rounded-lg text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
                                      >
                                        Reject Payment
                                      </button>
                                      
                                      <button 
                                        onClick={async () => {
                                           if (confirm('Approve this payment proof and confirm booking?')) {
                                              await adminApi.reviewPayment(expandedPayment.id, 'PAID');
                                              refetch();
                                              setExpandedId(null);
                                           }
                                        }}
                                        className="py-2.5 px-8 rounded-lg text-xs font-black uppercase tracking-widest text-slate-900 bg-green-500 hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all"
                                      >
                                        Approve Payment
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-red-400 text-xs">Failed to load payment detail.</p>
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
