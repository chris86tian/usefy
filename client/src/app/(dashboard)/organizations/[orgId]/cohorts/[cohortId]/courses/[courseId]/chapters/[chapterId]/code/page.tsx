import React from "react";
import EditorPanel from "../_components/EditorPanel";
import OutputPanel from "../_components/OutputPanel";
import Header from "../_components/Header";
import axios from "axios";

async function fetchAssignment(courseId: string, sectionId: string, chapterId: string, assignmentId: string) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}`;
  const { data } = await axios.get(url);
  return data;
}

export default async function Code({ searchParams }: CodeProps) {
  const resolvedSearchParams = await searchParams;
  const { courseId, sectionId, chapterId, assignmentId } = resolvedSearchParams;
  const assignment = await fetchAssignment(courseId, sectionId, chapterId, assignmentId); 

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header 
          assignment={assignment.data}
          courseId={courseId}
          sectionId={sectionId}
          chapterId={chapterId}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EditorPanel assignment={assignment.data} />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}
