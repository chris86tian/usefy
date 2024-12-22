import { Request, Response } from "express";
import { clerkClient } from "../index";

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
    res.json({ message: "Users retrieved successfully", data: { users, joinedLastMonth } });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
}

export const promoteUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const user = await clerkClient.users.getUser(userId);
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        userType: "teacher",
      },
    });
    res.json({ message: "User promoted successfully", data: user });
  } catch (error) {
    res.status(500).json({ message: "Error promoting user", error });
  }
}

export const demoteUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const user = await clerkClient.users.getUser(userId);
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        userType: "user",
      },
    });
    res.json({ message: "User demoted successfully", data: user });
  } catch (error) {
    res.status(500).json({ message: "Error demoting user", error });
  }
}

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    await clerkClient.users.deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
}