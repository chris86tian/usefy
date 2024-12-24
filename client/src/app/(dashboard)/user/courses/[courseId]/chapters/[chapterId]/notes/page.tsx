'use client';

import React from 'react';

type NotesProps = {
    chapterId: string;
};

const Notes = ({ chapterId }: NotesProps) => {

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Notes {chapterId}</h1>
      <div className="space-y-4">
        <p>This is the Notes page. Add your notes content here.</p>
      </div>
    </div>
  );
};

export default Notes;