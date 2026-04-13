'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminAnnouncement,
  CreateAnnouncementPayload,
  adminApi,
} from '@/lib/api/admin.api';

const announcementTypes = ['INFO', 'MAINTENANCE', 'CLOSURE'] as const;

function typeColors(type: AdminAnnouncement['type']) {
  switch (type) {
    case 'MAINTENANCE':
      return 'text-amber-300 border-amber-500/25 bg-amber-500/10';
    case 'CLOSURE':
      return 'text-red-300 border-red-500/25 bg-red-500/10';
    default:
      return 'text-sky-300 border-sky-500/25 bg-sky-500/10';
  }
}

const initialForm: CreateAnnouncementPayload = {
  title: '',
  message: '',
  type: 'INFO',
  isActive: true,
  imageUrls: [],
};

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateAnnouncementPayload>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, reader.result as string].slice(0, 10) // Limit to 10
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const { data: announcements, isLoading, isError } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: adminApi.getAllAnnouncements,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      setForm(initialForm);
      setEditingId(null);
      setFeedback('Announcement saved.');
    },
    onError: (error: any) => {
      setFeedback(error.response?.data?.message || 'Unable to save announcement.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: adminApi.updateAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      setForm(initialForm);
      setEditingId(null);
      setFeedback('Announcement updated.');
    },
    onError: (error: any) => {
      setFeedback(error.response?.data?.message || 'Unable to update announcement.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      setFeedback('Announcement deleted.');
    },
    onError: (error: any) => {
      setFeedback(error.response?.data?.message || 'Unable to delete announcement.');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const submitLabel = useMemo(() => {
    if (isSubmitting) return editingId ? 'Updating...' : 'Publishing...';
    return editingId ? 'Update Announcement' : 'Publish Announcement';
  }, [editingId, isSubmitting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    const payload: CreateAnnouncementPayload = {
      ...form,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const startEditing = (announcement: AdminAnnouncement) => {
    setFeedback('');
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      isActive: announcement.isActive,
      imageUrls: announcement.imageUrls || [],
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(initialForm);
    setFeedback('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="border-b border-slate-800 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-green-400">Admin · Announcements</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Broadcast operational updates</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
          Publish notices and updates with multiple photos. Operational updates maintain clarity for all players.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section
          className="rounded-3xl border p-6 h-fit"
          style={{
            background: 'rgba(15,23,42,0.58)',
            borderColor: 'rgba(51,65,85,0.55)',
          }}
        >
          <div className="mb-5">
            <h2 className="text-lg font-black text-white">
              {editingId ? 'Edit announcement' : 'New announcement'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="Operational Update"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as CreateAnnouncementPayload['type'] }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  {announcementTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Status</label>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    form.isActive
                      ? 'border-green-500/25 bg-green-500/10 text-green-300'
                      : 'border-slate-700 bg-slate-950/70 text-slate-400'
                  }`}
                >
                  <span>{form.isActive ? 'Active' : 'Inactive'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Photos ({form.imageUrls.length}/10)
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {form.imageUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                    <img src={url} alt={`Announcement photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                
                {form.imageUrls.length < 10 && (
                  <label className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/50 hover:border-green-500/50 cursor-pointer transition">
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </label>
                )}
              </div>
            </div>

            {feedback && (
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                {feedback}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-green-500 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-green-400 disabled:opacity-50"
              >
                {submitLabel}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-4">
          {isLoading ? (
            <div className="text-center text-slate-500 py-20">Loading...</div>
          ) : announcements?.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-3xl border overflow-hidden p-6"
              style={{
                background: 'rgba(15,23,42,0.58)',
                borderColor: 'rgba(51,65,85,0.55)',
              }}
            >
              <div className="flex flex-col gap-6">
                <div>
                   <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${typeColors(announcement.type)}`}>
                      {announcement.type}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                      announcement.isActive ? 'bg-green-500/10 text-green-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {announcement.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">{announcement.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{announcement.message}</p>
                </div>

                {announcement.imageUrls?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {announcement.imageUrls.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-800">
                        <img src={url} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => startEditing(announcement)}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete this?')) deleteMutation.mutate(announcement.id);
                    }}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
