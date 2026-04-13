export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#020917' }}
    >
      {/* Background atmosphere — matches global but localized for auth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Center green radial */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: '700px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(74,222,128,0.09) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        {/* Bottom-right amber */}
        <div style={{
          position: 'absolute',
          bottom: '-100px', right: '-100px',
          width: '500px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        {/* Faint court lines — diagonal */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            repeating-linear-gradient(-55deg, transparent, transparent 120px, rgba(74,222,128,0.02) 120px, rgba(74,222,128,0.02) 121px),
            repeating-linear-gradient(35deg, transparent, transparent 180px, rgba(74,222,128,0.015) 180px, rgba(74,222,128,0.015) 181px)
          `,
        }} />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md animate-fade-up"
        style={{
          background: 'rgba(15,23,42,0.75)',
          border: '1px solid rgba(51,65,85,0.55)',
          borderRadius: '1.25rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(74,222,128,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          padding: '2.5rem 2rem',
        }}
      >
        {/* Brand wordmark inside card */}
        <div className="text-center mb-8">
          <span className="text-xl font-black text-[#4ade80] uppercase tracking-wider italic">
            Repok
          </span>
          <p className="mt-1 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] opacity-60 text-center">
            Developed by Louis
          </p>
          <div
            className="mx-auto mt-3 mb-0"
            style={{
              width: '32px', height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.5), transparent)',
            }}
          />
        </div>

        {children}
      </div>
    </div>
  );
}
