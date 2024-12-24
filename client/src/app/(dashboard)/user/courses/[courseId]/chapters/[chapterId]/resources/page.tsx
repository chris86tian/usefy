'use client';

import React from 'react';

type ResourcesProps = {
    chapterId: string;
};

const Resources = ({ chapterId }: ResourcesProps) => {

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Resources {chapterId}</h1>
      <div className="space-y-4">
        <p>This is the Resources page. Add your resources content here.</p>
      </div>
    </div>
  );
};

export default Resources;