import React from 'react'
import { AlertCircle } from 'lucide-react'

export const AssignmentsError: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-40 text-red-500" role="alert">
    <AlertCircle className="h-8 w-8 mb-2" aria-hidden="true" />
    <span className="text-lg font-semibold">Failed to load assignments</span>
    <p className="text-sm text-center mt-2 text-[#e6e6e6]">
      Please check your internet connection and try again.
    </p>
  </div>
)

