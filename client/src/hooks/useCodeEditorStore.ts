import { CodeEditorState } from "../lib/utils";
import { LANGUAGE_CONFIG } from "@/app/(dashboard)/user/courses/[courseId]/chapters/[chapterId]/_constants";
import { create } from "zustand";
import { Monaco } from "@monaco-editor/react";

const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      language: "javascript",
      fontSize: 16,
      theme: "vs-dark",
    };
  }

  const savedLanguage = localStorage.getItem("editor-language") || "javascript";
  const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
  const savedFontSize = localStorage.getItem("editor-font-size") || 16;

  return {
    language: savedLanguage,
    theme: savedTheme,
    fontSize: Number(savedFontSize),
  };
};

export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
  const initialState = getInitialState();

  return {
    ...initialState,
    output: "",
    isRunning: false,
    isSubmitting: false,
    error: null,
    editor: null,
    executionResult: null,
    task: "",

    getCode: () => get().editor?.getValue() || "",

    setEditor: (editor: Monaco) => {
      const savedCode = localStorage.getItem(`editor-code-${get().language}`);
      if (savedCode) editor.setValue(savedCode);
 
      set({ editor });
    },

    setTheme: (theme: string) => {
      localStorage.setItem("editor-theme", theme);
      set({ theme });
    },

    setFontSize: (fontSize: number) => {
      localStorage.setItem("editor-font-size", fontSize.toString());
      set({ fontSize });
    },

    setLanguage: (language: string) => {
      // Save current language code before switching
      const currentCode = get().editor?.getValue();
      if (currentCode) {
        localStorage.setItem(`editor-code-${get().language}`, currentCode);
      }

      localStorage.setItem("editor-language", language);

      set({
        language,
        output: "",
        error: null,
      });
    },

    submitCode: async (task: string) => {
      const { language, getCode } = get();
      const code = getCode();
        
      if (!code) {
        set({ error: "No code to check" });
        return;
      }
    
      set({ 
        isSubmitting: true, 
        error: null, 
        output: "",
        executionResult: {
          code: "",
          output: "",
          error: null,
          evaluation: {
            passed: false,
            score: 0,
            explanation: "",
          },
        },
      });
    
      try {
        const response = await fetch("/api/submit-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ language, code, task }),
        });
    
        const data = await response.json();
    
        if (data.error) {
          set({ error: data.error });
          return;
        }
    
        const result = {
          code,
          output: "",
          error: null,
          evaluation: {
            ...data.evaluation.evaluation,
          },
        };
            
        set(state => ({
          ...state,
          executionResult: result,
        }));
      } catch (error) {
        console.error("[Store] Error running code:", error);
        set({ error: "Error running code" });
      } finally {
        set({ isSubmitting: false });
      }
    },

    runCode: async () => {
      const { language, getCode } = get();
      const code = getCode();

      if (!code) {
        set({ error: "Please enter some code" });
        return;
      }

      set({ isRunning: true, error: null, output: "" });

      try {
        const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: runtime.language,
            version: runtime.version,
            files: [{ content: code }],
          }),
        });

        const data = await response.json();

        if (data.message) {
          set({ 
            error: data.message, 
            executionResult: { 
              code, 
              output: "", 
              evaluation: {
                passed: false,
                score: 0,
                explanation: "",
              }, 
              error: data.message 
            } 
          });
          return;
        }

        if (data.compile && data.compile.code !== 0) {
          const error = data.compile.stderr || data.compile.output;
          set({
            error,
            executionResult: {
              code,
              output: "",
              error,
              evaluation: {
                passed: false,
                score: 0,
                explanation: ""
              }
            },
          });
          return;
        }

        if (data.run && data.run.code !== 0) {
          const error = data.run.stderr || data.run.output;
          set({
            error,
            executionResult: {
              code,
              output: "",
              error,
              evaluation: {
                passed: false,
                score: 0,
                explanation: ""
              }
            },
          });
          return;
        }

        const output = data.run.output;

        set({
          output: output.trim(),
          error: null,
          executionResult: {
            code,
            output: output.trim(),
            error: null,
            evaluation: {
              passed: false,
              score: 0,
              explanation: ""
            }
          },
        });
      } catch (error) {
        console.error("Error running code:", error);
        set({
          error: "Error running code",
          executionResult: {
            code, output: "", error: "Error running code",
            evaluation: {
              passed: false,
              score: 0,
              explanation: ""
            }
          },
        });
      } finally {
        set({ isRunning: false });
      }
    },
  };
});

export const getExecutionResult = () => useCodeEditorStore.getState().executionResult;