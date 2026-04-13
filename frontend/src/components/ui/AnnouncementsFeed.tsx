'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Announcement, announcementsApi } from '@/lib/api/announcements.api';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';

type Variant = 'banner' | 'section';

function getTypeStyles(type: Announcement['type']) {
  switch (type) {
    case 'MAINTENANCE':
      return {
        text: 'text-amber-300',
        background: 'rgba(245, 158, 11, 0.14)',
        border: 'rgba(245, 158, 11, 0.24)',
      };
    case 'CLOSURE':
      return {
        text: 'text-red-300',
        background: 'rgba(248, 113, 113, 0.14)',
        border: 'rgba(248, 113, 113, 0.24)',
      };
    default:
      return {
        text: 'text-sky-300',
        background: 'rgba(56, 189, 248, 0.14)',
        border: 'rgba(56, 189, 248, 0.24)',
      };
  }
}

function formatAnnouncementWindow(announcement: Announcement) {
  const formatter = new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  if (announcement.startsAt && announcement.endsAt) {
    return `${formatter.format(new Date(announcement.startsAt))} - ${formatter.format(new Date(announcement.endsAt))}`;
  }

  if (announcement.startsAt) {
    return `Starts ${formatter.format(new Date(announcement.startsAt))}`;
  }

  if (announcement.endsAt) {
    return `Until ${formatter.format(new Date(announcement.endsAt))}`;
  }

  return 'Currently active';
}

function CommentSection({ announcementId, commentCount }: { announcementId: string, commentCount: number }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['announcement-comments', announcementId],
    queryFn: () => announcementsApi.getComments(announcementId),
    enabled: isExpanded,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => announcementsApi.addComment(announcementId, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['announcement-comments', announcementId] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentMutation.isPending) return;
    commentMutation.mutate(commentText);
  };

  return (
    <div className="mt-6 pt-4 border-t border-slate-800">
       <button 
         onClick={() => setIsExpanded(!isExpanded)}
         className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-green-400 transition-colors"
       >
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
         {commentCount} Comments {isExpanded ? '· Hide' : '· Show'}
       </button>

       {isExpanded && (
         <div className="mt-4 space-y-4 animate-fade-up">
           <div className="space-y-3">
             {isLoading ? (
               <div className="text-[10px] text-slate-600 animate-pulse">Loading discussion...</div>
             ) : comments?.length === 0 ? (
               <div className="text-[10px] text-slate-600 italic">No comments yet. Start the conversation.</div>
             ) : (
               comments?.map((c: any) => (
                 <div key={c.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-black text-slate-500 overflow-hidden shrink-0">
                      {c.user?.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-slate-300">{c.user?.fullName || 'Member'}</span>
                          <span className="text-[8px] text-slate-600 font-mono italic">{new Date(c.createdAt).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs text-slate-400 font-medium leading-relaxed">{c.content}</p>
                    </div>
                 </div>
               ))
             )}
           </div>

           {user ? (
             <form onSubmit={handleSubmit} className="relative mt-4">
                <input 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Keep it civil..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-green-500/50 transition pr-12"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="absolute right-2 top-1.5 p-1.5 text-green-500 hover:text-green-400 disabled:opacity-30 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
             </form>
           ) : (
             <p className="text-[10px] text-slate-600 italic">Sign in to participate in the discussion.</p>
           )}
         </div>
       )}
    </div>
  );
}

export function AnnouncementsFeed({ variant }: { variant: Variant }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['active-announcements'],
    queryFn: announcementsApi.getActiveAnnouncements,
  });

  if (isLoading || isError || !data?.length) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className="mb-6 space-y-3">
        {data.map((announcement) => {
          const styles = getTypeStyles(announcement.type);

          return (
            <div
              key={announcement.id}
              className="rounded-2xl border px-4 py-4 sm:px-5"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(2,9,23,0.95) 100%)',
                borderColor: styles.border,
                boxShadow: '0 12px 28px rgba(2, 6, 23, 0.28)',
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${styles.text}`}
                      style={{ background: styles.background }}
                    >
                      {announcement.type}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Live notice
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.08em] text-white sm:text-base">
                    {announcement.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {announcement.message}
                  </p>

                  {/* Multiple Image Support */}
                  {announcement.imageUrls && announcement.imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {announcement.imageUrls.map((url, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-slate-700/50 aspect-video sm:aspect-square">
                           <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <CommentSection announcementId={announcement.id} commentCount={announcement._count?.comments || 0} />
                </div>
                <p className="shrink-0 text-[11px] font-semibold text-slate-500">
                  {formatAnnouncementWindow(announcement)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="mx-auto mb-12 w-full max-w-5xl px-6">
      <div
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          background: 'rgba(15,23,42,0.52)',
          borderColor: 'rgba(51,65,85,0.55)',
          boxShadow: '0 18px 42px rgba(2, 6, 23, 0.32)',
        }}
      >
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Club updates</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Active announcements</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">
            Operational notices from the club team, including closures, maintenance windows, and same-day updates.
          </p>
        </div>

        <div className="grid gap-6">
          {data.map((announcement) => {
            const styles = getTypeStyles(announcement.type);

            return (
              <div
                key={announcement.id}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: 'rgba(2,9,23,0.58)',
                  borderColor: styles.border,
                }}
              >
                {announcement.imageUrls && announcement.imageUrls.length > 0 && (
                   <div className={`grid gap-1 ${announcement.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} bg-slate-900`}>
                     {announcement.imageUrls.slice(0, 4).map((url, i) => (
                       <div key={i} className={`relative overflow-hidden ${announcement.imageUrls.length === 1 ? 'h-64' : 'h-40'}`}>
                         <img src={url} alt="" className="w-full h-full object-cover opacity-80" />
                         {i === 3 && announcement.imageUrls.length > 4 && (
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                             <span className="text-white font-black text-xl">+{announcement.imageUrls.length - 4}</span>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                )}
                
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${styles.text}`}
                      style={{ background: styles.background }}
                    >
                      {announcement.type}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {formatAnnouncementWindow(announcement)}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{announcement.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{announcement.message}</p>

                  <CommentSection announcementId={announcement.id} commentCount={announcement._count?.comments || 0} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
