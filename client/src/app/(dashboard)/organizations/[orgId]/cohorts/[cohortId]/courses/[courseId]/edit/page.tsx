"use client"

import { CustomFormField } from "@/components/CustomFormField"
import Header from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { 
  centsToDollars, 
  dollarsToCents, 
  extractVideoId, 
  convertTimestampToSeconds, 
  handleEnroll, 
  uploadAllVideos, 
  uploadThumbnail, 
  uploadAllFiles 
} from "@/lib/utils"
import { openSectionModal, setSections } from "@/state"
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useGetUploadVideoUrlMutation,
  useGetUploadImageUrlMutation,
  useAddCourseInstructorMutation,
  useRemoveCourseInstructorMutation,
  useGetCourseInstructorsQuery,
  useGetUploadFileUrlMutation,
  useInviteUserToCohortMutation,
  useCreateTransactionMutation
} from "@/state/api"
import { useAppDispatch, useAppSelector } from "@/state/redux"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CheckCircle, Plus, Sparkles } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import DroppableComponent from "../_components/Droppable"
import ChapterModal from "../_components/ChapterModal"
import SectionModal from "../_components/SectionModal"
import { toast } from "sonner"
import { courseSchema } from "@/lib/schemas"
import Image from "next/image"
import VimeoDialog from "@/components/VimeoDialog"
import { v4 as uuid } from "uuid"
import { useRouter } from "next/navigation"
import InstructorEmailInput from "./EmailInvite"
import { useUser } from "@clerk/nextjs"
import { useOrganization } from "@/context/OrganizationContext"
import { Spinner } from "@/components/ui/Spinner"
import NotFound from "@/components/NotFound"

const CourseEditor = () => {
  const { user } = useUser()
  const { currentOrg, isOrgLoading } = useOrganization()
  const { orgId, cohortId, courseId } = useParams() as { orgId: string; cohortId: string; courseId: string }

  const { data: course, isLoading, refetch } = useGetCourseQuery(courseId)
  const { data: instructors, refetch: refetchInstructors } = useGetCourseInstructorsQuery(courseId)

  const isInstructor = instructors?.some((instructor) => instructor.id === user?.id)
  const isAdmin = currentOrg?.admins?.some((admin) => admin.userId === user?.id)

  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation()
  const [getUploadVideoUrl] = useGetUploadVideoUrlMutation()
  const [getUploadImageUrl] = useGetUploadImageUrlMutation()
  const [getUploadFileUrl] = useGetUploadFileUrlMutation();
  const [inviteUserToCohort] = useInviteUserToCohortMutation()
  const [addCourseInstructor] = useAddCourseInstructorMutation()
  const [createTransaction] = useCreateTransactionMutation()
  const [removeCourseInstructor] = useRemoveCourseInstructorMutation()

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [image, setImage] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isInstructor && !isAdmin) {
      router.push(`/organizations/${orgId}/cohorts/${cohortId}`)
    }
  }, [isInstructor, isAdmin, router, orgId, cohortId])


  const handleURLSubmit = async (videoUrl: string, options: ProcessOptions) => {
    setIsDialogOpen(false)
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          videoSource: options.videoSource || "vimeo",
          generateQuizzes: options.generateQuizzes,
          generateAssignments: options.generateAssignments,
          codingAssignments: options.codingAssignments,
          language: options.language,
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        setIsGenerating(false)
        return
      }

      const { sections: newSections, courseTitle, courseDescription } = data
      
      console.log("Received course data:", { newSections, courseTitle, courseDescription })

      if (course?.title === "" || course?.title === "Untitled Course" || course?.title !== courseTitle) {
        methods.setValue("courseTitle", courseTitle)
        methods.setValue("courseDescription", courseDescription)
      }

      // Process the sections and add video URLs based on the source
      const processedSections = newSections.map((section: Section) => {
        // Process each section
        return {
          ...section,
          sectionId: section.sectionId || uuid(),
          chapters: section.chapters.map((chapter) => {
            // Process each chapter
            const videoId = extractVideoId(videoUrl, options.videoSource as "youtube" | "vimeo")
            let chapterVideoUrl = chapter.video || ""
            
            // If no video URL is provided, construct one based on the timestamp
            if (!chapterVideoUrl && videoId) {
              if (options.videoSource === "youtube") {
                // For YouTube, use timestamp in seconds
                const timestamp = chapter.timestamp ? 
                  convertTimestampToSeconds(chapter.timestamp) : 
                  0
                chapterVideoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`
              } else {
                // For Vimeo, use timestamp in the format #t=1h42m40s
                const timestampParts = chapter.timestamp ? chapter.timestamp.split(":") : ["0", "0", "0"]
                const hours = parseInt(timestampParts[0])
                const minutes = parseInt(timestampParts[1])
                const seconds = parseInt(timestampParts[2])
                
                // Format timestamp in Vimeo's preferred format
                let timeString = ""
                if (hours > 0) timeString += `${hours}h`
                if (minutes > 0) timeString += `${minutes}m`
                if (seconds > 0) timeString += `${seconds}s`
                
                // Use the fragment identifier format which works for direct video viewing
                chapterVideoUrl = `https://vimeo.com/${videoId}#t=${timeString}`
              }
            }
            
            return {
              ...chapter,
              chapterId: chapter.chapterId || uuid(),
              video: chapterVideoUrl,
              quiz: chapter.quiz
                ? {
                    quizId: chapter.quiz.quizId || uuid(),
                    questions:
                      chapter.quiz.questions?.map((question) => ({
                        ...question,
                        questionId: question.questionId || uuid(),
                      })) || [],
                  }
                : undefined,
              assignments:
                chapter.assignments?.map((assignment) => ({
                  ...assignment,
                  assignmentId: assignment.assignmentId || uuid(),
                  submissions: assignment.submissions || [],
                  isCoding: options.codingAssignments,
                  language: options.language,
                  starterCode: assignment.starterCode || `# Your ${options.language} code here`,
                })) || [],
            }
          }),
        }
      })

      const currentSections = [...sections]
      const updatedSections = [...currentSections, ...processedSections]
      dispatch(setSections(updatedSections))
      
      console.log("Processed sections:", processedSections)
      toast.success("Course content generated successfully")
    } catch (error) {
      console.error("Error generating course:", error)
      toast.error("Failed to generate course content")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddInstructor = async (email: string) => {
    try {
      await inviteUserToCohort({ organizationId: orgId, cohortId, email, role: "instructor" }).unwrap()
      const result = await addCourseInstructor({ courseId, email }).unwrap()
      handleEnroll(result.id, courseId, createTransaction)
      refetchInstructors()
    } catch (error) {
      console.error("Failed to add instructor:", error)
      throw error
    }
  }

  const handleRemoveInstructor = async (instructorId: string) => {
    try {
      await removeCourseInstructor({ courseId, userId: instructorId }).unwrap()
      refetchInstructors()
    } catch (error) {
      console.error("Failed to remove instructor:", error)
      throw error
    }
  }

  const dispatch = useAppDispatch()
  const { sections } = useAppSelector((state) => state.global.courseEditor)

  const methods = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: "Untitled Course",
      courseDescription: "",
      coursePrice: "0",
      courseStatus: false,
      courseImage: "",
    },
  })

  useEffect(() => {
    if (course) {
      methods.reset({
        courseTitle: course.title,
        courseDescription: course.description,
        coursePrice: centsToDollars(course.price),
        courseStatus: course.status === "Published",
        courseImage: course.image || "",
      })

      if (course.sections) {
        dispatch(
          setSections(
            course.sections.map((section) => ({
              ...section,
              chapters: section.chapters.map((chapter) => ({
                ...chapter,
                assignments: chapter.assignments || [],
              })),
            })),
          )
        )
      }
    }
  }, [course, dispatch, methods])

  const createCourseFormData = (data: CourseFormData, sections: Section[], thumbnailUrl: string): FormData => {
    const formData = new FormData()

    formData.append("title", data.courseTitle)
    formData.append("description", data.courseDescription)
    formData.append("price", dollarsToCents(data.coursePrice).toString())
    formData.append("status", data.courseStatus ? "Published" : "Draft")

    if (thumbnailUrl) {
      formData.append("image", thumbnailUrl)
    }

    const sectionsWithPreservedData = sections.map((section) => ({
      ...section,
      chapters: section.chapters.map((chapter) => ({
        ...chapter,
        assignments: chapter.assignments || [],
        quiz: chapter.quiz || null,
        video: chapter.video || "",
      })),
    }))

    formData.append("sections", JSON.stringify(sectionsWithPreservedData))
    return formData
  }

  const onSubmit = async (data: CourseFormData) => {
    setIsUploading(true)
    setProgress(0)

    try {
      const updatedSectionsAfterVideos = await uploadAllVideos(
        sections,
        courseId,
        getUploadVideoUrl,
        (p) => setProgress(p)
      );

      const updatedSectionsAfterFiles = await uploadAllFiles(
        updatedSectionsAfterVideos,
        courseId,
        getUploadFileUrl,
        (p) => setProgress(p)
      );

      let thumbnailUrl = course?.image || ""
      if (image) thumbnailUrl = await uploadThumbnail(courseId, getUploadImageUrl, image)

      const formData = createCourseFormData(data, updatedSectionsAfterFiles, thumbnailUrl)
      await updateCourse({ orgId, cohortId, courseId, formData }).unwrap()
      
      window.location.href = `/organizations/${orgId}/cohorts/${cohortId}`
      refetch()
    } catch (error) {
      console.error("Failed to update course:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(`Failed to update course: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading || isOrgLoading) return <Spinner />
  if (!currentOrg) return <NotFound message="Organization not found" />
  if (!course) return <NotFound message="Course not found" />
  if (!instructors) return <NotFound message="Instructors not found" />

  return (
    <div className="dark:text-gray-100">
      <div className="flex items-center gap-5 mb-5">
        <button
          className="flex items-center border border-gray-400 dark:border-gray-600 px-4 py-2 gap-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200"
          onClick={() => window.location.href = `/organizations/${orgId}/cohorts/${cohortId}`}
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
                    methods.watch("courseStatus") ? "text-green-500" : "text-yellow-500"
                  }`}
                  inputClassName="data-[state=checked]:bg-green-500"
                />
                <Button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  disabled={isUploading || isUpdating}
                >
                  <CheckCircle className="w-5 h-5" />
                  {isUpdating ? "Updating..." : "Save"}
                </Button>
              </div>
            }
          />

          <div className="flex justify-between md:flex-row flex-col gap-10 mt-5 font-sans">
            <div className="basis-1/2">
              <div className="space-y-4">
                {course?.image && (
                  <Image
                    src={course.image || "/placeholder.svg"}
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
                  className="border-none dark:text-gray-100"
                  initialValue={course?.title}
                />

                <CustomFormField
                  name="courseDescription"
                  label="Course Description"
                  type="textarea"
                  placeholder="Write course description here"
                  initialValue={course?.description}
                  className="dark:text-gray-100"
                />

                <div className="space-y-2 flex flex-between">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Upload Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 dark:file:border-gray-600 file:bg-gray-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                    />
                  </div>
                </div>

                {!isInstructor && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <InstructorEmailInput
                      existingInstructors={instructors}
                      onAddInstructor={handleAddInstructor}
                      onRemoveInstructor={handleRemoveInstructor}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 mt-4 md:mt-0 p-4 rounded-lg basis-1/2">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Sections</h2>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(openSectionModal({ sectionIndex: null }))}
                    className="border-gray-300 dark:border-gray-600 text-blue-700 dark:text-blue-400 group"
                    disabled={isGenerating}
                  >
                    <Plus className="h-4 w-4 text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300" />
                    <span className="text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300">
                      Add Section
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDialogOpen(true)}
                    className="border-gray-300 dark:border-gray-600 text-blue-700 dark:text-blue-400 group"
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-4 w-4 text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300" />
                    <span className="text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300">
                      {isGenerating ? "Generating..." : "Generate"}
                    </span>
                  </Button>
                  <VimeoDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={handleURLSubmit}
                  />
                </div>
              </div>

              {isLoading ? (
                <p className="dark:text-gray-300">Loading course content...</p>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 border-2 border-blue-700 dark:border-blue-500 border-t-transparent rounded-full animate-spin"
                      aria-label="Generating content"
                    />
                    <p className="text-gray-800 dark:text-gray-200">Generating course content from video...</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This may take a few moments as we analyze the video content.
                  </p>
                </div>
              ) : sections.length > 0 ? (
                <DroppableComponent />
              ) : (
                <p className="dark:text-gray-300">No sections available</p>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="flex flex-col items-center mt-4 space-y-2">
              <div
                className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"
                aria-label="Loading"
              />
              <p className="text-gray-800 dark:text-gray-200">Uploading videos... {progress}% complete</p>
            </div>
          )}
        </form>
      </Form>

      <ChapterModal />
      <SectionModal />
    </div>
  )
}

export default CourseEditor
