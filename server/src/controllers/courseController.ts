import { Request, Response } from "express";
import Course from "../models/courseModel";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";
import UserCourseProgress from "../models/userCourseProgressModel";
import Commit from "../models/commitModel";
import { count } from "console";

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
    const { teacherId, teacherName } = req.body;

    if (!teacherId || !teacherName) {
      res.status(400).json({ message: "Teacher Id and name are required" });
      return;
    }

    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId,
      teacherName,
      title: "Untitled Course",
      description: "",
      category: "Uncategorized",
      image: "",
      price: 0,
      level: "Beginner",
      status: "Draft",
      sections: [],
      enrollments: [],
    });

    const initialProgress = new UserCourseProgress({
      userId: teacherId,
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
    // Input validation
    if (updateData.price !== undefined) {
      const price = Number(updateData.price);
      if (isNaN(price) || price < 0) {
        res.status(400).json({
          message: "Invalid price format",
          error: "Price must be a non-negative number",
        });
        return;
      }
      updateData.price = price * 100;
    }

    // Fetch and validate course
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to update this course" });
      return;
    }

    // Handle image/thumbnail update
    if (updateData.thumbnail) {
      updateData.image = updateData.thumbnail;  // Transfer thumbnail to image field
      delete updateData.thumbnail;  // Clean up the thumbnail field
    }

    // Process sections if provided
    if (updateData.sections) {
      try {
        const sectionsData = typeof updateData.sections === "string"
          ? JSON.parse(updateData.sections)
          : updateData.sections;

        // Validate section structure
        if (!Array.isArray(sectionsData)) {
          throw new Error("Sections must be an array");
        }

        updateData.sections = sectionsData.map(section => ({
          ...section,
          sectionId: section.sectionId || uuidv4(),
          chapters: Array.isArray(section.chapters)
            ? section.chapters.map((chapter: { chapterId: any; assignments: any[]; }) => ({
                ...chapter,
                chapterId: chapter.chapterId || uuidv4(),
                assignments: Array.isArray(chapter.assignments)
                  ? chapter.assignments.map(assignment => ({
                      ...assignment,
                      assignmentId: assignment.assignmentId || uuidv4(),
                      submissions: Array.isArray(assignment.submissions)
                        ? assignment.submissions.map((submission: { submissionId: any; }) => ({
                            ...submission,
                            submissionId: submission.submissionId || uuidv4(),
                          }))
                        : [],
                    }))
                  : [],
              }))
            : [],
        }));
      } catch (error) {
        res.status(400).json({
          message: "Invalid sections data format",
          error: "Please provide valid JSON for sections",
        });
        return;
      }
    }

    // Update course - now includes proper image handling
    const updatedCourse = await Course.update(courseId, updateData);

    res.json({
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      message: "Failed to update course",
      error: "An unexpected error occurred",
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

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to archive this course " });
      return;
    }

    course.status = "Archived";
    await course.save();

    res.json({ message: "Course archived successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error archiving course", error });
  }
}

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

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this course " });
      return;
    }

    await Course.delete(courseId);

    res.json({ message: "Course deleted successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

export const unarchiveCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to unarchive this course " });
      return;
    }

    course.status = "Draft";
    await course.save();

    res.json({ message: "Course unarchived successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error unarchiving course", error });
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

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: s3Key,
      Expires: 60,
      ContentType: fileType,
    };

    const uploadUrl = s3.getSignedUrl("putObject", s3Params);
    const videoUrl = `${process.env.CLOUDFRONT_DOMAIN}/videos/${uniqueId}/${fileName}`;

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
    
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: s3Key,
      Expires: 60,
      ContentType: fileType,
    };

    const uploadUrl = s3.getSignedUrl("putObject", s3Params);
    
    const imageUrl = `${process.env.CLOUDFRONT_DOMAIN}/images/${uniqueId}/${fileName}`;

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
  const { title, description, resources, hints } = req.body;

  try {
    // Fetch the course
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Find the section
    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    // Find the chapter
    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Authorization check
    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to create assignment for this course" });
      return;
    }

    // Validate input fields
    if (!title || !description) {
      res.status(400).json({
        message: "Title and description are required",
      });
      return;
    }

    // Create the assignment
    const assignment = {
      assignmentId: uuidv4(),
      title,
      description,
      resources: resources || [],
      submissions: [],
      hints: hints || [],
    };

    // Ensure `assignments` is an array in the chapter
    if (!chapter.assignments) {
      chapter.assignments = []; // Initialize if it doesn't exist
    }

    // Add the new assignment to the assignments array
    chapter.assignments.push(assignment);

    // Save the course
    await course.save();

    // Respond with success
    res.json({ message: "Assignment created successfully", data: assignment });
  } catch (error) {
    // Handle errors
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

    res.json({ message: "Assignment retrieved successfully", data: assignment });
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

    res.json({ message: "Assignments retrieved successfully", data: chapter.assignments });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving assignments", error });
  }
}

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

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to delete assignments for this course" });
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
}

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

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to update assignments for this course" });
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
}

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

    // const commit = await Commit.get(new Date().toISOString().split("T")[0]);
    // if (!commit) {
    //   new Commit({
    //     id: uuidv4(),
    //     userId,
    //     date: new Date().toISOString().split("T")[0],
    //     count: 1,
    //   })
    // } else {
    //   commit.count += 1;
    // }

    // await commit.save();
    await course.save();
    res.json({ message: "Assignment submitted successfully", data: submission });
  } catch (error) {
    res.status(500).json({ message: "Error submitting assignment", error });
  }
}

export const createComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);
  const { id, username, content, createdAt, replies } = req.body;

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
}

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
}

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

    res.json({ message: "Comments retrieved successfully", data: chapter.comments });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving comments", error });
  }
}

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
}

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
    res.json({ message: "Chapter disliked successfully", data: chapter });
  } catch (error) {
    res.status(500).json({ message: "Error disliking chapter", error });
  }
}