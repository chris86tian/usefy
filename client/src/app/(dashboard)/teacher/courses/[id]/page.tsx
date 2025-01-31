"use client";

import { CustomFormField } from "@/components/CustomFormField";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  centsToDollars,
  dollarsToCents,
  uploadAllVideos,
  uploadThumbnail,
} from "@/lib/utils";
import {
  openSectionModal,
  setSections,
} from "@/state";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useGetUploadVideoUrlMutation,
  useGetUploadImageUrlMutation,
} from "@/state/api";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DroppableComponent from "./Droppable";
import ChapterModal from "./ChapterModal";
import SectionModal from "./SectionModal";
import { toast } from "sonner";
import { courseSchema } from "@/lib/schemas";
import Image from "next/image";
import YouTubeDialog from "@/components/YouTubeDialog";
import { v4 as uuid} from "uuid";

const CourseEditor = () => {
  const params = useParams();
  const id = params.id as string;

  const { data: course, isLoading, refetch } = useGetCourseQuery(id);
  const [updateCourse] = useUpdateCourseMutation();
  const [getUploadVideoUrl] = useGetUploadVideoUrlMutation();
  const [getUploadImageUrl] = useGetUploadImageUrlMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleURLSubmit = async (videoUrl: string) => {
    setIsDialogOpen(false);
    setIsGenerating(true);
  
    try {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });
  
      const data = await response.json();
  
      if (data.error) {
        toast.error(data.error);
        return;
      }
  
      const { sections: newSections, courseTitle, courseDescription } = data;
  
      // Update course details if provided
      if (courseTitle) methods.setValue("courseTitle", courseTitle);
      if (courseDescription) methods.setValue("courseDescription", courseDescription);
  
      // Merge new sections with existing sections
      const updatedSections = [...sections];
  
      newSections.forEach((newSection: Section) => {
        const existingSectionIndex = updatedSections.findIndex(
          (section) => section.sectionTitle === newSection.sectionTitle
        );
  
        if (existingSectionIndex !== -1) {
          // Merge chapters into the existing section
          const existingSection = updatedSections[existingSectionIndex];
          const mergedChapters = newSection.chapters.map((newChapter: Chapter) => {
            const existingChapter = existingSection.chapters.find(
              (chapter) => chapter.title === newChapter.title
            );
  
            return existingChapter
              ? {
                  ...existingChapter,
                  content: newChapter.content || existingChapter.content,
                  video: newChapter.video || existingChapter.video,
                  quiz: newChapter.quiz || existingChapter.quiz,
                }
              : {
                  ...newChapter,
                  chapterId: newChapter.chapterId || uuid(),
                };
          });
  
          updatedSections[existingSectionIndex] = {
            ...existingSection,
            chapters: [...existingSection.chapters, ...mergedChapters],
          };
        } else {
          // Add a new section with unique IDs for sections and chapters
          updatedSections.push({
            ...newSection,
            sectionId: uuid(),
            chapters: newSection.chapters.map((chapter: Chapter) => ({
              ...chapter,
              chapterId: uuid(),
            })),
          });
        }
      });
  
      dispatch(setSections(updatedSections));
      toast.success("Sections and chapters generated successfully!");
    } catch (error) {
      console.error("Error generating course content:", error);
      toast.error("An error occurred while generating course content.");
    } finally {
      setIsGenerating(false);
    }
  };

  const dispatch = useAppDispatch();
  const { sections } = useAppSelector((state) => state.global.courseEditor);

  const methods = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: "",
      courseDescription: "",
      courseCategory: "",
      coursePrice: "0",
      courseStatus: false,
      courseImage: "",
    },
  });

  useEffect(() => {
    if (course) {
      methods.reset({
        courseTitle: course.title,
        courseDescription: course.description,
        courseCategory: course.category,
        coursePrice: centsToDollars(course.price),
        courseStatus: course.status === "Published",
        courseImage: course.image || "",
      });
      
      if (course.sections?.length) {
        dispatch(setSections(course.sections.map(section => ({
          ...section,
          chapters: section.chapters.map(chapter => ({
            ...chapter,
            assignments: chapter.assignments || [],
          }))
        }))));
      }
    }
  }, [course, methods]); // eslint-disable-line react-hooks/exhaustive-deps


  const createCourseFormData = (
    data: CourseFormData,
    sections: Section[],
    thumbnailUrl: string
  ): FormData => {
    const formData = new FormData();
    formData.append("title", data.courseTitle);
    formData.append("description", data.courseDescription);
    formData.append("category", data.courseCategory);
    formData.append("price", dollarsToCents(data.coursePrice).toString());
    formData.append("status", data.courseStatus ? "Published" : "Draft");
    formData.append("image", thumbnailUrl);
  
    const sectionsWithPreservedData = sections.map((section) => ({
      ...section,
      chapters: section.chapters.map(chapter => ({
        ...chapter,
        assignments: chapter.assignments?.map((assignment: { submissions: Submission[]; }) => ({
          ...assignment,
          submissions: assignment.submissions || [],
        })),
      })),
    }));
  
    formData.append("sections", JSON.stringify(sectionsWithPreservedData));
    return formData;
  };
  

  const onSubmit = async (data: CourseFormData) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const updatedSections = await uploadAllVideos(
        sections,
        id,
        getUploadVideoUrl,
        (currentProgress) => setProgress(currentProgress)
      );

      let thumbnailUrl = course?.image;
      if (image) {
        thumbnailUrl = await uploadThumbnail(id, getUploadImageUrl, image);
      }

      const formData = createCourseFormData(data, updatedSections, thumbnailUrl || "");

      await updateCourse({ courseId: id, formData }).unwrap();

      toast.success("Course updated successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to update course:", error);
      toast.error("An error occurred while updating the course." + error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-5 mb-5">
        <button
          className="flex items-center border border-customgreys-dirtyGrey rounded-lg p-2 gap-2 cursor-pointer hover:bg-customgreys-dirtyGrey hover:text-white-100 text-customgreys-dirtyGrey"
          onClick={() => 
            window.location.href = "/teacher/courses"
          }
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>
      </div>

      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Header
            title="Course Setup"
            subtitle="Complete all fields and save your course"
            rightElement={
              <div className="flex items-center space-x-4">
                <CustomFormField
                  name="courseStatus"
                  label={methods.watch("courseStatus") ? "Published" : "Draft"}
                  type="switch"
                  className="flex items-center space-x-2"
                  labelClassName={`text-sm font-medium ${
                    methods.watch("courseStatus")
                      ? "text-green-500"
                      : "text-yellow-500"
                  }`}
                  inputClassName="data-[state=checked]:bg-green-500"
                />
                <Button
                  type="submit"
                  className="bg-primary-700 hover:bg-primary-600"
                >
                  Save
                </Button>
              </div>
            }
          />

          <div className="flex justify-between md:flex-row flex-col gap-10 mt-5 font-dm-sans">
            <div className="basis-1/2">
              <div className="space-y-4">
                {course?.image && (
                  <Image
                    src={course.image}
                    alt="Thumbnail"
                    width={100}
                    height={100}
                    className="rounded-lg object-cover"
                  />
                )}
                <CustomFormField
                  name="courseTitle"
                  label="Course Title"
                  type="text"
                  placeholder="Write course title here"
                  className="border-none"
                  initialValue={course?.title}
                />

                <CustomFormField
                  name="courseDescription"
                  label="Course Description"
                  type="textarea"
                  placeholder="Write course description here"
                  initialValue={course?.description}
                />

                <CustomFormField
                  name="courseCategory"
                  label="Course Category"
                  type="select"
                  placeholder="Select category here"
                  options={[
                    { value: "technology", label: "Technology" },
                    { value: "science", label: "Science" },
                    { value: "mathematics", label: "Mathematics" },
                    { value: "Artificial Intelligence", label: "Artificial Intelligence" },
                  ]}
                  initialValue={course?.category}
                />

                <CustomFormField
                  name="coursePrice"
                  label="Course Price"
                  type="number"
                  placeholder="0"
                  initialValue={course?.price}
                />

                <div className="space-y-2 flex flex-between">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-customgreys-dirtyGrey mb-2">
                      Upload Thumbnail
                    </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-customgreys-darkGrey mt-4 md:mt-0 p-4 rounded-lg basis-1/2">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-secondary-foreground">
                  Sections
                </h2>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(openSectionModal({ sectionIndex: null }))}
                    className="border-none text-primary-700 group"
                    disabled={isGenerating}
                  >
                    <Plus className="h-4 w-4 text-primary-700 group-hover:white-100" />
                    <span className="text-primary-700 group-hover:white-100">
                      Add Section
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDialogOpen(true)}
                    className="border-none text-primary-700 group"
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-4 w-4 text-primary-700 group-hover:white-100" />
                    <span className="text-primary-700 group-hover:white-100">
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </span>
                  </Button>
                  <YouTubeDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={handleURLSubmit}
                  />
                </div>
              </div>

              {isLoading ? (
                <p>Loading course content...</p>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin"
                      aria-label="Generating content"
                    />
                    <p className="text-secondary-foreground">
                      Generating course content from video...
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments as we analyze the video content.
                  </p>
                </div>
              ) : sections.length > 0 ? (
                <DroppableComponent />
              ) : (
                <p>No sections available</p>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="flex flex-col items-center mt-4 space-y-2">
              <div
                className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
                aria-label="Loading"
              />
              <p className="text-secondary-foreground">
                Uploading videos... {progress}% complete
              </p>
            </div>
          )}
        </form>
      </Form>

      <ChapterModal />
      <SectionModal />
    </div>
  );
};

export default CourseEditor;
