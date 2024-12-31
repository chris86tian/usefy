
"use client";

import { getExecutionResult, useCodeEditorStore } from "@/hooks/useCodeEditorStore";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Loader2, UploadCloud } from "lucide-react";
import { api } from "../../../../../../../../../convex/_generated/api";

interface SubmitButtonProps {
    task: string;
}

function SubmitButton({ task }: SubmitButtonProps) {
  const { user } = useUser();
  const { submitCode, language, isSubmitting } = useCodeEditorStore();
  const saveExecution = useMutation(api.codeExecutions.saveExecution);

  const handleSubmit = async () => {
    await submitCode(task);
    const result = getExecutionResult();

    if (user && result) {
      await saveExecution({
        language,
        code: result.code,
        output: result.output || undefined,
        error: result.error || undefined,
      });
    }
  };

  return (
    <motion.button
      onClick={handleSubmit}
      disabled={isSubmitting}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative inline-flex items-center gap-2.5 px-5 py-2.5
        disabled:cursor-not-allowed
        focus:outline-none
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 rounded-xl opacity-100 transition-opacity group-hover:opacity-90" />

      <div className="relative flex items-center gap-2.5">
        {isSubmitting ? (
          <>
            <div className="relative">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
              <div className="absolute inset-0 blur animate-pulse" />
            </div>
            <span className="text-sm font-medium text-white/90">Submitting...</span>
          </>
        ) : (
          <>
            <div className="relative flex items-center justify-center w-4 h-4">
              <UploadCloud className="w-4 h-4 text-white/90" />
            </div>
            <span className="text-sm font-semibold text-white/90 group-hover:text-white">
              Submit
            </span>
          </>
        )}
      </div>
    </motion.button>
  );
}
export default SubmitButton;
