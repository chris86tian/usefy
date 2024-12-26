import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import CustomModal from "@/components/CustomModal";
import { ChapterFormData, chapterSchema } from "@/lib/schemas";
import { addChapter, closeChapterModal, editChapter } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { Sparkles } from "lucide-react";

const ChapterModal = () => {
  const dispatch = useAppDispatch();
  const { isChapterModalOpen, selectedSectionIndex, selectedChapterIndex, sections } =
    useAppSelector((state) => state.global.courseEditor);

  const chapter: Chapter | undefined =
    selectedSectionIndex !== null && selectedChapterIndex !== null
      ? sections[selectedSectionIndex].chapters[selectedChapterIndex]
      : undefined;

  const [videoType, setVideoType] = useState<"file" | "link">("file");
  const [isGenerating, setIsGenerating] = useState(false);

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      video: "",
    },
  });

  const videoUrl = methods.watch("video");

  const handleAutoGenerate = async () => {
    const videoUrl = methods.getValues("video");
    
    if (!videoUrl) {
      toast.error('Please enter a YouTube video URL first');
      return;
    }
  
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-chapter-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }
  
      methods.setValue('title', data.title);
      methods.setValue('content', data.content);
      
      toast.success('Content generated successfully');
    } catch (error) {
      console.error('Error in auto-generation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to auto-generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
      });
      setVideoType(typeof chapter.video === 'string' && chapter.video.startsWith("http") ? "link" : "file");
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
      });
    }
  }, [chapter, methods]);

  const onClose = () => {
    dispatch(closeChapterModal());
  };

  const onSubmit = (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return;

    const newChapter: Chapter = {
      chapterId: chapter?.chapterId || uuidv4(),
      title: data.title,
      content: data.content,
      type: data.video ? "Video" : "Text",
      video: data.video,
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
              <div className="flex items-center gap-2 justify-center">
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
                {videoType === "link" && (
                  <Button
                    type="button"
                    onClick={handleAutoGenerate}
                    disabled={isGenerating || !videoUrl}
                    className="bg-primary-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? "Generating..." : "Auto-Fill"}
                  </Button>
                )}
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

            <div className="chapter-modal__actions">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-700">
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
