import { Request, Response } from "express";
import Organization from "../models/organizationModel";
import Course from "../models/courseModel";
import { getAuth } from "@clerk/express";
import { clerkClient } from "..";
import { sendEmail } from "../utils/sendEmail";

export const getOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  try {
    const organization = await Organization.query("organizationId")
      .eq(organizationId)
      .exec();
    res.json({
      message: "Organization retrieved successfully",
      data: organization,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving organization", error });
  }
};

export const listOrganizations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const organizations = await Organization.scan().exec();
    res.json({
      message: "Organizations retrieved successfully",
      data: organizations,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving organizations", error });
  }
};

export const createOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId, name, description, image } = req.body;
  const auth = getAuth(req);

  try {
    const organization = new Organization({
      organizationId,
      name,
      description,
      image,
      admins: [{ userId: auth.userId }],
      instructors: [],
      learners: [],
      courses: [],
    });
    await organization.save();
    res.json({
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error creating organization", error });
  }
};

export const updateOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const { name, description, image } = req.body;
  console.log("organizationId", organizationId);
  console.log("req", req.body);

  try {
    const organization = await Organization.update(organizationId, {
      $SET: {
        name,
        description,
        image,
      },
    });
    res.json({
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating organization", error });
  }
};

export const deleteOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  try {
    await Organization.delete(organizationId);
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting organization", error });
  }
};

export const joinOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const auth = getAuth(req);
  try {
    const organization = await Organization.query("organizationId")
      .eq(organizationId)
      .exec();
    if (!organization || organization.length === 0) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }
    organization[0].learners.push({ userId: auth.userId });
    await organization[0].save();
    res.json({
      message: "Organization joined successfully",
      data: organization[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error joining organization", error });
  }
};

export const getMyOrganizations = async (
  req: Request,
  res: Response
): Promise<void> => {
  const auth = getAuth(req);

  try {
    const allOrganizations = await Organization.scan().exec();

    const userOrganizations = allOrganizations.filter(
      (org) =>
        org.admins?.some(
          (admin: { userId: string }) => admin.userId === auth.userId
        ) ||
        org.instructors?.some(
          (instructor: { userId: string }) => instructor.userId === auth.userId
        ) ||
        org.learners?.some(
          (learner: { userId: string }) => learner.userId === auth.userId
        )
    );

    res.json({
      message: "Organizations retrieved successfully",
      data: userOrganizations,
    });
  } catch (error) {
    console.error("Error retrieving organizations:", error);
    res.status(500).json({ message: "Error retrieving organizations", error });
  }
};

export const getOrganizationCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;

  try {
    console.log(`Getting courses for organization: ${organizationId}`);

    const organization = await Organization.query("organizationId")
      .eq(organizationId)
      .exec();
    const orgData = organization?.[0];

    if (!orgData) {
      console.log(`Organization not found: ${organizationId}`);
      res.json({ message: "No courses found for this organization", data: [] });
      return;
    }

    const courseIds = orgData.courses || [];
    if (courseIds.length === 0) {
      res.json({ message: "No courses found for this organization", data: [] });
      return;
    }
    
    const courses = await Course.batchGet(courseIds);
    res.json({ message: "Courses retrieved successfully", data: courses });
    return;
  } catch (error) {
    console.error(
      `Error retrieving courses for organization ${organizationId}:`,
      error
    );
    res.json({ message: "Error retrieving courses", data: [], error });
    return;
  }
};

export const addCourseToOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId, courseId } = req.params;

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    organization.courses = organization.courses || [];

    if (
      !organization.courses.some(
        (course: { courseId: string }) => course.courseId === courseId
      )
    ) {
      organization.courses.push({ courseId });
      await organization.save();
    }

    res.json({
      message: "Course added to organization successfully",
      data: organization,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding course to organization", error });
  }
};

export const removeCourseFromOrganization = async (req: Request, res: Response): Promise<void> => {
    const { organizationId, courseId } = req.params;

    try {
        const organization = await Organization.get(organizationId);
        if (!organization) {
            res.status(404).json({ message: "Organization not found" });
            return;
        }

        organization.courses = organization.courses || [];

        const courseIndex = organization.courses.findIndex((course: { courseId: string; }) => course.courseId === courseId);
        if (courseIndex !== -1) {
            organization.courses.splice(courseIndex, 1);
            await organization.save();
        }

        res.json({ message: "Course removed from organization successfully", data: organization });
    } catch (error) {
        res.status(500).json({ message: "Error removing course from organization", error });
    }
};

export const inviteUserToOrganization = async (req: Request, res: Response): Promise<void> => {
  const { organizationId } = req.params;
  const { role, email } = req.body;

  try {
      const users = await clerkClient.users.getUserList({ emailAddress: [email] });

      let user;
      if (users.totalCount > 0) {
          user = users.data[0];
      }

      const organization = await Organization.get(organizationId);
      if (!organization) {
          res.status(404).json({ message: "Organization not found" });
          return;
      }

      if (user) {
          switch (role) {
              case "admin":
                  if (!organization.admins.some((admin: any) => admin.userId === user.id)) {
                      organization.admins.push({ userId: user.id });
                  }
                  sendEmail(
                      user.emailAddresses[0].emailAddress,
                      "You've been added as an admin to an organization",
                      `You've been added as an admin to the organization ${organization.name}. Click here to view: ${process.env.CLIENT_URL}/organizations/${organization.organizationId}`
                  );
                  break;
              case "instructor":
                  if (!organization.instructors.some((inst: any) => inst.userId === user.id)) {
                      organization.instructors.push({ userId: user.id });
                  }
                  sendEmail(
                      user.emailAddresses[0].emailAddress,
                      "You've been added as an instructor to an organization",
                      `You've been added as an instructor to the organization ${organization.name}. Click here to view: ${process.env.CLIENT_URL}/organizations/${organization.organizationId}`
                  );
                  break;
              case "learner":
                  if (!organization.learners.some((learner: any) => learner.userId === user.id)) {
                      organization.learners.push({ userId: user.id });
                  }
                  sendEmail(
                      user.emailAddresses[0].emailAddress,
                      "You've been added as a learner to an organization",
                      `You've been added as a learner to the organization ${organization.name}. Click here to view: ${process.env.CLIENT_URL}/organizations/${organization.organizationId}`
                  );
                  break;
              default:
                  res.status(400).json({ message: "Invalid role specified" });
                  return;
          }

          await organization.save();
          res.json({ message: "User added to organization successfully", data: organization });
      } else {
          sendEmail(
              email,
              "You've been invited to join an organization",
              `You've been invited to join the organization ${organization.name}. Click here to create an account and join: https://www.usefy.com/signup`
          );
      }
  } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ message: "Error inviting user to organization", error });
  }
};

export const getOrganizationUsers = async (req: Request, res: Response): Promise<void> => {
  const { organizationId } = req.params;

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const userIds = new Set([
      ...organization.admins.map((admin: { userId: string }) => admin.userId),
      ...organization.instructors.map((instructor: { userId: string }) => instructor.userId),
      ...organization.learners.map((learner: { userId: string }) => learner.userId),
    ]);

    const users = await clerkClient.users.getUserList({ userId: Array.from(userIds) });

    const response = {
      admins: users.data.filter(user => organization.admins.some((admin: { userId: string }) => admin.userId === user.id)),
      instructors: users.data.filter(user => organization.instructors.some((instructor: { userId: string }) => instructor.userId === user.id)),
      learners: users.data.filter(user => organization.learners.some((learner: { userId: string }) => learner.userId === user.id)),
    };

    res.json({ message: "Organization users retrieved successfully", data: response });
  } catch (error) {
    console.error("Error retrieving organization users:", error);
    res.status(500).json({ message: "Error retrieving organization users", error });
  }
};

export const removeUserFromOrganization = async (req: Request, res: Response): Promise<void> => {
  const { organizationId, userId } = req.params;
  const { role } = req.body;

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    switch (role) {
      case "admin":
        organization.admins = organization.admins.filter((admin: { userId: string }) => admin.userId !== userId);
        break;
      case "instructor":
        organization.instructors = organization.instructors.filter((instructor: { userId: string }) => instructor.userId !== userId);
        break;
      case "learner":
        organization.learners = organization.learners.filter((learner: { userId: string }) => learner.userId !== userId);
        break;
      default:
        res.status(400).json({ message: "Invalid role specified" });
        return;
    }

    await organization.save();
    res.json({ message: "User removed from organization successfully", data: organization });
  } catch (error) {
    console.error("Error removing user from organization:", error);
    res.status(500).json({ message: "Error removing user from organization", error });
  }
};

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const { organizationId, userId } = req.params;
  const { currentRole, newRole } = req.body;

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    let roleArray;
    switch (currentRole) {
      case "admin":
        roleArray = organization.admins;
        break;
      case "instructor":
        roleArray = organization.instructors;
        break;
      case "learner":
        roleArray = organization.learners;
        break;
      default:
        res.status(400).json({ message: "Invalid current role specified" });
        return;
    }

    const userIndex = roleArray.findIndex((user: { userId: string }) => user.userId === userId);
    if (userIndex === -1) {
      res.status(404).json({ message: "User not found in organization" });
      return;
    }

    roleArray.splice(userIndex, 1);

    switch (newRole) {
      case "admin":
        organization.admins.push({ userId });
        break;
      case "instructor":
        organization.instructors.push({ userId });
        break;
      case "learner":
        organization.learners.push({ userId });
        break;
      default:
        res.status(400).json({ message: "Invalid new role specified" });
        return;
    }

    await organization.save();
    res.json({ message: "User role changed successfully", data: organization });
  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({ message: "Error changing user role", error });
  }
};