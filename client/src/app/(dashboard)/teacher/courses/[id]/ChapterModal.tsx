import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { X, Trash2, Brain } from "lucide-react";
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

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      video: "",
    },
  });

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
      });
      setVideoType(typeof chapter.video === 'string' && chapter.video.startsWith("http") ? "link" : "file");
      setQuestions(chapter.quiz?.questions || []);
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
      });
      setQuestions([]);
    }
  }, [chapter, methods]);

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
    console.log(updatedQuestions);
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

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <FormLabel className="text-customgreys-dirtyGrey text-sm">
                  Quiz Questions
                </FormLabel>
                <Button
                  type="button"
                  onClick={addQuestion}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Brain className="w-4 h-4" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, questionIndex) => (
                <div key={questionIndex} className="mb-6 p-4 rounded-lg bg-customgreys-darkGrey">
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-customgreys-dirtyGrey text-sm">
                      Question {questionIndex + 1}
                    </FormLabel>
                    <Button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Input
                    value={question.question}
                    onChange={(e) =>
                      updateQuestion(questionIndex, "question", e.target.value)
                    }
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
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="chapter-modal__actions">
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