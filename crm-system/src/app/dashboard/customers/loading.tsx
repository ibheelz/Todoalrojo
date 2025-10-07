export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-4">
        <div className="h-8 bg-white/5 rounded-lg w-64"></div>
        <div className="h-4 bg-white/5 rounded-lg w-96"></div>
      </div>

      {/* Search bar */}
      <div className="h-12 bg-white/5 rounded-xl max-w-md"></div>

      {/* Table skeleton */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="h-4 bg-white/10 rounded w-full"></div>
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="p-4 border-b border-white/10 flex gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/4"></div>
              <div className="h-3 bg-white/10 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-white/10 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
