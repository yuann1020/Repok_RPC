'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courtsApi, Court } from '@/lib/api/courts.api';
import { adminApi, CreateCourtPayload } from '@/lib/api/admin.api';

export default function AdminCourtsManager() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeCourt, setActiveCourt] = useState<Partial<Court>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const { data: courts, isLoading } = useQuery({
    queryKey: ['admin-courts'],
    queryFn: () => courtsApi.getAllCourts()
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCourtPayload) => adminApi.createCourt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courts'] });
      setIsEditing(false);
      setActiveCourt({});
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to create court.')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Court> }) => adminApi.updateCourt({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courts'] });
      setIsEditing(false);
      setActiveCourt({});
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to update court.')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const payload = {
      ...activeCourt,
      pricePerHour: Number(activeCourt.pricePerHour) || 0,
      courtType: 'INDOOR', // Default kept for backend compat
      facilities: [],      // Default kept for backend compat
    };

    if (activeCourt.id) {
       updateMutation.mutate({ id: activeCourt.id, payload: payload as any });
    } else {
       createMutation.mutate(payload as any);
    }
  };

  const handleEdit = (court: Court) => {
    setActiveCourt({ ...court });
    setIsEditing(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Master Courts</h1>
          <p className="text-slate-400">Manage your courts, update pricing, and change availability status.</p>
        </div>
      </div>

      {/* 2. Court Form Modal */}
      {isEditing && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative backdrop-blur-3xl">
          <button 
             onClick={() => setIsEditing(false)}
             className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 font-bold tracking-widest text-xs uppercase"
          >✕ Close</button>
          
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Edit Court Details</h2>
          
          {errorMsg && (
             <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs font-bold uppercase tracking-widest">
               {Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}
             </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Court Name</label>
               <input required type="text" placeholder="Center Court Hub" value={activeCourt.name || ''} onChange={(e) => setActiveCourt({...activeCourt, name: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors" />
             </div>

             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price per Hour (RM)</label>
               <input required type="number" step="0.01" min="0" placeholder="75.00" value={activeCourt.pricePerHour || ''} onChange={(e) => setActiveCourt({...activeCourt, pricePerHour: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors" />
             </div>

             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
               <select value={activeCourt.category || 'STANDARD'} onChange={(e) => setActiveCourt({...activeCourt, category: e.target.value as any})} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors">
                 <option value="STANDARD">Standard</option>
                 <option value="CHAMPIONSHIP">Championship</option>
               </select>
             </div>

             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
               <select value={activeCourt.status || 'ACTIVE'} onChange={(e) => setActiveCourt({...activeCourt, status: e.target.value as any})} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-green-500 transition-colors">
                 <option value="ACTIVE">Active</option>
                 <option value="INACTIVE">Inactive</option>
                 <option value="MAINTENANCE">Maintenance</option>
               </select>
             </div>

             <div className="md:col-span-2 pt-4">
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-green-400 hover:bg-green-300 text-slate-900 font-bold px-8 py-3 rounded-lg tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(7ade80,0.3)] disabled:opacity-50">
                   {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Court'}
                </button>
             </div>
          </form>
        </div>
      )}

      {/* 3. Courts Table */}
      {!isEditing && (
        <div className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-950/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-white/5">
                 <th className="p-4 pl-6">Court Info</th>
                 <th className="p-4">Category</th>
                 <th className="p-4">Price</th>
                 <th className="p-4">Status</th>
                 <th className="p-4 text-right pr-6">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5 text-sm">
               {isLoading ? (
                 <tr><td colSpan={5} className="p-6 text-center text-slate-500">Loading courts...</td></tr>
               ) : courts?.length === 0 ? (
                 <tr><td colSpan={5} className="p-10 text-center text-slate-500 border-dashed border-2 border-slate-800 m-4 rounded-xl">No courts found. Create your first court!</td></tr>
               ) : (
                 courts?.map((court) => (
                   <tr key={court.id} className="hover:bg-white/5 transition-colors">
                     <td className="p-4 pl-6">
                       <span className="font-bold text-white block">{court.name}</span>
                     </td>
                     <td className="p-4 text-xs font-mono">
                       <span className={`px-2 py-1 rounded inline-block bg-slate-950 border border-slate-700 mr-2 ${court.category === 'CHAMPIONSHIP' ? 'text-yellow-400 border-yellow-500/30' : 'text-green-400 border-green-500/30'}`}>{court.category}</span>
                     </td>
                     <td className="p-4 font-black text-slate-200 tracking-wide">RM {parseFloat(court.pricePerHour).toFixed(0)}</td>
                     <td className="p-4">
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border rounded-full ${
                         court.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                         court.status === 'MAINTENANCE' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                         'bg-slate-800 text-slate-400 border-slate-700'
                       }`}>{court.status}</span>
                     </td>
                     <td className="p-4 text-right pr-6">
                        <button onClick={() => handleEdit(court)} className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-green-400 transition-colors bg-slate-950 border border-slate-800 hover:border-green-500/30 px-3 py-1.5 rounded">
                          Edit
                        </button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      )}

    </div>
  );
}
