export default function LinkExpiredPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="premium-card max-w-md text-center">
        <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Link Expired</h1>
        <p className="text-white/60 mb-6">This short link has expired and is no longer available.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-primary text-black rounded-xl font-medium hover:bg-primary/80 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}