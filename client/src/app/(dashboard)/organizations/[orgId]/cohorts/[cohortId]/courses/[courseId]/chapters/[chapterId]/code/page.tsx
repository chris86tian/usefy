import React from "react";
import EditorPanel from "../_components/EditorPanel";
import OutputPanel from "../_components/OutputPanel";
import Header from "../_components/Header";
import axios from "axios";
import { LANGUAGE_CONFIG } from "@/lib/constants";

async function fetchAssignment(
  courseId: string,
  sectionId: string,
  chapterId: string,
  assignmentId: string
) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}`;
    const { data } = await axios.get(url);

    if (
      !data.data.language ||
      !LANGUAGE_CONFIG[data.data.language.toLowerCase()]
    ) {
      data.data.language = "python";
    }

    return data;
  } catch (error) {
    console.error("Error fetching assignment:", error);
    throw error;
  }
}

export default async function Code({ searchParams }: CodeProps) {
  try {
    const resolvedSearchParams = await searchParams;
    const { courseId, sectionId, chapterId, assignmentId } =
      resolvedSearchParams;

    if (!courseId || !sectionId || !chapterId || !assignmentId) {
      throw new Error("Missing required parameters");
    }

    const assignment = await fetchAssignment(
      courseId,
      sectionId,
      chapterId,
      assignmentId
    );

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
  } catch (error) {
    console.error("Error in Code page:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Code Editor
          </h1>
          <p className="text-gray-600">
            There was an error loading the coding assignment. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }
}
