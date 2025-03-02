"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { X, Trash2, Brain, BookOpen, ChevronUp, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { CustomFormField } from "@/components/CustomFormField"
import CustomModal from "@/components/CustomModal"
import { type ChapterFormData, chapterSchema } from "@/lib/schemas"
import { addChapter, closeChapterModal, editChapter } from "@/state"
import { useAppDispatch, useAppSelector } from "@/state/redux"

const ChapterModal = () => {
  const dispatch = useAppDispatch()
  const { isChapterModalOpen, selectedSectionIndex, selectedChapterIndex, sections } = useAppSelector(
    (state) => state.global.courseEditor,
  )

  const chapter: Chapter | undefined =
    selectedSectionIndex !== null && selectedChapterIndex !== null
      ? sections[selectedSectionIndex].chapters[selectedChapterIndex]
      : undefined

  const [videoType, setVideoType] = useState<"file" | "link">("file")
  const [questions, setQuestions] = useState<Question[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [isQuizSectionOpen, setIsQuizSectionOpen] = useState(true)
  const [isAssignmentSectionOpen, setIsAssignmentSectionOpen] = useState(true)
  const [expandedAssignments, setExpandedAssignments] = useState<string[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([])

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      video: "",
    },
  })

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments((prev) =>
      prev.includes(assignmentId) ? prev.filter((id) => id !== assignmentId) : [...prev, assignmentId],
    )
  }

  const toggleQuestion = (questionIndex: number) => {
    setExpandedQuestions((prev) =>
      prev.includes(questionIndex) ? prev.filter((idx) => idx !== questionIndex) : [...prev, questionIndex],
    )
  }

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
      })
      setVideoType(typeof chapter.video === "string" && chapter.video.startsWith("http") ? "link" : "file")
      setQuestions(chapter.quiz?.questions || [])
      setAssignments(chapter.assignments || [])
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
      })
      setQuestions([])
      setAssignments([])
    }
  }, [chapter, methods])

  // Quiz operations
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionId: uuidv4(),
        question: "",
        difficulty: "easy",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: string | number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    }
    setQuestions(updatedQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions]
      const updatedOptions = [...updatedQuestions[questionIndex].options]
      updatedOptions[optionIndex] = value

      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options: updatedOptions,
      }

      return updatedQuestions
    })
  }

  // Assignments operations
  const addAssignment = () => {
    setAssignments([
      ...assignments,
      {
        assignmentId: uuidv4(),
        title: "",
        description: "",
        submissions: [],
        hints: [""],
      },
    ])
  }

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index))
  }

  const updateAssignment = (index: number, field: keyof Assignment, value: string | string[]) => {
    const updatedAssignments = [...assignments]
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      [field]: value,
    }
    setAssignments(updatedAssignments)
  }

  const addHint = (assignmentIndex: number) => {
    setAssignments((prevAssignments) => {
      const updatedAssignments = [...prevAssignments]
      const currentAssignment = { ...updatedAssignments[assignmentIndex] }

      if (!currentAssignment.hints) {
        currentAssignment.hints = []
      }

      currentAssignment.hints = [...currentAssignment.hints, ""]
      updatedAssignments[assignmentIndex] = currentAssignment

      return updatedAssignments
    })
  }

  const removeHint = (assignmentIndex: number, hintIndex: number) => {
    setAssignments((prevAssignments) => {
      const updatedAssignments = [...prevAssignments]
      const currentAssignment = { ...updatedAssignments[assignmentIndex] }

      if (currentAssignment.hints) {
        currentAssignment.hints = currentAssignment.hints.filter((_, i) => i !== hintIndex)
        updatedAssignments[assignmentIndex] = currentAssignment
      }

      return updatedAssignments
    })
  }

  const updateHint = (assignmentIndex: number, hintIndex: number, value: string) => {
    setAssignments((prevAssignments) => {
      const updatedAssignments = [...prevAssignments]
      const currentAssignment = { ...updatedAssignments[assignmentIndex] }

      if (currentAssignment.hints) {
        const updatedHints = [...currentAssignment.hints]
        updatedHints[hintIndex] = value
        currentAssignment.hints = updatedHints
        updatedAssignments[assignmentIndex] = currentAssignment
      }

      return updatedAssignments
    })
  }

  const onClose = () => {
    dispatch(closeChapterModal())
  }

  const onSubmit = (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return

    const newChapter: Chapter = {
      chapterId: chapter?.chapterId || uuidv4(),
      title: data.title,
      content: data.content,
      type: questions.length > 0 ? "Quiz" : data.video ? "Video" : "Text",
      video: data.video,
      quiz:
        questions.length > 0
          ? {
              quizId: chapter?.quiz?.quizId || uuidv4(),
              questions,
            }
          : undefined,
      assignments: assignments,
    }

    if (selectedChapterIndex === null) {
      dispatch(
        addChapter({
          sectionIndex: selectedSectionIndex,
          chapter: newChapter,
        }),
      )
    } else {
      dispatch(
        editChapter({
          sectionIndex: selectedSectionIndex,
          chapterIndex: selectedChapterIndex,
          chapter: newChapter,
        }),
      )
    }

    toast.success(`Chapter updated successfully but you need to save the course to apply the changes`)
    onClose()
  }

  return (
    <CustomModal isOpen={isChapterModalOpen} onClose={onClose}>
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add/Edit Chapter</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <CustomFormField name="title" label="Chapter Title" placeholder="Write chapter title here" />

            <CustomFormField
              name="content"
              label="Chapter Content"
              type="textarea"
              placeholder="Write chapter content here"
            />

            <div className="mb-4">
              <FormLabel className="text-gray-600 dark:text-gray-300 text-sm">Select Video Type</FormLabel>
              <div className="flex items-center gap-4 justify-start mt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="videoType"
                    value="file"
                    checked={videoType === "file"}
                    onChange={() => setVideoType("file")}
                    className="mr-2 text-blue-600 dark:text-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-200">File Upload</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="videoType"
                    value="link"
                    checked={videoType === "link"}
                    onChange={() => setVideoType("link")}
                    className="mr-2 text-blue-600 dark:text-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-200">YouTube/Vimeo Link</span>
                </label>
              </div>
            </div>

            {videoType === "file" ? (
              <FormField
                control={methods.control}
                name="video"
                render={({ field: { onChange } }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600 dark:text-gray-300 text-sm">Upload Video</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) onChange(file)
                        }}
                        className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 py-2 cursor-pointer dark:text-gray-200"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 dark:text-red-400" />
                  </FormItem>
                )}
              />
            ) : (
              <CustomFormField name="video" label="Video Link" placeholder="Paste YouTube/Vimeo link here" />
            )}

            {/* Quiz Section */}
            <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-t-lg"
                onClick={() => setIsQuizSectionOpen(!isQuizSectionOpen)}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <FormLabel className="text-gray-600 dark:text-gray-300 text-sm mb-0">Quiz Questions ({questions.length})</FormLabel>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      addQuestion()
                    }}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  >
                    Add Question
                  </Button>
                  {isQuizSectionOpen ? <ChevronUp className="text-gray-600 dark:text-gray-300" /> : <ChevronDown className="text-gray-600 dark:text-gray-300" />}
                </div>
              </div>

              {isQuizSectionOpen && (
                <div className="p-4 dark:bg-gray-800">
                  {questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-t-lg"
                        onClick={() => toggleQuestion(questionIndex)}
                      >
                        <span className="font-medium text-gray-700 dark:text-gray-200">Question {questionIndex + 1}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeQuestion(questionIndex)
                            }}
                            variant="destructive"
                            size="sm"
                            className="dark:bg-red-600 dark:hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {expandedQuestions.includes(questionIndex) ? <ChevronUp className="text-gray-600 dark:text-gray-300" /> : <ChevronDown className="text-gray-600 dark:text-gray-300" />}
                        </div>
                      </div>

                      {expandedQuestions.includes(questionIndex) && (
                        <div className="p-4 bg-white dark:bg-gray-800">
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                            placeholder="Enter your question"
                            className="mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                          />

                          <div className="my-2">
                            <FormLabel className="text-gray-600 dark:text-gray-300 text-sm">Difficulty</FormLabel>
                            <select
                              value={question.difficulty}
                              onChange={(e) => updateQuestion(questionIndex, "difficulty", e.target.value)}
                              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>

                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2 mb-2">
                              <input
                                type="radio"
                                name={`correct-answer-${questionIndex}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateQuestion(questionIndex, "correctAnswer", optionIndex)}
                                className="text-blue-600 dark:text-blue-500"
                              />
                              <Input
                                value={option}
                                onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignments Section */}
            <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-t-lg"
                onClick={() => setIsAssignmentSectionOpen(!isAssignmentSectionOpen)}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <FormLabel className="text-gray-600 dark:text-gray-300 text-sm mb-0">Assignments ({assignments.length})</FormLabel>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      addAssignment()
                    }}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  >
                    Add Assignment
                  </Button>
                  {isAssignmentSectionOpen ? <ChevronUp className="text-gray-600 dark:text-gray-300" /> : <ChevronDown className="text-gray-600 dark:text-gray-300" />}
                </div>
              </div>

              {isAssignmentSectionOpen && (
                <div className="p-4 dark:bg-gray-800">
                  {assignments.map((assignment, assignmentIndex) => (
                    <div key={assignment.assignmentId} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-t-lg"
                        onClick={() => toggleAssignment(assignment.assignmentId)}
                      >
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {assignment.title || `Assignment ${assignmentIndex + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeAssignment(assignmentIndex)
                            }}
                            variant="destructive"
                            size="sm"
                            className="dark:bg-red-600 dark:hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {expandedAssignments.includes(assignment.assignmentId) ? <ChevronUp className="text-gray-600 dark:text-gray-300" /> : <ChevronDown className="text-gray-600 dark:text-gray-300" />}
                        </div>
                      </div>

                      {expandedAssignments.includes(assignment.assignmentId) && (
                        <div className="p-4 bg-white dark:bg-gray-800">
                          <Input
                            value={assignment.title}
                            onChange={(e) => updateAssignment(assignmentIndex, "title", e.target.value)}
                            placeholder="Assignment Title"
                            className="mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                          />
                          <textarea
                            value={assignment.description}
                            onChange={(e) => updateAssignment(assignmentIndex, "description", e.target.value)}
                            placeholder="Assignment Description"
                            className="w-full min-h-[100px] mb-4 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200 dark:placeholder-gray-400"
                          />

                          {/* Hints Section */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <FormLabel className="text-gray-600 dark:text-gray-300 text-sm">Hints</FormLabel>
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addHint(assignmentIndex)
                                }}
                                size="sm"
                                variant="outline"
                                className="border-gray-300 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                              >
                                Add Hint
                              </Button>
                            </div>

                            {assignment.hints?.map((hint, hintIndex) => (
                              <div key={hintIndex} className="flex items-center gap-2 mb-2">
                                <Input
                                  value={hint}
                                  onChange={(e) => updateHint(assignmentIndex, hintIndex, e.target.value)}
                                  placeholder={`Hint ${hintIndex + 1}`}
                                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                                />
                                <Button
                                  type="button"
                                  onClick={() => removeHint(assignmentIndex, hintIndex)}
                                  variant="destructive"
                                  size="sm"
                                  className="dark:bg-red-600 dark:hover:bg-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  )
}

export default ChapterModal

