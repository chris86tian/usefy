"use client"

import { useCodeEditorStore } from "@/hooks/useCodeEditorStore"
import { AlertTriangle, CheckCircle, Clock, Copy, Terminal, Code2 } from "lucide-react"
import { useState } from "react"
import RunningCodeSkeleton from "./RunningCodeSkeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function OutputPanel() {
  const { output, error, isRunning, isSubmitting, executionResult } = useCodeEditorStore()

  const [isCopied, setIsCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("output")

  const hasContent = error || output || executionResult?.evaluation

  const handleCopy = async () => {
    if (!hasContent) return
    await navigator.clipboard.writeText(error || output)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const evaluation = executionResult?.evaluation

  return (
    <Card>
      <CardHeader className="flex items-center justify-between p-1">
        {hasContent && (
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {isCopied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="py-4">
          <TabsList>
            <TabsTrigger value="output">
              <Terminal className="w-4 h-4 mr-1" />
              Output
            </TabsTrigger>
            <TabsTrigger value="evaluation">
              <Code2 className="w-4 h-4 mr-1" />
              Evaluation
            </TabsTrigger>
          </TabsList>
          <TabsContent value="output" className="mt-2">
            <div className="relative bg-muted p-2 rounded-lg h-[600px] overflow-auto font-mono text-sm">
              {isRunning || isSubmitting ? (
                <RunningCodeSkeleton />
              ) : error ? (
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <div className="font-medium">Execution Error</div>
                    <pre className="whitespace-pre-wrap text-destructive/80">{error}</pre>
                  </div>
                </div>
              ) : output ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Execution Successful</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-foreground">{output}</pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted-foreground/20 mb-2">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-center">Run your code to see the output here...</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="evaluation" className="mt-2">
            <div className="relative bg-muted p-2 rounded-lg h-[600px] overflow-auto font-mono text-sm">
              {evaluation ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {evaluation.passed ? (
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Passed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-warning">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-medium">Needs Improvement</span>
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-semibold">
                      Score: <span className="text-primary">{evaluation.score}%</span>
                    </div>
                  </div>

                  {evaluation.explanation && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-primary">Detailed Analysis</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{evaluation.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted-foreground/20 mb-2">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-center">Submit your code to see the evaluation here...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default OutputPanel

