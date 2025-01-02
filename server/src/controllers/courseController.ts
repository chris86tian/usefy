import { Request, Response } from "express";
import Course from "../models/courseModel";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";
import UserCourseProgress from "../models/userCourseProgressModel";

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
      sections: newCourse.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false,
        })),
      })),
      lastAccessedTimestamp: new Date().toISOString(),
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
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to update this course " });
      return;
    }

    if (updateData.price) {
      const price = parseInt(updateData.price);
      if (isNaN(price)) {
        res.status(400).json({
          message: "Invalid price format",
          error: "Price must be a valid number",
        });
        return;
      }
      updateData.price = price * 100;
    }

    if (updateData.thumbnail) {
      course.image = updateData.thumbnail;
    }

    if (updateData.sections) {
      const sectionsData =
        typeof updateData.sections === "string"
          ? JSON.parse(updateData.sections)
          : updateData.sections;

      updateData.sections = sectionsData.map((section: any) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: section.chapters.map((chapter: any) => ({
          ...chapter,
          chapterId: chapter.chapterId || uuidv4(),
        })),
      }));
    }

    Object.assign(course, updateData);
    await course.save();

    res.json({ message: "Course updated successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error updating course", error });
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
  const { userId } = getAuth(req); // Assuming `getAuth` extracts user info
  const { title, description } = req.body;

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
      assignmentId: uuidv4(), // Ensure `uuidv4` is imported from 'uuid'
      title,
      description,
      submissions: [],
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
  const { title, description } = req.body;

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

    if (title) {
      assignment.title = title;
    }

    if (description) {
      assignment.description = description;
    }

    await course.save();

    res.json({ message: "Assignment updated successfully", data: assignment });
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment", error });
  }
}
