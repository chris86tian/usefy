import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CoursesEmptyProps {
  searchTerm?: string;
  selectedCategory?: string;
}

export const CoursesEmpty: React.FC<CoursesEmptyProps> = ({ searchTerm, selectedCategory }) => {
  const router = useRouter();

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md text-center bg-[#2a3548] border-[#3a4a64]">
        <CardHeader>
          <CardTitle className="text-[#e6e6e6]">No Courses Found</CardTitle>
          <CardDescription className="text-[#a0aec0]">
            {searchTerm || selectedCategory !== 'all'
              ? "No courses match your current filters."
              : "It seems you have not enrolled in any courses yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push('/search')}
            className="w-full bg-[#4a5a74] hover:bg-[#5a6a84] text-[#e6e6e6]"
          >
            Browse Courses
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

