"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Link, File, ImageIcon, Plus, X, Wand2, Code2 } from "lucide-react"
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from "@/state/api"
import { v4 as uuidv4 } from "uuid"
import { ResourceList } from "../../_components/ResourceList"
import { useGetUploadImageUrlMutation } from "@/state/api"
import { uploadAssignmentFile } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AssignmentModalProps {
  chapter: Chapter
  sectionId: string
  courseId: string
  assignment?: Assignment
  mode?: "create" | "edit"
  onAssignmentChange?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  refetch: () => void
}

const AssignmentModal = ({
  chapter,
  sectionId,
  courseId,
  assignment,
  mode = "create",
  onAssignmentChange,
  open,
  onOpenChange,
  refetch,
}: AssignmentModalProps) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [resources, setResources] = useState<Resource[]>([])
  const [hints, setHints] = useState<string[]>([])
  const [newHint, setNewHint] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedResourceType, setSelectedResourceType] = useState<"link" | "image" | "file">("link")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [isCoding, setIsCoding] = useState(false)
  const [starterCode, setStarterCode] = useState("")

  const [createAssignment] = useCreateAssignmentMutation()
  const [updateAssignment] = useUpdateAssignmentMutation()
  const [getUploadImageUrl] = useGetUploadImageUrlMutation()

  useEffect(() => {
    if (assignment && mode === "edit") {
      setTitle(assignment.title)
      setDescription(assignment.description)
      setResources(assignment.resources?.map((r) => ({ ...r, type: r.url ? "file" : "link" })) || [])
      setHints(assignment.hints || [])
      setIsCoding(assignment.isCoding || false)
      setStarterCode(assignment.starterCode || "")
    }
  }, [assignment, mode])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    try {
      const assignmentData = {
        assignmentId: mode === "create" ? uuidv4() : assignment!.assignmentId,
        title,
        isCoding,
        description,
        resources,
        hints,
        starterCode: isCoding ? starterCode : "",
        submissions: mode === "create" ? [] : assignment!.submissions,
      }
  
      let result;
      if (mode === "create") {
        result = await createAssignment({
          chapterId: chapter.chapterId,
          courseId,
          sectionId,
          assignment: assignmentData,
        }).unwrap();
      } else if (mode === "edit" && assignment) {
        result = await updateAssignment({
          chapterId: chapter.chapterId,
          courseId,
          sectionId,
          assignmentId: assignment.assignmentId,
          assignment: assignmentData,
        }).unwrap();
      }
  
      if (onAssignmentChange) {
        onAssignmentChange();
      }
      
      refetch();
      
      onOpenChange(false);

      if (mode === "create") resetForm();
    } catch (error) {
      console.error(`Failed to ${mode} assignment:`, error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setResources([])
    setHints([])
    setStarterCode("")
    setUploadProgress({})
  }

  const handleAddHint = () => {
    if (newHint.trim()) {
      setHints([...hints, newHint.trim()])
      setNewHint("")
    }
  }

  const handleRemoveHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index))
  }

  const handleAddResource = async (type: Resource["type"], file?: File) => {
    if (!file && type === "link") {
      const newResource: Resource = {
        id: uuidv4(),
        title: "",
        url: "",
        type,
      }
      setResources([...resources, newResource])
      return
    }

    if (file) {
      const resourceId = uuidv4()
      setIsUploading(true)
      setUploadProgress((prev) => ({ ...prev, [resourceId]: 0 }))

      try {
        const newResource: Resource = {
          id: resourceId,
          title: file.name,
          url: "",
          type,
        }

        setResources((prev) => [...prev, newResource])

        const fileUrl = await uploadAssignmentFile(file, getUploadImageUrl, (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [resourceId]: Math.round(progress * 100),
          }))
        })

        setResources((prev) => prev.map((r) => (r.id === resourceId ? { ...r, fileUrl, url: fileUrl } : r)))
      } catch (error) {
        console.error("Failed to upload file:", error)
        setResources((prev) => prev.filter((r) => r.id !== resourceId))
      } finally {
        setIsUploading(false)
        setUploadProgress((prev) => {
          const newProgress = { ...prev }
          delete newProgress[resourceId]
          return newProgress
        })
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleAddResource(selectedResourceType, file)
    }
  }

  const renderResourceButton = () => {
    const icons = {
      link: <Link className="mr-2 h-4 w-4" />,
      image: <ImageIcon className="mr-2 h-4 w-4" />,
      file: <File className="mr-2 h-4 w-4" />,
      code: <Code2 className="mr-2 h-4 w-4" />,
    }

    if (selectedResourceType === "link") {
      return (
        <Button type="button" variant="outline" onClick={() => handleAddResource("link")} size="sm">
          {icons.link}
          Add Link
        </Button>
      )
    }

    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById("file-upload")?.click()}
        disabled={isUploading}
        size="sm"
      >
        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icons[selectedResourceType]}
        {isUploading
          ? "Uploading..."
          : `Add ${selectedResourceType === "image" ? "Image" : selectedResourceType === "file" ? "File" : "Code"}`}
      </Button>
    )
  }

  const generateAssignment = async () => {
    setIsGeneratingAI(true)
    try {
      const response = await fetch("/api/generate-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentTitle: chapter.title,
          assignmentDescription: chapter.content,
        }),
      })

      const generatedAssignment = await response.json()

      setTitle(generatedAssignment.title)
      setDescription(generatedAssignment.description)
      setHints(generatedAssignment.hints || [])
    } catch (error) {
      console.error("Failed to generate assignment:", error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const insertCodeBlock = () => {
    const textArea = document.getElementById("description")
    const start = (textArea as HTMLTextAreaElement)?.selectionStart
    const end = (textArea as HTMLTextAreaElement)?.selectionEnd
    const text = description
    const before = text.substring(0, start)
    const selection = text.substring(start, end)
    const after = text.substring(end)

    const codeBlock = `\n\`\`\`\n${selection || "Enter your code here"}\n\`\`\`\n`
    setDescription(before + codeBlock + after)
  }

  const renderMarkdown = (text: string) => {
    return text.split("```").map((block, index) => {
      if (index % 2 === 1) {
        return (
          <pre key={index} className="bg-muted p-4 rounded-md">
            <code>{block.trim()}</code>
          </pre>
        )
      }
      return (
        <p key={index} className="whitespace-pre-wrap">
          {block}
        </p>
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Assignment" : "Edit Assignment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                Assignment Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment title"
                required
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={insertCodeBlock}
                  className="h-7 px-2 text-xs"
                >
                  <Code2 className="h-3 w-3 mr-1" />
                  Add Code
                </Button>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "edit" | "preview")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-0">
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter assignment description. Use \`\`\` to create code blocks."
                    className="min-h-[8rem] resize-y"
                    required
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-0">
                  <Card>
                    <CardContent className="p-4 min-h-[8rem]">
                      {description ? (
                        renderMarkdown(description)
                      ) : (
                        <p className="text-muted-foreground">No content to preview</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Label className="text-sm font-medium">Hints</Label>
              <div className="space-y-2 mt-1">
                {hints.map((hint, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={hint}
                      onChange={(e) => {
                        const newHints = [...hints]
                        newHints[index] = e.target.value
                        setHints(newHints)
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveHint(index)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    placeholder="Add a new hint..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddHint()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAddHint}
                    disabled={!newHint.trim()}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Resources</Label>
              <ResourceList
                resources={resources}
                uploadProgress={uploadProgress}
                onRemove={(id) => {
                  setResources(resources.filter((r) => r.id !== id))
                  setUploadProgress((prev) => {
                    const newProgress = { ...prev }
                    delete newProgress[id]
                    return newProgress
                  })
                }}
                onUpdate={(id, field, value) => {
                  setResources(resources.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
                }}
              />

              <div className="flex items-center space-x-2 mt-2">
                <Select
                  value={selectedResourceType}
                  onValueChange={(value: "link" | "image" | "file") => setSelectedResourceType(value)}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
                {renderResourceButton()}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept={selectedResourceType === "image" ? "image/*" : undefined}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isCoding"
                checked={isCoding}
                onChange={() => setIsCoding(!isCoding)}
                className="mr-2"
              />
              <Label htmlFor="isCoding" className="text-sm font-medium">
                Create as Coding Assignment
              </Label>
            </div>

            {isCoding && (
              <div className="mt-4">
                <Label htmlFor="starterCode" className="text-sm font-medium">
                  Starter Code
                </Label>
                <Tabs defaultValue="edit" className="w-full mt-1">
                  <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="mt-0">
                    <Textarea
                      id="starterCode"
                      value={starterCode}
                      onChange={(e) => setStarterCode(e.target.value)}
                      placeholder="Enter starter code for students..."
                      className="font-mono min-h-[12rem] resize-y"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-0">
                    <Card>
                      <CardContent className="p-4 min-h-[12rem]">
                        {starterCode ? (
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                            <code className="font-mono text-sm">{starterCode}</code>
                          </pre>
                        ) : (
                          <p className="text-muted-foreground">No starter code to preview</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              size="sm"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={generateAssignment}
              disabled={isGeneratingAI || isSubmitting}
              variant="outline"
              size="sm"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3 mr-1" />
                  Generate
                </>
              )}
            </Button>

            <Button type="submit" disabled={isSubmitting || isUploading} size="sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Assignment"
              ) : (
                "Update Assignment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AssignmentModal

