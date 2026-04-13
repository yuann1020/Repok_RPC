import { AnnouncementsFeed } from '@/components/ui/AnnouncementsFeed';

export default function AnnouncementsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Announcements</h2>
          <p className="text-slate-400 mt-2">Latest updates and operational notices from the club.</p>
        </div>
      </div>
      <AnnouncementsFeed variant="section" />
    </div>
  );
}
