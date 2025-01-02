import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SignInRequired: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex h-[80vh] items-center justify-center bg-[#1e2738]">
      <Card className="w-full max-w-md text-center bg-[#2a3548] border-[#3a4a64]">
        <CardHeader>
          <CardTitle className="text-[#e6e6e6]">Sign In Required</CardTitle>
          <CardDescription className="text-[#a0aec0]">Please sign in to view your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push('/sign-in')}
            className="w-full bg-[#4a5a74] hover:bg-[#5a6a84] text-[#e6e6e6]"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

