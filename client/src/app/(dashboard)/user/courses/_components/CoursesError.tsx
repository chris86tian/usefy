import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const CoursesError: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md text-center bg-[#2a3548] border-[#3a4a64]">
        <CardHeader>
          <CardTitle className="text-[#e6e6e6] flex items-center justify-center">
            <AlertCircle className="mr-2 h-6 w-6 text-red-500" />
            Error Loading Courses
          </CardTitle>
          <CardDescription className="text-[#a0aec0]">
            We encountered an error while loading your courses. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.refresh()}
            className="w-full bg-[#4a5a74] hover:bg-[#5a6a84] text-[#e6e6e6]"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

