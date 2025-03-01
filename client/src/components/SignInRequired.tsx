import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SignInRequired: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-[#e6e6e6]">Sign In Required</CardTitle>
          <CardDescription className="text-[#a0aec0]">Please sign in to view this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push('/signin')}
            className="w-full"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

