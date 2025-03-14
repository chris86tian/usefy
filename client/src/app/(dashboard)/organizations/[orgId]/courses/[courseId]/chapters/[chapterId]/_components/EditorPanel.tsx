"use client"

import { useCodeEditorStore } from "@/hooks/useCodeEditorStore"
import { useEffect, useState } from "react"
import { defineMonacoThemes, LANGUAGE_CONFIG } from "../_constants"
import { Editor } from "@monaco-editor/react"
import Image from "next/image"
import { RotateCcwIcon, TypeIcon } from "lucide-react"
import { useClerk } from "@clerk/nextjs"
import { EditorPanelSkeleton } from "./EditorPanelSkeleton"
import useMounted from "@/hooks/useMounted"
import ShareSnippetDialog from "./ShareSnippetDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface EditorPanelProps {
  assignment: Assignment
}

function EditorPanel({ assignment }: EditorPanelProps) {
  const clerk = useClerk()
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const { language, theme, fontSize, editor, setFontSize, setEditor } = useCodeEditorStore()

  const mounted = useMounted()

  useEffect(() => {
    const savedCode = localStorage.getItem(`editor-code-${language}`)
    const newCode = assignment.starterCode || savedCode || LANGUAGE_CONFIG[language.toLowerCase()].defaultCode
    if (editor) editor.setValue(newCode)
  }, [language, editor, assignment.starterCode])

  useEffect(() => {
    const savedFontSize = localStorage.getItem("editor-font-size")
    if (savedFontSize) setFontSize(Number.parseInt(savedFontSize))
  }, [setFontSize])

  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language.toLowerCase()].defaultCode
    if (editor) editor.setValue(defaultCode)
    localStorage.removeItem(`editor-code-${language}`)
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value) localStorage.setItem(`editor-code-${language}`, value)
  }

  const handleFontSizeChange = (newSize: number[]) => {
    const size = newSize[0]
    setFontSize(size)
    localStorage.setItem("editor-font-size", size.toString())
  }

  if (!mounted) return null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={"/" + language + ".png"} alt="Logo" width={24} height={24} />
            <div>
              <CardTitle className="text-sm">Code Editor</CardTitle>
              <p className="text-xs text-muted-foreground">Write and execute your code</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-lg">
              <TypeIcon className="size-4 text-muted-foreground" />
              <div className="flex items-center gap-3">
                <Slider
                  min={12}
                  max={24}
                  step={1}
                  value={[fontSize]}
                  onValueChange={handleFontSizeChange}
                  className="w-20"
                />
                <span className="text-sm font-medium text-muted-foreground min-w-[2rem] text-center">{fontSize}</span>
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Reset to default code">
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative rounded-b-lg overflow-hidden">
          {clerk.loaded ? (
            <Editor
              height="600px"
              language={LANGUAGE_CONFIG[language.toLowerCase()].monacoLanguage}
              onChange={handleEditorChange}
              theme={theme}
              beforeMount={defineMonacoThemes}
              onMount={(editor) => setEditor(editor)}
              options={{
                minimap: { enabled: false },
                fontSize,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: "selection",
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                fontLigatures: true,
                cursorBlinking: "smooth",
                smoothScrolling: true,
                contextmenu: true,
                renderLineHighlight: "all",
                lineHeight: 1.6,
                letterSpacing: 0.5,
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          ) : (
            <EditorPanelSkeleton />
          )}
        </div>
      </CardContent>
      {isShareDialogOpen && <ShareSnippetDialog onClose={() => setIsShareDialogOpen(false)} />}
    </Card>
  )
}

export default EditorPanel

