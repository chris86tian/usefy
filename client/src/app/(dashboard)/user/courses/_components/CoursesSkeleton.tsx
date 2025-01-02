import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const CoursesSkeleton: React.FC = () => (
  <div className="bg-[#1e2738] text-[#e6e6e6] min-h-screen p-6">
    <Skeleton className="h-10 w-1/4 mb-2 bg-[#3a4a64]" />
    <Skeleton className="h-6 w-1/3 mb-6 bg-[#3a4a64]" />
    <Skeleton className="h-12 w-full mb-6 bg-[#3a4a64]" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, index) => (
        <Card key={index} className="bg-[#2a3548] border-[#3a4a64]">
          <CardContent className="p-4">
            <Skeleton className="h-40 w-full mb-4 bg-[#3a4a64]" />
            <Skeleton className="h-6 w-3/4 mb-2 bg-[#3a4a64]" />
            <Skeleton className="h-4 w-1/2 mb-4 bg-[#3a4a64]" />
            <Skeleton className="h-8 w-full bg-[#3a4a64]" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

