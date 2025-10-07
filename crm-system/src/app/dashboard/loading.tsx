export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-white/5 rounded-lg w-64"></div>
        <div className="h-4 bg-white/5 rounded-lg w-96"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-6 space-y-3">
            <div className="h-4 bg-white/10 rounded w-24"></div>
            <div className="h-8 bg-white/10 rounded w-32"></div>
            <div className="h-3 bg-white/10 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-white/5 rounded-xl p-8 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-white/10 rounded"></div>
        ))}
      </div>
    </div>
  )
}
