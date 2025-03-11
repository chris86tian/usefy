import { Request, Response } from "express";
import Organization from "../models/organizationModel";
import { getAuth } from "@clerk/express";
import { clerkClient } from "..";
import Cohort from "../models/cohortModel";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import { sendMessage } from "../utils/utils";

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

  const superadmins = (await clerkClient.users.getUserList()).data.filter(user => user.publicMetadata.userType === "superadmin");
  if (superadmins.length === 0) {
    res.status(400).json({ message: "No superadmins found" });
    return;
  }

  try {
    const organization = new Organization({
      organizationId,
      name,
      description,
      image,
      cohorts: [],
      admins: [{ userId: auth.userId }],
      instructors: [],
      learners: [],
      courses: [],
    });
    await organization.save();

    for (const superadmin of superadmins) {
      await sendMessage(
        superadmin.id,
        superadmin.emailAddresses[0].emailAddress,
        "A new organization has been created",
        `A new organization ${name} has been created. Click here to view: ${process.env.CLIENT_URL}/organizations/${organizationId}/dashboard`,
        `/organizations/${organizationId}/dashboard`,
        { sendEmail: true, sendNotification: true, rateLimited: true }
      );
    }

    res.json({
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating organization", error });
  }
};

export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  const { organizationId } = req.params;
  const name = req.body.name;
  const description = req.body.description;
  const image = req.body.image;

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
    const organization = await Organization.query("organizationId")
      .eq(organizationId)
      .exec();
    const orgData = organization?.[0];

    if (!orgData) {
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

// DOES NOT WORK
export const getMyOrganizationCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);
  const { organizationId } = req.params;

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const courses = await Course.scan()
      .where("organizationId")
      .eq(organizationId)
      .exec();

    const userCourses = courses.filter(course =>
      course.enrollments?.some((enrollment: any) => enrollment.userId === userId)
    );

    res.json({ message: "Courses retrieved successfully", data: userCourses });
  } catch (error) {
    console.error("Error retrieving courses for organization:", error);
    res.status(500).json({ message: "Error retrieving courses for organization", error });
  }
};

export const getMyUserCourseProgresses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);
  const { organizationId } = req.params;

  try {
    // Fetch all cohorts in the organization
    const cohorts = await Cohort.scan().where("organizationId").eq(organizationId).exec();

    if (!cohorts || cohorts.length === 0) {
      res.json({ message: "No cohorts found for this organization", data: [] });
      return;
    }

    // Collect all courseIds from the cohorts
    const courseIds = cohorts.flatMap((cohort: any) => cohort.courses.map((course: { courseId: string }) => course.courseId));

    if (courseIds.length === 0) {
      res.json({ message: "No courses found in any cohort", data: [] });
      return;
    }

    // Fetch all courses
    const courses = await Course.batchGet(courseIds.map((courseId: string) => ({ courseId })));

    // Filter courses where the user is enrolled
    const userCourses = courses.filter(course =>
      course.enrollments?.some((enrollment: any) => enrollment.userId === userId)
    );

    const enrolledCourseIds = userCourses.map(course => course.courseId);

    if (enrolledCourseIds.length === 0) {
      res.json({ message: "No enrolled courses found", data: [] });
      return;
    }

    // Ensure the batchGet request matches the schema
    const progressKeys = enrolledCourseIds.map(courseId => ({
      userId: String(userId),  // Ensure userId is a string
      courseId: String(courseId), // Ensure courseId is a string
    }));

    const progresses = await UserCourseProgress.batchGet(progressKeys);

    res.json({ 
      message: "Course progresses retrieved successfully", 
      data: progresses 
    });

  } catch (error) {
    console.error("Error retrieving course progresses:", error);
    res.status(500).json({ message: "Error retrieving course progresses", error });
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
        }

        organization.cohorts = organization.cohorts || [];
        organization.cohorts.forEach(async (cohort: { cohortId: string; }) => {
            const cohortData = await Cohort.get(cohort.cohortId);
            if (cohortData) {
                cohortData.courses = cohortData.courses || [];
                const courseIndex = cohortData.courses.findIndex((course: { courseId: string; }) => course.courseId === courseId);
                if (courseIndex !== -1) {
                    cohortData.courses.splice(courseIndex, 1);
                    await cohortData.save();
                }
            }
        });

        await Course.delete(courseId);
        
        await organization.save();
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
    let user = users.totalCount > 0 ? users.data[0] : null;

    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const roleMapping: Record<string, { list: any[]; title: string; message: string }> = {
      admin: {
        list: organization.admins,
        title: "You've been added as an admin to an organization",
        message: `You've been added as an admin to the organization ${organization.name}. Click here to view: ${process.env.CLIENT_URL}/organizations/${organization.organizationId}`,
      },
      instructor: {
        list: organization.instructors,
        title: "You've been added as an instructor to an organization",
        message: `You've been added as an instructor to the organization ${organization.name}. Click here to view: ${process.env.CLIENT_URL}/organizations/${organization.organizationId}`,
      },
      learner: {
        list: organization.learners,
        title: "You've been added as a learner to an organization",
        message: `You've been added as a learner to the organization ${organization.name}. Click here to view: ${process.env.CLIENT_URL}/organizations/${organization.organizationId}`,
      },
    };

    if (!roleMapping[role]) {
      res.status(400).json({ message: "Invalid role specified" });
      return;
    }

    const { list, title, message } = roleMapping[role];

    if (user) {
      // Check if user is already in the list
      if (!list.some((u) => u.userId === user?.id)) {
        list.push({ userId: user.id });
        
        await sendMessage(
          user.id, 
          user.emailAddresses[0].emailAddress, 
          title, 
          message, 
          `/organizations/${organization.organizationId}/dashboard`,
          { sendEmail: true, sendNotification: true, rateLimited: false }
        );
        
        if (role === 'admin') {
          const userName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.emailAddresses[0].emailAddress;
            
          for (const admin of organization.admins) {
            if (admin.userId === user.id) continue;
            
            try {
              const adminUser = await clerkClient.users.getUser(admin.userId);
              const adminEmail = adminUser.emailAddresses && adminUser.emailAddresses.length > 0
                ? adminUser.emailAddresses[0].emailAddress
                : null;
                
              if (adminEmail) {
                await sendMessage(
                  admin.userId,
                  adminEmail,
                  "New Admin Added to Organization",
                  `${userName} has been added as an admin to your organization ${organization.name}.`,
                  `/organizations/${organization.organizationId}/settings/members`,
                  { sendEmail: true, sendNotification: true, rateLimited: true }
                );
              }
            } catch (error) {
              console.error(`Error notifying admin ${admin.userId}:`, error);
            }
          }
        }
      }
    } else {
      user = await clerkClient.users.createUser({
        emailAddress: [email],
        password: generateTemporaryPassword(),
        skipPasswordChecks: true,
      });

      list.push({ userId: user.id });

      const resetPasswordLink = `${process.env.CLIENT_URL}/reset-password?email=${encodeURIComponent(email)}`;

      await sendMessage(
        user.id,
        email,
        "You're invited to join an organization - Reset Your Password",
        `You've been invited to join the organization ${organization.name}. Click the link below to reset your password and activate your account:\n\n${resetPasswordLink}\n\nIf you did not request this, you can ignore this email.`,
        null,
        { sendEmail: true, sendNotification: false, rateLimited: false }
      );
      
      if (role === 'admin' && organization.admins.length > 0) {
        for (const admin of organization.admins) {
          try {
            const adminUser = await clerkClient.users.getUser(admin.userId);
            const adminEmail = adminUser.emailAddresses && adminUser.emailAddresses.length > 0
              ? adminUser.emailAddresses[0].emailAddress
              : null;
              
            if (adminEmail) {
              await sendMessage(
                admin.userId,
                adminEmail,
                "New Admin Added to Organization",
                `${email} has been invited as an admin to your organization ${organization.name}.`,
                `/organizations/${organization.organizationId}/settings/members`,
                { sendEmail: true, sendNotification: true, rateLimited: true }
              );
            }
          } catch (error) {
            console.error(`Error notifying admin ${admin.userId}:`, error);
          }
        }
      }
    }

    await organization.save();
    res.json({ message: "User invitation processed successfully", data: organization });
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).json({ message: "Error inviting user to organization", error });
  }
};

function generateTemporaryPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export const getOrganizationUsers = async (req: Request, res: Response): Promise<void> => {
  const { organizationId } = req.params;

  console.log("Fetching users for org:", organizationId);
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