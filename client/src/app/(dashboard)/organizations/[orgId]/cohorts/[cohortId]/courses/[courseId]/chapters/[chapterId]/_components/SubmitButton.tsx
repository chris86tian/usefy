"use client";

import { getExecutionResult, useCodeEditorStore } from "@/hooks/useCodeEditorStore";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Loader2, UploadCloud } from 'lucide-react';
import { useCreateSubmissionMutation } from "@/state/api";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { toast } from "sonner";

function SubmitButton({ courseId, sectionId, chapterId, assignmentId, assignment }: SubmitButtonProps) {
  const { user } = useUser();
  const { submitCode, isSubmitting: editorIsSubmitting } = useCodeEditorStore();
  const [createSubmission] = useCreateSubmissionMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCodeExecution = async (): Promise<ExecutionResult | null> => {
    try {
      await submitCode(assignment);
      const result = getExecutionResult();
      
      if (!result) {
        throw new Error("No execution result received");
      }
      
      return result;
    } catch (error) {
      console.error("Code execution failed:", error);
      toast.error("Failed to execute code. Please try again.");
      throw error;
    }
  };

  const createAssignmentSubmission = async (result: ExecutionResult) => {
    if (!user?.id) {
      throw new Error("User ID is required");
    }
  
    try {
      await createSubmission({
        courseId,
        chapterId,
        sectionId,
        assignmentId,
        submission: {
          submissionId: uuidv4(),
          userId: user.id,
          code: result.code,
          evaluation: {
            passed: result.evaluation.passed,
            score: result.evaluation.score,
            explanation: result.evaluation.explanation,
          },
        },
      });
    } catch (error) {
      console.error("Failed to create submission:", error);
      toast.error("Failed to submit assignment. Please try again.");
      throw error;
    }
  };  

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Please sign in to submit your assignment");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await handleCodeExecution();
      if (!result) return;

      await createAssignmentSubmission(result);

      toast.success("Assignment submitted successfully!");
    } catch (error) {
      console.error("Submission process failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.button
      onClick={handleSubmit}
      disabled={isSubmitting || editorIsSubmitting}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex items-center gap-3 px-4 py-2.5 bg-background/80 hover:bg-background/90
        rounded-lg transition-all duration-200 border border-border hover:border-border/80"
    >
      <div className="absolute inset-0 blur animate-pulse" />

      <div className="flex items-center gap-2.5">
        {(isSubmitting || editorIsSubmitting) ? (
          <>
            <div className="relative">
              <Loader2 className="w-4 h-4 animate-spin text-foreground/70" />
              <div className="absolute inset-0 blur animate-pulse" />
            </div>
            <span className="text-sm font-medium text-foreground/90">Submitting...</span>
          </>
        ) : (
          <>
            <div className="relative flex items-center justify-center w-4 h-4">
              <UploadCloud className="w-4 h-4 text-foreground/90" />
            </div>
            <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">
              Submit
            </span>
          </>
        )}
      </div>
    </motion.button>
  );
}

export default SubmitButton;
