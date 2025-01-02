import React from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const AssignmentsSkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading assignments">
    {[...Array(3)].map((_, index) => (
      <Card key={index} className="p-4 bg-[#3a4a64] border-[#4a5a74]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 bg-[#4a5a74]" />
          <Skeleton className="h-4 w-1/2 bg-[#4a5a74]" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/4 bg-[#4a5a74]" />
            <Skeleton className="h-8 w-24 bg-[#4a5a74]" />
          </div>
        </div>
      </Card>
    ))}
  </div>
)

