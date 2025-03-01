export function AssignmentsSkeleton({ columns = 2 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(columns * 2)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
            <div className="h-6 bg-gray-700 rounded w-1/2 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse" />
            <div className="h-8 bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}