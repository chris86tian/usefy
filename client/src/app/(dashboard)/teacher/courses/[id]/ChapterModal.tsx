import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { X, Trash2, Brain, BookOpen, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import CustomModal from "@/components/CustomModal";
import { ChapterFormData, chapterSchema } from "@/lib/schemas";
import { addChapter, closeChapterModal, editChapter } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";

const ChapterModal = () => {
  const dispatch = useAppDispatch();
  const { isChapterModalOpen, selectedSectionIndex, selectedChapterIndex, sections } =
    useAppSelector((state) => state.global.courseEditor);

  const chapter: Chapter | undefined =
    selectedSectionIndex !== null && selectedChapterIndex !== null
      ? sections[selectedSectionIndex].chapters[selectedChapterIndex]
      : undefined;

  const [videoType, setVideoType] = useState<"file" | "link">("file");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [isQuizSectionOpen, setIsQuizSectionOpen] = useState(true);
  const [isAssignmentSectionOpen, setIsAssignmentSectionOpen] = useState(true);
  const [expandedAssignments, setExpandedAssignments] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      video: "",
    },
  });

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const toggleQuestion = (questionIndex: number) => {
    setExpandedQuestions(prev => 
      prev.includes(questionIndex)
        ? prev.filter(idx => idx !== questionIndex)
        : [...prev, questionIndex]
    );
  };


  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
      });
      setVideoType(typeof chapter.video === 'string' && chapter.video.startsWith("http") ? "link" : "file");
      setQuestions(chapter.quiz?.questions || []);
      setAssignments(chapter.assignments || []);
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
      });
      setQuestions([]);
      setAssignments([]);
    }
  }, [chapter, methods]);

  // Quiz operations
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        difficulty: "easy",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string | number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      const updatedOptions = [...updatedQuestions[questionIndex].options];
      updatedOptions[optionIndex] = value;
  
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options: updatedOptions,
      };
  
      return updatedQuestions;
    });
  };  

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
    ]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: keyof Assignment, value: string) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      [field]: value,
    };
    setAssignments(updatedAssignments);
  };

  const addHint = (assignmentIndex: number) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[assignmentIndex].hints?.push("");
    setAssignments(updatedAssignments);
  };

  const removeHint = (assignmentIndex: number, hintIndex: number) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[assignmentIndex].hints = updatedAssignments[assignmentIndex].hints?.filter(
      (_, i) => i !== hintIndex
    );
    setAssignments(updatedAssignments);
  };

  const updateHint = (assignmentIndex: number, hintIndex: number, value: string) => {
    const updatedAssignments = [...assignments];
    if (updatedAssignments[assignmentIndex].hints) {
      updatedAssignments[assignmentIndex].hints[hintIndex] = value;
    }
    setAssignments(updatedAssignments);
  };

  const onClose = () => {
    dispatch(closeChapterModal());
  };

  const onSubmit = (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return;

    const newChapter: Chapter = {
      chapterId: chapter?.chapterId || uuidv4(),
      title: data.title,
      content: data.content,
      type: questions.length > 0 ? "Quiz" : (data.video ? "Video" : "Text"),
      video: data.video,
      quiz: questions.length > 0 ? { questions } : undefined,
      assignments: chapter?.assignments || [],
    };

    if (selectedChapterIndex === null) {
      dispatch(
        addChapter({
          sectionIndex: selectedSectionIndex,
          chapter: newChapter,
        })
      );
    } else {
      dispatch(
        editChapter({
          sectionIndex: selectedSectionIndex,
          chapterIndex: selectedChapterIndex,
          chapter: newChapter,
        })
      );
    }

    toast.success(
      `Chapter updated successfully but you need to save the course to apply the changes`
    );
    onClose();
  };

  return (
    <CustomModal isOpen={isChapterModalOpen} onClose={onClose}>
      <div className="chapter-modal">
        <div className="chapter-modal__header">
          <h2 className="chapter-modal__title">Add/Edit Chapter</h2>
          <button onClick={onClose} className="chapter-modal__close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Form {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="chapter-modal__form"
          >
            <CustomFormField
              name="title"
              label="Chapter Title"
              placeholder="Write chapter title here"
            />

            <CustomFormField
              name="content"
              label="Chapter Content"
              type="textarea"
              placeholder="Write chapter content here"
            />

            <div className="mb-4">
              <FormLabel className="text-customgreys-dirtyGrey text-sm">
                Select Video Type
              </FormLabel>
              <div className="flex items-center gap-2 justify-center mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="videoType"
                    value="file"
                    checked={videoType === "file"}
                    onChange={() => setVideoType("file")}
                    className="mr-2"
                  />
                  File Upload
                </label>
                <label className="flex items-center mx-2">
                  <input
                    type="radio"
                    name="videoType"
                    value="link"
                    checked={videoType === "link"}
                    onChange={() => setVideoType("link")}
                    className="mr-2"
                  />
                  YouTube/Vimeo Link
                </label>
              </div>
            </div>

            {videoType === "file" ? (
              <FormField
                control={methods.control}
                name="video"
                render={({ field: { onChange } }) => (
                  <FormItem>
                    <FormLabel className="text-customgreys-dirtyGrey text-sm">
                      Upload Video
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onChange(file);
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <CustomFormField
                name="video"
                label="Video Link"
                placeholder="Paste YouTube/Vimeo link here"
              />
            )}

<div className="mt-6 border rounded-lg">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer bg-customgreys-darkGrey rounded-t-lg"
                onClick={() => setIsQuizSectionOpen(!isQuizSectionOpen)}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  <FormLabel className="text-customgreys-dirtyGrey text-sm mb-0">
                    Quiz Questions ({questions.length})
                  </FormLabel>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addQuestion();
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Add Question
                  </Button>
                  {isQuizSectionOpen ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {isQuizSectionOpen && (
                <div className="p-4">
                  {questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="mb-4 border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer bg-zinc-800 rounded-t-lg"
                        onClick={() => toggleQuestion(questionIndex)}
                      >
                        <span className="font-medium">Question {questionIndex + 1}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQuestion(questionIndex);
                            }}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {expandedQuestions.includes(questionIndex) ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </div>

                      {expandedQuestions.includes(questionIndex) && (
                        <div className="p-4">
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                            placeholder="Enter your question"
                            className="mb-2"
                          />

                          <div className="my-2">
                            <FormLabel className="text-customgreys-dirtyGrey text-sm">
                              Difficulty
                            </FormLabel>
                            <select
                              value={question.difficulty}
                              onChange={(e) =>
                                updateQuestion(questionIndex, "difficulty", e.target.value)
                              }
                              className="w-full my-1 py-2 px-4 bg-zinc-800 text-white rounded-sm"
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
                                onChange={() =>
                                  updateQuestion(questionIndex, "correctAnswer", optionIndex)
                                }
                              />
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateOption(questionIndex, optionIndex, e.target.value)
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                className="flex-1"
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
            <div className="mt-6 border rounded-lg">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer bg-customgreys-darkGrey rounded-t-lg"
                onClick={() => setIsAssignmentSectionOpen(!isAssignmentSectionOpen)}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <FormLabel className="text-customgreys-dirtyGrey text-sm mb-0">
                    Assignments ({assignments.length})
                  </FormLabel>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addAssignment();
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Add Assignment
                  </Button>
                  {isAssignmentSectionOpen ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {isAssignmentSectionOpen && (
                <div className="p-4">
                  {assignments.map((assignment, assignmentIndex) => (
                    <div key={assignment.assignmentId} className="mb-4 border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer bg-zinc-800 rounded-t-lg"
                        onClick={() => toggleAssignment(assignment.assignmentId)}
                      >
                        <span className="font-medium">
                          {assignment.title || `Assignment ${assignmentIndex + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAssignment(assignmentIndex);
                            }}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {expandedAssignments.includes(assignment.assignmentId) ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </div>

                      {expandedAssignments.includes(assignment.assignmentId) && (
                        <div className="p-4">
                          <Input
                            value={assignment.title}
                            onChange={(e) => updateAssignment(assignmentIndex, "title", e.target.value)}
                            placeholder="Assignment Title"
                            className="mb-2"
                          />
                          <textarea
                            value={assignment.description}
                            onChange={(e) => updateAssignment(assignmentIndex, "description", e.target.value)}
                            placeholder="Assignment Description"
                            className="w-full min-h-[100px] mb-4 p-2 bg-zinc-800 text-white rounded-sm"
                          />

                          {/* Hints Section */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <FormLabel className="text-customgreys-dirtyGrey text-sm">
                                Hints
                              </FormLabel>
                              <Button
                                type="button"
                                onClick={() => addHint(assignmentIndex)}
                                size="sm"
                                variant="outline"
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
                                />
                                <Button
                                  type="button"
                                  onClick={() => removeHint(assignmentIndex, hintIndex)}
                                  variant="destructive"
                                  size="sm"
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

            <div className="chapter-modal__actions mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
};

export default ChapterModal;