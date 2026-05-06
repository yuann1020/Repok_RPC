import { CustomerHeader } from '@/components/shared/CustomerHeader';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <CustomerHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 animate-fade-up">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Repok Pickleball Club. Premium Experience.
          </p>
          <p className="mt-1 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] opacity-60">
            Developed by Louis
          </p>
        </div>
      </footer>
    </div>
  );
}
