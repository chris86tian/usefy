import { Request, Response } from "express";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";
import { mergeSections, calculateOverallProgress } from "../utils/utils";
import Commit from "../models/commitModel";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import UserNotification from "../models/notificationModel";
import { clerkClient } from "..";

const s3 = new AWS.S3();

export const listCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { category } = req.query;
  try {
    const courses =
      category && category !== "all"
        ? await Course.scan("category").eq(category).exec()
        : await Course.scan().exec();
    res.json({ message: "Courses retrieved successfully", data: courses });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving courses", error });
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.json({ message: "Course retrieved successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving course", error });
  }
};

export const createCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const auth = getAuth(req);

    const newCourse = new Course({
      courseId: uuidv4(),
      instructors: [],
      title: "Untitled Course",
      description: "",
      category: "Uncategorized",
      image: "",
      price: 0,
      status: "Draft",
      sections: [],
      enrollments: [],
    });

    const initialProgress = new UserCourseProgress({
      userId: auth.userId,
      courseId: newCourse.courseId,
      enrollmentDate: new Date().toISOString(),
      overallProgress: 0,
      lastAccessedTimestamp: new Date().toISOString(),
      sections: newCourse.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false,
          quizCompleted: false,
        })),
      })),
    });
    await initialProgress.save();

    await newCourse.save();

    res.json({ message: "Course created successfully", data: newCourse });
  } catch (error) {
    res.status(500).json({ message: "Error creating course", error });
  }
};

export const updateCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const updateData = { ...req.body };
  const { userId } = getAuth(req);

  try {
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (updateData.price !== undefined) {
      const price = Number(updateData.price);
      if (isNaN(price) || price < 0) {
        res.status(400).json({
          message: "Invalid price format",
          error: "Price must be a non-negative number",
        });
        return;
      }
      updateData.price = price;
    }

    if (updateData.thumbnail) {
      updateData.image = updateData.thumbnail;
      delete updateData.thumbnail;
    }

    if (updateData.sections) {
      try {
        const sectionsData =
          typeof updateData.sections === "string"
            ? JSON.parse(updateData.sections)
            : updateData.sections;

        if (!Array.isArray(sectionsData)) {
          throw new Error("Sections must be an array");
        }

        updateData.sections = sectionsData.map((section) => ({
          ...section,
          sectionId: section.sectionId || uuidv4(),
          chapters: Array.isArray(section.chapters)
            ? section.chapters.map((chapter: any) => ({
                ...chapter,
                chapterId: chapter.chapterId || uuidv4(),
                assignments: Array.isArray(chapter.assignments)
                  ? chapter.assignments.map((assignment: any) => ({
                      ...assignment,
                      assignmentId: assignment.assignmentId || uuidv4(),
                      submissions: Array.isArray(assignment.submissions)
                        ? assignment.submissions
                        : [],
                    }))
                  : [],
                quiz: chapter.quiz
                  ? {
                      ...chapter.quiz,
                      quizId: chapter.quiz.quizId || uuidv4(),
                      questions: Array.isArray(chapter.quiz.questions)
                        ? chapter.quiz.questions.map((question: any) => ({
                            ...question,
                            questionId: question.questionId || uuidv4(),
                          }))
                        : [],
                    }
                  : undefined,
                video: chapter.video || "",
              }))
            : [],
        }));
      } catch (error) {
        console.error("Error processing sections data:", error);
        res.status(400).json({
          message: "Invalid sections data format",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }
    }

    const updatedCourse = await Course.update(courseId, updateData);

    if (updateData.sections) {
      const progressList = await UserCourseProgress.query("courseId")
        .eq(courseId)
        .using("CourseIdIndex")
        .exec();

      for (const progress of progressList) {
        // Create a deep copy of the existing progress sections to avoid mutations
        const existingSections = JSON.parse(
          JSON.stringify(progress.sections || [])
        );
        progress.sections = mergeSections(
          existingSections,
          updateData.sections
        );
        progress.lastAccessedTimestamp = new Date().toISOString();
        progress.overallProgress = calculateOverallProgress(progress.sections);
        await progress.save();
      }
    }

    res.json({
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      message: "Failed to update course",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const archiveCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    course.status = "Archived";
    await course.save();

    res.json({ message: "Course archived successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error archiving course", error });
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    await Course.delete(courseId);

    res.json({ message: "Course deleted successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

export const unarchiveCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    course.status = "Draft";
    await course.save();

    res.json({ message: "Course unarchived successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error unarchiving course", error });
  }
};

export const addCourseInstructor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = req.body;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (!course.instructors) {
      course.instructors = [];
    }

    course.instructors.push({ userId });

    await course.save();

    res.json({ message: "Instructor added to course successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error adding instructor to course", error });
  }
};

export const removeCourseInstructor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = req.body;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (!course.instructors) {
      res.status(404).json({ message: "Instructors not found" });
      return;
    }

    course.instructors = course.instructors.filter(
      (instructor: any) => instructor.userId !== userId
    );

    await course.save();

    res.json({ message: "Instructor removed from course successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error removing instructor from course", error });
  }   
}

export const getCourseInstructors = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  console.log("courseId", courseId);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (!course.instructors) {
      res.json({ message: "Instructors not found", data: [] });
      return;
    }

    const userIds = course.instructors.map((instructor: any) => instructor.userId);

    const user = (await clerkClient.users.getUserList({ userId: userIds })).data;

    res.json({ message: "Instructors retrieved successfully", data: user });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving instructor", error });
  }
}

export const getUploadVideoUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    res.status(400).json({ message: "File name and type are required" });
    return;
  }

  try {
    const uniqueId = uuidv4();
    const s3Key = `videos/${uniqueId}/${fileName}`;
    const bucketName = process.env.S3_BUCKET_NAME || "expertize-bucket";

    const s3Params = {
      Bucket: bucketName,
      Key: s3Key,
      Expires: 60,
      ContentType: fileType,
    };

    const uploadUrl = s3.getSignedUrl("putObject", s3Params);
    const videoUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

    res.json({
      message: "Upload URL generated successfully",
      data: { uploadUrl, videoUrl },
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating upload URL", error });
  }
};

export const getUploadImageUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    res.status(400).json({ message: "File name and type are required" });
    return;
  }

  try {
    const uniqueId = uuidv4();
    const s3Key = `images/${uniqueId}/${fileName}`;
    const bucketName = process.env.S3_BUCKET_NAME || "expertize-bucket";

    const s3Params = {
      Bucket: bucketName,
      Key: s3Key,
      Expires: 300,
      ContentType: fileType,
    };

    const uploadUrl = s3.getSignedUrl("putObject", s3Params);
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

    res.json({
      message: "Upload URL generated successfully",
      data: { uploadUrl, imageUrl },
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ message: "Error generating upload URL", error });
  }
};

export const createAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);
  const {
    title,
    description,
    resources,
    hints,
    fileUrl,
    isCoding,
    language,
    starterCode,
  } = req.body;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!title || !description) {
      res.status(400).json({
        message: "Title and description are required",
      });
      return;
    }

    const assignment = {
      assignmentId: uuidv4(),
      title,
      description,
      fileUrl,
      isCoding,
      language,
      starterCode,
      resources,
      submissions: [],
      hints,
    };

    if (!chapter.assignments) {
      chapter.assignments = [];
    }

    chapter.assignments.push(assignment);

    await course.save();

    res.json({ message: "Assignment created successfully", data: assignment });
  } catch (error) {
    res.status(500).json({ message: "Error creating assignment", error });
  }
};

export const getAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, assignmentId } = req.params;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.assignments) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    const assignment = chapter.assignments.find(
      (assignment: any) => assignment.assignmentId === assignmentId
    );
    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    res.json({
      message: "Assignment retrieved successfully",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving assignment", error });
  }
};

export const getAssignments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.assignments) {
      res.json({ message: "No assignments found", data: [] });
      return;
    }

    res.json({
      message: "Assignments retrieved successfully",
      data: chapter.assignments,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving assignments", error });
  }
};

export const deleteAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, assignmentId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.assignments) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    chapter.assignments = chapter.assignments.filter(
      (assignment: any) => assignment.assignmentId !== assignmentId
    );

    await course.save();

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assignment", error });
  }
};

export const updateAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, assignmentId } = req.params;
  const { userId } = getAuth(req);
  const { title, description, resources, hints } = req.body;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.assignments) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    const assignment = chapter.assignments.find(
      (assignment: any) => assignment.assignmentId === assignmentId
    );
    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    if (!title || !description) {
      res.status(400).json({
        message: "Title and description are required",
      });
      return;
    }

    assignment.title = title;
    assignment.description = description;
    assignment.resources = resources || [];
    assignment.hints = hints || [];

    await course.save();
    res.json({ message: "Assignment updated successfully", data: assignment });
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment", error });
  }
};

export const createSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, assignmentId } = req.params;
  const { userId } = getAuth(req);
  const { submissionId, code, evaluation } = req.body;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.assignments) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    const assignment = chapter.assignments.find(
      (assignment: any) => assignment.assignmentId === assignmentId
    );
    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    const submission = assignment.submissions.find(
      (submission: any) => submission.submissionId === submissionId
    );

    if (submission) {
      submission.code = code;
      submission.evaluation = evaluation;
    } else {
      assignment.submissions.push({
        submissionId: uuidv4(),
        userId,
        code,
        evaluation,
        submittedAt: new Date().toISOString(),
      });
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      let commit = await Commit.query("userId")
        .eq(userId)
        .where("date")
        .eq(today)
        .using("userId-date-index")
        .exec();

      if (commit.length > 0) {
        await Commit.update(
          { commitId: commit[0].commitId },
          { count: commit[0].count + 1 }
        );
      } else {
        const newCommit = new Commit({
          commitId: uuidv4(),
          userId,
          date: today,
          count: 1,
        });
        await newCommit.save();
      }
    } catch (commitError) {
      console.error("Error handling commit:", commitError);
    }

    await course.save();
    res.json({
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    res.status(500).json({ message: "Error submitting assignment", error });
  }
};

export const getUserCourseSubmissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, userId } = req.params;

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Extract submission data from course structure for the specified userId
    const submissions: any[] = [];

    if (course.sections) {
      course.sections.forEach((section: any) => {
        if (section.chapters) {
          section.chapters.forEach((chapter: any) => {
            if (chapter.assignments) {
              chapter.assignments.forEach((assignment: any) => {
                if (assignment.submissions) {
                  assignment.submissions.forEach((submission: any) => {
                    if (submission.userId === userId) {
                      submissions.push({
                        assignmentId: assignment.assignmentId,
                        assignmentTitle: assignment.title,
                        userId: submission.userId,
                        submissionId: submission.submissionId,
                        code: submission.code,
                        evaluation: submission.evaluation,
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    res.json({
      message: "Submissions retrieved successfully",
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving submissions", error });
  }
};

export const createComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);
  const { id, username, content, upvotes, downvotes, createdAt, replies } =
    req.body;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    const newComment = {
      id,
      userId,
      username,
      content,
      upvotes,
      downvotes,
      createdAt,
      replies,
    };

    if (!chapter.comments) {
      chapter.comments = [];
    }

    chapter.comments.push(newComment);

    await course.save();
    res.json({ message: "Comment created successfully", data: newComment });
  } catch (error) {
    res.status(500).json({ message: "Error creating comment", error });
  }
};

export const upvoteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, commentId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.comments) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const comment = chapter.comments.find(
      (comment: any) => comment.id === commentId
    );
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (!comment.upvotes) {
      comment.upvotes = 0;
    }

    comment.upvotes += 1;

    await course.save();
    res.json({ message: "Comment upvoted successfully", data: comment });
  } catch (error) {
    res.status(500).json({ message: "Error upvoting comment", error });
  }
};

export const downvoteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, commentId } = req.params;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.comments) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const comment = chapter.comments.find(
      (comment: any) => comment.id === commentId
    );
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (!comment.downvotes) {
      comment.downvotes = 0;
    }

    comment.downvotes += 1;

    await course.save();
    res.json({ message: "Comment downvoted successfully", data: comment });
  } catch (error) {
    res.status(500).json({ message: "Error downvoting comment", error });
  }
};

export const createReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, commentId } = req.params;
  const { userId } = getAuth(req);
  const { id, username, content, createdAt } = req.body;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    const comment = chapter.comments.find(
      (comment: any) => comment.id === commentId
    );
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const newReply = {
      id,
      userId,
      username,
      content,
      createdAt,
    };

    if (!comment.replies) {
      comment.replies = [];
    }

    comment.replies.push(newReply);

    await course.save();
    res.json({ message: "Reply created successfully", data: newReply });
  } catch (error) {
    res.status(500).json({ message: "Error creating reply", error });
  }
};

export const getComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.comments) {
      res.json({ message: "No comments found", data: [] });
      return;
    }

    res.json({
      message: "Comments retrieved successfully",
      data: chapter.comments,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving comments", error });
  }
};

export const likeChapter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.likes) {
      chapter.likes = 0;
    }

    chapter.likes += 1;

    await course.save();
    res.json({ message: "Chapter liked successfully", data: chapter });
  } catch (error) {
    res.status(500).json({ message: "Error liking chapter", error });
  }
};

export const dislikeChapter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.dislikes) {
      chapter.dislikes = 0;
    }

    chapter.dislikes += 1;

    await course.save();
    res.json({ data: chapter });
  } catch (error) {
    res.status(500).json({ message: "Error disliking chapter", error });
  }
};

export const enrollUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId, userId } = req.params;

    if (!courseId || !userId) {
      res.status(400).json({ message: "Missing courseId or userId" });
    }

    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
    }

    if (!Array.isArray(course.enrollments)) {
      course.enrollments = [];
    }

    course.enrollments.push({ userId });

    await course.save();

    res.json({ message: "User enrolled successfully" });
  } catch (error) {
    console.error("Unhandled server error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const unenrollUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId, userId } = req.params;

    if (!courseId || !userId) {
      res.status(400).json({ message: "Missing courseId or userId" });
    }

    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
    }

    if (!Array.isArray(course.enrollments)) {
      res.status(404).json({ message: "No enrollments found for this course" });
    }

    course.enrollments = course.enrollments.filter(
      (enrollment: any) => enrollment.userId !== userId
    );

    await course.save();

    await UserCourseProgress.delete({ userId, courseId });

    try {
      const notification = new UserNotification({
        notificationId: uuidv4(),
        userId,
        title: "Unenrollment",
        message: "You have been unenrolled from the course: " + course.title,
        timestamp: new Date().toISOString(),
      });
      await notification.save();
    } catch (err) {
      console.error("Error sending notification:", err);
      res
        .status(500)
        .json({ message: "Error sending notification", error: err });
    }

    res.json({ message: "User unenrolled successfully" });
  } catch (error) {
    console.error("Unhandled server error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const fixCourseImageUrls = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courses = await Course.scan().exec();
    const bucketName = process.env.S3_BUCKET_NAME || "expertize-bucket";

    for (const course of courses) {
      if (
        course.image &&
        course.image.includes("your-cloudfront-domain.cloudfront.net")
      ) {
        // Extract the image path from the incorrect URL
        const imagePath = course.image.split("/images/")[1];
        if (imagePath) {
          // Construct the correct S3 URL
          const correctImageUrl = `https://${bucketName}.s3.amazonaws.com/images/${imagePath}`;
          await Course.update(
            { courseId: course.courseId },
            { image: correctImageUrl }
          );
        }
      }
    }

    res.json({ message: "Course image URLs fixed successfully" });
  } catch (error) {
    console.error("Error fixing course image URLs:", error);
    res.status(500).json({ message: "Error fixing course image URLs", error });
  }
};
