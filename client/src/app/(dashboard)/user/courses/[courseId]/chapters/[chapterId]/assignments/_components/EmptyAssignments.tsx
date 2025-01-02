import React from 'react'
import { FileText } from 'lucide-react'

export const EmptyAssignments: React.FC = () => (
  <div className="text-center text-[#a0aec0] py-8" role="status">
    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
    <p className="text-lg font-semibold">No assignments available</p>
    <p className="text-sm mt-2">Check back later for new assignments.</p>
  </div>
)

