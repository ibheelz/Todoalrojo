export default function CampaignsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-4">
        <div className="h-8 bg-white/5 rounded-lg w-64"></div>
        <div className="h-4 bg-white/5 rounded-lg w-96"></div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="h-12 bg-white/5 rounded-xl flex-1 max-w-md"></div>
        <div className="h-12 bg-white/5 rounded-xl w-32"></div>
        <div className="h-12 bg-white/5 rounded-xl w-32"></div>
      </div>

      {/* Campaign cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
