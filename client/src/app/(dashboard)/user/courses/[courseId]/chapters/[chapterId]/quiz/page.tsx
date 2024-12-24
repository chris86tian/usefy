'use client';

import React from 'react';

type QuizProps = {
    chapterId: string;
};

const Quiz = ({ chapterId }: QuizProps) => {

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Quiz {chapterId}</h1>
      <div className="space-y-4">
        <p>This is the Quiz page. Add your quiz content here.</p>
      </div>
    </div>
  );
};

export default Quiz;