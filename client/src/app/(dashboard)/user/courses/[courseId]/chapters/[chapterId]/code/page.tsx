import React from "react";
import EditorPanel from "../_components/editorPanel";
import OutputPanel from "../_components/outputPanel";
import Header from "../_components/header";
import axios from "axios";

async function fetchAssignment(
  courseId: string,
  sectionId: string,
  chapterId: string,
  assignmentId: string
) {
  const url = `http://localhost:8001/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}`;
  console.log("Request URL:", url); // Debugging the full URL
  
  try {
    const response = await axios.get(url);
    console.log("Fetched assignment:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch assignment:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", error.response?.data || error.message);
    }
    throw new Error("Could not fetch the assignment details.");
  }
}


interface CodeProps {
  searchParams: { 
    courseId: string;
    sectionId: string;
    chapterId: string;
    assignmentId: string;
  };
}

export default async function Code({ searchParams }: CodeProps) {
  const { courseId, sectionId, chapterId, assignmentId } = searchParams;

  // Fetch the assignment details
  const assignment = await fetchAssignment(courseId, sectionId, chapterId, assignmentId);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header
          title={assignment.title}
          description={assignment.description}
        />  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EditorPanel />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}
