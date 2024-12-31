"use client";

import { useCodeEditorStore } from "@/hooks/useCodeEditorStore";
import { AlertTriangle, CheckCircle, Clock, Copy, Terminal, Code2 } from "lucide-react";
import { useState } from "react";
import RunningCodeSkeleton from "./runningCodeSkeleton";

function OutputPanel() {
  const { output = "", error = null, isRunning = false, evaluation } = useCodeEditorStore();
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('output');

  const hasContent = error || output;

  const handleCopy = async () => {
    if (!hasContent) return;
    await navigator.clipboard.writeText(error || output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Ensure evaluation object exists and has required properties
  const safeEvaluation = {
    passed: evaluation?.passed ?? false,
    score: evaluation?.score ?? 0,
    feedback: {
      correctness: evaluation?.feedback?.correctness ?? "",
      efficiency: evaluation?.feedback?.efficiency ?? "",
      bestPractices: evaluation?.feedback?.bestPractices ?? "",
    },
    suggestions: evaluation?.suggestions ?? [],
    explanation: evaluation?.explanation ?? "",
  };

  const hasEvaluation = Boolean(
    safeEvaluation.feedback.correctness || 
    safeEvaluation.feedback.efficiency || 
    safeEvaluation.feedback.bestPractices ||
    safeEvaluation.explanation
  );

  console.log(safeEvaluation);

  return (
    <div className="relative bg-[#181825] rounded-xl p-4 ring-1 ring-gray-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-[#1e1e2e] rounded-lg p-1 ring-1 ring-gray-800/50">
            <button
              onClick={() => setActiveTab('output')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeTab === 'output' 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'}`}
            >
              <Terminal className="w-4 h-4" />
              Output
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeTab === 'evaluation' 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'}`}
            >
              <Code2 className="w-4 h-4" />
              Evaluation
            </button>
          </div>
        </div>

        {hasContent && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-300 bg-[#1e1e2e] 
            rounded-lg ring-1 ring-gray-800/50 hover:ring-gray-700/50 transition-all"
          >
            {isCopied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* Output Area */}
      <div className="relative">
        <div
          className="relative bg-[#1e1e2e]/50 backdrop-blur-sm border border-[#313244] 
          rounded-xl p-4 h-[600px] overflow-auto font-mono text-sm"
        >
          {isRunning ? (
            <RunningCodeSkeleton />
          ) : error ? (
            <div className="flex items-start gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-1" />
              <div className="space-y-1">
                <div className="font-medium">Execution Error</div>
                <pre className="whitespace-pre-wrap text-red-400/80">{error}</pre>
              </div>
            </div>
          ) : activeTab === 'output' && output ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Execution Successful</span>
              </div>
              <pre className="whitespace-pre-wrap text-gray-300">{output}</pre>
            </div>
          ) : activeTab === 'evaluation' && hasEvaluation ? (
            <div className="text-gray-300 space-y-6">
              {/* Score and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {safeEvaluation.passed ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Needs Improvement</span>
                    </div>
                  )}
                </div>
                <div className="text-lg font-semibold">
                  Score: {safeEvaluation.score}/100
                </div>
              </div>

              {/* Feedback Sections */}
              <div className="space-y-4">
                {safeEvaluation.feedback.correctness && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-blue-400">Correctness</h3>
                    <p className="text-gray-400">{safeEvaluation.feedback.correctness}</p>
                  </div>
                )}
                {safeEvaluation.feedback.efficiency && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-blue-400">Efficiency</h3>
                    <p className="text-gray-400">{safeEvaluation.feedback.efficiency}</p>
                  </div>
                )}
                {safeEvaluation.feedback.bestPractices && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-blue-400">Best Practices</h3>
                    <p className="text-gray-400">{safeEvaluation.feedback.bestPractices}</p>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {safeEvaluation.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-400">Suggestions</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    {safeEvaluation.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Explanation */}
              {safeEvaluation.explanation && (
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-400">Detailed Analysis</h3>
                  <p className="text-gray-400 whitespace-pre-wrap">{safeEvaluation.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-800/50 ring-1 ring-gray-700/50 mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-center">Run your code to see the {activeTab} here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OutputPanel;