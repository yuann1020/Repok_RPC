'use client';

export default function ContactPage() {
  const contactDetails = {
    name: 'Teng Yii Thong',
    phone: '019-4091948',
    email: 'yiithong0125@gmail.com',
    whatsapp: 'https://wa.me/60194091948',
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* ── Header ───────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-8">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Get in Touch</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium">
          Have questions or need assistance? Our team is here to help.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* ── Contact Card ─────────────────────────── */}
        <div 
          className="relative group overflow-hidden rounded-[2.5rem] border border-slate-800/50 p-8 sm:p-12 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(2,9,23,0.8) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Atmosphere Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            
            {/* Left: Identity */}
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500 mb-3 block">
                  Club Representative
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {contactDetails.name}
                </h3>
              </div>

              <div className="space-y-4">
                <a 
                  href={`tel:${contactDetails.phone.replace(/-/g, '')}`}
                  className="flex items-center gap-4 text-slate-400 hover:text-green-400 transition-colors group/link"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center group-hover/link:bg-green-500/10 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                  </div>
                  <span className="text-lg font-bold">{contactDetails.phone}</span>
                </a>

                <a 
                  href={`mailto:${contactDetails.email}`}
                  className="flex items-center gap-4 text-slate-400 hover:text-green-400 transition-colors group/link"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center group-hover/link:bg-green-500/10 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <span className="text-lg font-bold">{contactDetails.email}</span>
                </a>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="flex flex-col gap-4">
              <a 
                href={contactDetails.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-green-500 text-slate-950 px-8 py-5 rounded-2xl font-black uppercase tracking-wider hover:bg-green-400 transition-all shadow-xl shadow-green-500/20 active:scale-95"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.559 4.191 1.62 6.007L0 24l6.135-1.61a11.83 11.83 0 005.91 1.592h.005c6.637 0 12.032-5.396 12.035-12.03a11.808 11.808 0 00-3.517-8.477"/></svg>
                Chat on WhatsApp
              </a>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] text-center">
                Typically replies in minutes
              </p>
            </div>

          </div>
        </div>

        {/* ── Secondary Info ────────────────────────── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
             <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Office Hours</h4>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monday - Sunday: 8:00 AM - 10:00 PM</p>
           </div>
           
           <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
             <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Response Time</h4>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">We aim to respond to all inquiries within 2 hours during office hours.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
