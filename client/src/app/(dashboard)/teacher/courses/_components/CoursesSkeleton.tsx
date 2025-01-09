import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const CoursesSkeleton = () => {
  // Generate an array of 6 skeleton cards
  const skeletonCards = Array(6).fill(null);

  return (
    <div className="w-full animate-in fade-in-50">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <Skeleton className="h-10 w-64" /> {/* Search input */}
        <Skeleton className="h-10 w-32" /> {/* Category dropdown */}
      </div>

      {/* Grid of Course Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletonCards.map((_, index) => (
          <div 
            key={index}
            className="group relative bg-gray-900 rounded-lg p-4 space-y-4"
          >
            {/* Course Image Skeleton */}
            <Skeleton className="aspect-video w-full rounded-lg" />
            
            {/* Course Info Skeletons */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" /> {/* Title */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-1/2" /> {/* Teacher name */}
                <Skeleton className="h-4 w-1/3" /> {/* Category */}
              </div>
            </div>

            {/* Status and Actions Skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" /> {/* Status */}
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" /> {/* Action button */}
                <Skeleton className="h-8 w-8 rounded-full" /> {/* Action button */}
              </div>
            </div>

            {/* Progress Bar Skeleton */}
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Empty State Skeleton (shown when appropriate) */}
      <div className="hidden">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  );
};

export default CoursesSkeleton;