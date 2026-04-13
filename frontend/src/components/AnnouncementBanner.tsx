'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { announcementsApi, Announcement } from '@/lib/api/announcements.api';
import { MegaphoneIcon, XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export function AnnouncementBanner() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['active-announcements'],
    queryFn: announcementsApi.getActiveAnnouncements,
    refetchInterval: 60000, // Refetch every minute
  });

  const [visibleIdx, setVisibleIdx] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setVisibleIdx((curr) => (curr + 1) % announcements.length);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(interval);
  }, [announcements]);

  if (isLoading || !announcements || announcements.length === 0 || isDismissed) {
    return null;
  }

  const current = announcements[visibleIdx];

  const bannerStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'CLOSURE':
        return 'bg-red-600 text-white';
      case 'MAINTENANCE':
        return 'bg-amber-500 text-slate-950';
      default:
        return 'bg-indigo-600 text-white';
    }
  };

  const Icon = (type: Announcement['type']) => {
    switch (type) {
      case 'CLOSURE':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'MAINTENANCE':
        return <InformationCircleIcon className="h-5 w-5" />;
      default:
        return <MegaphoneIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className={`relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-2.5 sm:px-3.5 sm:before:flex-1 ${bannerStyles(current.type)}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6">
          <strong className="font-bold flex items-center gap-2">
            {Icon(current.type)}
            {current.title}
          </strong>
          <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
            <circle cx="1" cy="1" r="1" />
          </svg>
          {current.message}
        </p>
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
