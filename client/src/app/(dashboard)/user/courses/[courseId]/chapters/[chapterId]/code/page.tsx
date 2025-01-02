import React from "react";
import EditorPanel from "../_components/editorPanel";
import OutputPanel from "../_components/outputPanel";
import Header from "../_components/header";

interface CodeProps {
  searchParams: { 
    courseId: string;
    sectionId: string;
    chapterId: string;
    assignmentId: string;
  };
}

export default function Code({ searchParams }: CodeProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header searchParams={searchParams} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EditorPanel />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}
