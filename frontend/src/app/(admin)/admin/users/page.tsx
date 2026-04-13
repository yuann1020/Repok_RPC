'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { PickleballLoader } from '@/components/ui/PickleballLoader';

export default function AdminUsersPage() {
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getAllUsers(),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-up">
      {/* ── Header ────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(51,65,85,0.45)', paddingBottom: '1.5rem' }}>
        <p className="text-[10px] uppercase tracking-[0.25em] text-green-400 font-bold mb-2">Admin › Community</p>
        <h1 className="text-3xl font-black tracking-tight text-white">Registered Users</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Manage and view the platform&apos;s active member base.</p>
      </div>

      {/* ── Loading ────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-32">
          <PickleballLoader size="lg" label="Loading users…" />
        </div>
      )}

      {/* ── Error ──────────────────────────────────── */}
      {isError && (
        <div className="p-6 rounded-xl text-center text-sm font-semibold text-red-400"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to fetch user records.
        </div>
      )}

      {/* ── Table ──────────────────────────────────── */}
      {!isLoading && !isError && users && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(51,65,85,0.5)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'rgba(2,9,23,0.8)', borderBottom: '1px solid rgba(51,65,85,0.45)' }}>
                {['User', 'Role', 'Status', 'Bookings', 'Joined At'].map(h => (
                  <th key={h} className="px-6 py-3 text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any, idx: number) => (
                <tr
                  key={u.id}
                  className="transition-colors duration-100"
                  style={{
                    borderBottom: '1px solid rgba(51,65,85,0.3)',
                    background: idx % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(2,9,23,0.3)',
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt={`${u.fullName}'s profile`} className="w-full h-full object-cover" />
                        ) : (
                          u.fullName?.charAt(0) || '?'
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{u.fullName}</span>
                        <span className="text-[10px] font-mono text-slate-600">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                      u.role === 'ADMIN' ? 'text-gold-400 border-gold-500/30 bg-gold-500/10' : 'text-slate-400 border-slate-700 bg-slate-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {u._count?.bookings || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
