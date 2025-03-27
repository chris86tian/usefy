import { Request, Response } from "express";
import { clerkClient } from "../index";
import Course from "../models/courseModel";

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const user = await clerkClient.users.getUser(userId);
    res.json({ message: "User retrieved successfully!", data: user });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const userData = req.body;
  try {
    const user = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        userType: userData.publicMetadata.userType,
        settings: userData.publicMetadata.settings,
      },
    });

    res.json({ message: "User updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await clerkClient.users.getUserList();
    const joinedLastMonth = users.data.filter((user) => {
      const joinedDate = new Date(user.createdAt);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return joinedDate > lastMonth;
    });
    res.json({ message: "Users retrieved successfully", data: users.data });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
};

export const getCourseUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { page = "1", limit = "10" } = req.query;

  const pageNumber = Number.parseInt(page as string, 10);
  const limitNumber = Number.parseInt(limit as string, 10);

  try {
    console.log(`[getCourseUsers] Starting with courseId: ${courseId}`);
    
    const course = await Course.get(courseId);
    if (!course) {
      console.log(`[getCourseUsers] Course not found for courseId: ${courseId}`);
      res.status(404).json({ message: "Course not found" });
      return;
    }

    console.log(`[getCourseUsers] Course found:`, {
      courseId,
      title: course.title,
      enrollmentCount: course.enrollments?.length || 0
    });

    const courseUserIds = course.enrollments.map(
      (enrollment: { userId: any }) => enrollment.userId
    );

    console.log(`[getCourseUsers] Course user IDs:`, {
      count: courseUserIds.length,
      ids: courseUserIds
    });

    // Get total count first
    console.log(`[getCourseUsers] Fetching total count with userId filter`);
    const totalCountResponse = await clerkClient.users.getUserList({
      userId: courseUserIds,
      limit: 1,
    });

    console.log(`[getCourseUsers] Total count response:`, {
      totalCount: totalCountResponse.totalCount,
      dataLength: totalCountResponse.data.length
    });

    const totalUsers = totalCountResponse.totalCount;
    const totalPages = Math.ceil(totalUsers / limitNumber);
    const offset = (pageNumber - 1) * limitNumber;

    console.log(`[getCourseUsers] Pagination details:`, {
      totalUsers,
      totalPages,
      offset,
      limitNumber
    });

    // Get paginated users
    console.log(`[getCourseUsers] Fetching paginated users`);
    const clerkResponse = await clerkClient.users.getUserList({
      userId: courseUserIds,
      limit: limitNumber,
      offset: offset,
    });

    console.log(`[getCourseUsers] Paginated response:`, {
      dataLength: clerkResponse.data.length,
      totalCount: clerkResponse.totalCount
    });

    const response = {
      users: clerkResponse.data,
      pagination: {
        total: totalUsers,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };

    res.json({
      message: "Course users retrieved successfully",
      data: response,
    });
  } catch (error) {
    console.error("[getCourseUsers] Error:", error);
    res.status(500).json({ message: "Error retrieving course users", error });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  try {
    await clerkClient.users.deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};
