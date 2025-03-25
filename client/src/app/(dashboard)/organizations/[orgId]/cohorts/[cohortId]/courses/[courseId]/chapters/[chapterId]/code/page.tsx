import React from "react";
import EditorPanel from "../_components/EditorPanel";
import OutputPanel from "../_components/OutputPanel";
import Header from "../_components/Header";
import axios from "axios";
import { LANGUAGE_CONFIG } from "@/lib/constants";

interface CodeProps {
  searchParams: {
    courseId?: string;
    sectionId?: string;
    chapterId?: string;
    assignmentId?: string;
  };
}

async function fetchAssignment(
  courseId: string,
  sectionId: string,
  chapterId: string,
  assignmentId: string
) {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://mhun775961.execute-api.us-east-1.amazonaws.com/migration";
    const url = `${apiUrl}/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/assignments/${assignmentId}`;

    console.log("Fetching assignment from URL:", url);
    const { data } = await axios.get(url);

    if (!data || !data.data) {
      throw new Error("Invalid response format from API");
    }

    if (
      !data.data.language ||
      !LANGUAGE_CONFIG[data.data.language.toLowerCase()]
    ) {
      data.data.language = "python";
    }

    return data;
  } catch (error) {
    console.error("Error fetching assignment:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Assignment not found");
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to access this assignment");
      } else if (error.response?.status === 401) {
        throw new Error("Please sign in to access this assignment");
      }
    }
    throw error;
  }
}

export default async function Code({ searchParams }: CodeProps) {
  try {
    console.log("Received search params:", searchParams);
    const { courseId, sectionId, chapterId, assignmentId } = searchParams;

    if (!courseId || !sectionId || !chapterId || !assignmentId) {
      console.error("Missing parameters:", {
        courseId,
        sectionId,
        chapterId,
        assignmentId,
      });
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : "There was an error loading the coding assignment. Please try again later.";

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Code Editor
          </h1>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </div>
    );
  }
}
