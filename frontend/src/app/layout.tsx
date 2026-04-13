'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased transition-colors duration-500`}>
        <AppProviders>
          <AnnouncementBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
