export default function LinkInactivePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="premium-card max-w-md text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Link Inactive</h1>
        <p className="text-white/60 mb-6">This short link has been deactivated and is no longer available.</p>
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