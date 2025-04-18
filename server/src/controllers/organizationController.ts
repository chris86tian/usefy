import { Request, Response } from "express";
import Organization from "../models/organizationModel";
import { getAuth, User } from "@clerk/express";
import { clerkClient } from "..";
import Cohort from "../models/cohortModel";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import { generateStyledHtml, generateTemporaryPassword, sendMessage } from "../utils/utils";

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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

export const getOrganizations = async (
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

  const isSuperadmin = await clerkClient.users
    .getUser(auth.userId as string)
    .then((user) => user.publicMetadata.userType === "superadmin");

  if (!isSuperadmin) {
    res.status(403).json({ message: "Unauthorized to create organization" });
    return;
  } 

  try {
    const existingOrganization = await Organization.get(organizationId);
    if (existingOrganization) {
      res.status(400).json({ message: "Organization already exists" });
      return;
    }

    const organization = new Organization({
      organizationId,
      name,
      description,
      image,
      cohorts: [],
      admins: [
        { userId: auth.userId },
      ],
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
    res.status(500).json({ message: "Error creating organization", error });
  }
};

export const updateOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const { name, description, image } = req.body;

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    organization.name = name;
    organization.description = description;
    organization.image = image;
    await organization.save();
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
  const auth = getAuth(req);
  const user = await clerkClient.users.getUser(auth.userId as string);

  if (user.publicMetadata.userType !== "superadmin") {
    res.status(403).json({ message: "Unauthorized to delete organization" });
    return;
  }

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

export const leaveOrganization = async (
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

    organization[0].learners = organization[0].learners.filter(
      (learner: { userId: string }) => learner.userId !== auth.userId
    );
    await organization[0].save();
    res.json({
      message: "You have left the organization",
      data: organization[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error leaving organization", error });
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
    const organization = await Organization.get(organizationId);

    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const cohorts = await Cohort.scan()
      .where("organizationId")
      .eq(organizationId)
      .exec();

    if (!cohorts || cohorts.length === 0) {
      res.json({ message: "No cohorts found for this organization", data: [] });
      return;
    }

    const courseIds = cohorts.flatMap((cohort: any) =>
      cohort.courses.map((course: { courseId: string }) => course.courseId)
    );

    if (courseIds.length === 0) {
      res.json({ message: "No courses found in any cohort", data: [] });
      return;
    }

    const courses = await Course.batchGet(
      courseIds.map((courseId: string) => ({ courseId }))
    );

    res.json({ message: "Courses retrieved successfully", data: courses });
  } catch (error) {
    console.error(
      `Error retrieving courses for organization ${organizationId}:`,
      error
    );
    res.json({ message: "Error retrieving courses", data: [], error });
    return;
  }
};

export const getMyUserCourseProgresses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);
  const { organizationId } = req.params;

  try {
    const cohorts = await Cohort.scan()
      .where("organizationId")
      .eq(organizationId)
      .exec();

    if (!cohorts || cohorts.length === 0) {
      res.json({ message: "No cohorts found for this organization", data: [] });
      return;
    }

    const courseIds = cohorts.flatMap((cohort: any) =>
      cohort.courses.map((course: { courseId: string }) => course.courseId)
    );

    if (courseIds.length === 0) {
      res.json({ message: "No courses found in any cohort", data: [] });
      return;
    }

    const courses = await Course.batchGet(
      courseIds.map((courseId: string) => ({ courseId }))
    );

    const userCourses = courses.filter((course) =>
      course.enrollments?.some(
        (enrollment: any) => enrollment.userId === userId
      )
    );

    const enrolledCourseIds = userCourses.map((course) => course.courseId);

    if (enrolledCourseIds.length === 0) {
      res.json({ message: "No enrolled courses found", data: [] });
      return;
    }

    const progressKeys = enrolledCourseIds.map((courseId) => ({
      userId: String(userId),
      courseId: String(courseId),
    }));

    const progresses = await UserCourseProgress.batchGet(progressKeys);

    res.json({
      message: "Course progresses retrieved successfully",
      data: progresses,
    });
  } catch (error) {
    console.error("Error retrieving course progresses:", error);
    res
      .status(500)
      .json({ message: "Error retrieving course progresses", error });
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

export const removeCourseFromOrganization = async (
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

    const courseIndex = organization.courses.findIndex(
      (course: { courseId: string }) => course.courseId === courseId
    );
    if (courseIndex !== -1) {
      organization.courses.splice(courseIndex, 1);
    }

    organization.cohorts = organization.cohorts || [];
    organization.cohorts.forEach(async (cohort: { cohortId: string }) => {
      const cohortData = await Cohort.get(cohort.cohortId);
      if (cohortData) {
        cohortData.courses = cohortData.courses || [];
        const courseIndex = cohortData.courses.findIndex(
          (course: { courseId: string }) => course.courseId === courseId
        );
        if (courseIndex !== -1) {
          cohortData.courses.splice(courseIndex, 1);
          await cohortData.save();
        }
      }
    });

    await Course.delete(courseId);

    await organization.save();
    res.json({
      message: "Course removed from organization successfully",
      data: organization,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing course from organization", error });
  }
};

export const inviteUserToOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const { role, email } = req.body;

  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });
    let user = users.totalCount > 0 ? users.data[0] : null;

    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const roleMapping: Record<
      string,
      { list: any[]; title: string; message: string }
    > = {
      admin: {
        list: organization.admins,
        title: "You've been added as an admin to an organization",
        message: `You've been added as an admin to the organization ${organization.name}. You can now manage users, courses, and settings.`,
      },
      instructor: {
        list: organization.instructors,
        title: "You've been added as an instructor to an organization", 
        message: `You've been added as an instructor to the organization ${organization.name}. You can now create and manage courses.`,
      },
      learner: {
        list: organization.learners,
        title: "You've been added as a learner to an organization",
        message: `You've been added as a learner to the organization ${organization.name}. You can start learning now!`,
      },
    };

    if (!roleMapping[role]) {
      res.status(400).json({ message: "Invalid role specified" });
      return;
    }

    const { list, title, message } = roleMapping[role];
    const link = `/organizations/${organization.organizationId}`;

    if (user) {
      if (list.some((u) => u.userId === user?.id)) {
        res
          .status(400)
          .json({ message: "User is already in the organization" });
        return;
      }
      list.push({ userId: user.id });
      await sendMessage(
        user.id,
        user.emailAddresses[0].emailAddress,
        title,
        message,
        `/organizations/${organization.organizationId}`,
        { 
          sendEmail: true, 
          sendNotification: true, 
          rateLimited: true,
          html: generateStyledHtml(
            `You've been invited to join ${organization.name} at usefy.com.<br><br>Organization Description: ${organization.description || ''}<br><br>Click the button below to view the organization.`,
            `/organizations/${organization.organizationId}`
          )
        }
      );
    } else {
      user = await clerkClient.users.createUser({
        emailAddress: [email],
        password: generateTemporaryPassword(),
        skipPasswordChecks: true,
      });

      list.push({ userId: user.id });

      const resetPasswordLink = `/reset-password?email=${encodeURIComponent(email)}/&organizationId=${organizationId}`;

      await sendMessage(
        user.id,
        email,
        "You're invited to join an organization - Reset Your Password",
        `You've been invited to join the organization ${organization.name} at usefy.com`,
        null,
        { 
          sendEmail: true, 
          sendNotification: false, 
          rateLimited: true,
          html: generateStyledHtml(
            `You've been invited to join the organization ${organization.name} at usefy.com.<br><br>Organization Description: ${organization.description || 'No description available'}<br><br>Click the button below to view the organization.`,
            resetPasswordLink
          )
        }
      );
    }

    await organization.save();
    res.json({
      message: "User invitation processed successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    res
      .status(500)
      .json({ message: "Error inviting user to organization", error });
  }
};

export const inviteUserToCohort = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId, cohortId } = req.params;
  const { email, role, name } = req.body;

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const cohort = await Cohort.get(cohortId);
    if (!cohort) {
      res.status(404).json({ message: "Cohort not found" });
      return;
    }

    const roleMapping: Record<string, any[]> = {
      learner: cohort.learners,
      instructor: cohort.instructors,
    };

    if (!roleMapping[role]) {
      res.status(400).json({ message: "Invalid role specified" });
      return;
    }

    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });
    let user = users.totalCount > 0 ? users.data[0] : null;

    if (user) {
      const userId = user.id;
      const list = roleMapping[role];

      if (list.some((u) => u.userId === userId)) {
        res.status(400).json({ message: "User is already in the cohort" });
        return;
      }

      list.push({ userId });

      const orgList = organization.admins.concat(
        organization.instructors,
        organization.learners
      );
      if (!orgList.some((m: any) => m.userId === userId)) {
        orgList.push({ userId });
      }

      await cohort.save();
      await organization.save();

      const message = `You've been added to the cohort ${cohort.name}. Click here to view: ${process.env.CLIENT_URL}/organizations/${organizationId}/cohorts/${cohortId}`;
      await sendMessage(
        userId,
        email,
        "You've been added to a cohort",
        message,
        null,
        { 
          sendEmail: true, 
          sendNotification: true, 
          rateLimited: true,
          html: generateStyledHtml(
            `You've been invited to join cohort ${cohort.name} in ${organization.name}.<br><br>Click the button below to view the cohort and the available courses.`,
            `/organizations/${organizationId}/cohorts/${cohortId}`
          )
        }
      );

      res.json({ message: "User added to cohort successfully", data: cohort });
      return;
    }

    let firstName = "";
    let lastName = "";

    if (name) {
      const nameParts = name.split(" ");
      firstName = capitalizeFirstLetter(nameParts[0] || "");
      lastName =
        nameParts.length > 1
          ? nameParts.slice(1).map(capitalizeFirstLetter).join(" ")
          : "";
    }

    const createUserParams: any = {
      emailAddress: [email],
      password: generateTemporaryPassword(),
      skipPasswordChecks: true,
    };

    if (firstName) createUserParams.firstName = firstName;
    if (lastName) createUserParams.lastName = lastName;

    user = await clerkClient.users.createUser(createUserParams);

    roleMapping[role].push({ userId: user.id });
    (role === "learner"
      ? organization.learners
      : organization.instructors
    ).push({ userId: user.id });

    await cohort.save();
    await organization.save();

    const resetPasswordLink = `${
      process.env.CLIENT_URL
    }/reset-password?email=${encodeURIComponent(
      email
    )}&firstName=${firstName}&lastName=${lastName}&organizationId=${organizationId}&cohortId=${cohortId}`;
    const emailSubject = `Hey, ${
      name || "there"
    }! You're invited to join a cohort - Reset Your Password`;
    const emailBody = `You've been invited to join the cohort ${cohort.name}. Click below to reset your password:\n\n${resetPasswordLink}`;

    await sendMessage(
      user.id,
      email,
      `You've been invited to join cohort ${cohort.name}`,
      `You've been invited to join cohort ${cohort.name} in ${organization.name}. Click below to view the cohort and the available courses.`,
      `/organizations/${organizationId}/cohorts/${cohortId}`,
      { 
        sendEmail: true, 
        sendNotification: true, 
        rateLimited: true,
        html: generateStyledHtml(
          `You've been invited to join cohort "${cohort.name}" in "${organization.name}".<br><br> Click the button below to view the cohort and the available courses.`,
          `/organizations/${organizationId}/cohorts/${cohortId}`
        )
      }
    );

    res.json({
      message: "User invitation processed successfully",
      data: cohort,
    });
  } catch (error) {
    console.error("Error inviting user to cohort:", error);
    res.status(500).json({ message: "Error inviting user to cohort", error });
  }
};

export const getOrganizationUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const { page = "1", limit = "10", role = "all", search = "" } = req.query;

  const pageNumber = Number.parseInt(page as string, 10);
  const limitNumber = Number.parseInt(limit as string, 10);

  try {
    const organization = await Organization.get(organizationId);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const adminIds = organization.admins.map((admin: any) => admin.userId);
    const instructorIds = organization.instructors.map(
      (instructor: any) => instructor.userId
    );
    const learnerIds = organization.learners.map(
      (learner: any) => learner.userId
    );

    let filteredUserIds: string[] = [];
    if (role === "admin") {
      filteredUserIds = adminIds;
    } else if (role === "instructor") {
      filteredUserIds = instructorIds;
    } else if (role === "learner") {
      filteredUserIds = learnerIds;
    } else {
      filteredUserIds = [...adminIds, ...instructorIds, ...learnerIds];
    }

    const clerkResponse = await clerkClient.users.getUserList({
      userId: filteredUserIds,
      limit: 500,
    });

    const allUsers = clerkResponse.data;
    const totalClerkUsers = clerkResponse.totalCount;

    const searchFilteredUsers = search
      ? allUsers.filter((user) => {
          const fullName = `${user.firstName || ""} ${
            user.lastName || ""
          }`.toLowerCase();
          const email =
            user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
          const searchLower = (search as string).toLowerCase();
          return fullName.includes(searchLower) || email.includes(searchLower);
        })
      : allUsers;

    const admins = searchFilteredUsers.filter((user) =>
      adminIds.includes(user.id)
    );
    const instructors = searchFilteredUsers.filter((user) =>
      instructorIds.includes(user.id)
    );
    const learners = searchFilteredUsers.filter((user) =>
      learnerIds.includes(user.id)
    );

    let totalUsers = 0;
    let usersToPage = [];

    if (role === "admin") {
      totalUsers = admins.length;
      usersToPage = admins;
    } else if (role === "instructor") {
      totalUsers = instructors.length;
      usersToPage = instructors;
    } else if (role === "learner") {
      totalUsers = learners.length;
      usersToPage = learners;
    } else {
      totalUsers = searchFilteredUsers.length;
      usersToPage = searchFilteredUsers;
    }

    const totalPages = Math.ceil(totalUsers / limitNumber);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = Math.min(startIndex + limitNumber, totalUsers);

    const paginatedUsers = usersToPage.slice(startIndex, endIndex);

    const response = {
      admins:
        role === "admin"
          ? paginatedUsers
          : role === "all"
          ? paginatedUsers.filter((user) => adminIds.includes(user.id))
          : [],
      instructors:
        role === "instructor"
          ? paginatedUsers
          : role === "all"
          ? paginatedUsers.filter((user) => instructorIds.includes(user.id))
          : [],
      learners:
        role === "learner"
          ? paginatedUsers
          : role === "all"
          ? paginatedUsers.filter((user) => learnerIds.includes(user.id))
          : [],
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
      message: "Organization users retrieved successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error retrieving organization users:", error);
    res
      .status(500)
      .json({ message: "Error retrieving organization users", error });
  }
};

export const removeUserFromOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        organization.admins = organization.admins.filter(
          (admin: { userId: string }) => admin.userId !== userId
        );
        break;
      case "instructor":
        organization.instructors = organization.instructors.filter(
          (instructor: { userId: string }) => instructor.userId !== userId
        );
        break;
      case "learner":
        organization.learners = organization.learners.filter(
          (learner: { userId: string }) => learner.userId !== userId
        );
        break;
      default:
        res.status(400).json({ message: "Invalid role specified" });
        return;
    }

    const cohorts = await Cohort.scan()
      .where("organizationId")
      .eq(organizationId)
      .exec();
    for (const cohort of cohorts) {
      cohort.learners = cohort.learners.filter(
        (learner: { userId: string }) => learner.userId !== userId
      );
      cohort.instructors = cohort.instructors.filter(
        (instructor: { userId: string }) => instructor.userId !== userId
      );
      await cohort.save();
    }

    await organization.save();
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses[0].emailAddress;

    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName} (${userEmail})`
      : userEmail;

    await sendMessage(
      userId,
      userEmail,
      `You've been removed from organization ${organization.name} at usefy.com`,
      `You've been removed from organization ${organization.name} at usefy.com.`,
      null,
      { 
        sendEmail: true, 
        sendNotification: true, 
        rateLimited: true,
        html: generateStyledHtml(
          `You've been removed from organization ${organization.name} at usefy.com.<br><br>If you believe this was a mistake, please contact the organization administrators.`,
          '/'
        )
      }
    );
    res.json({
      message: "User removed from organization and all cohorts successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Error removing user from organization:", error);
    res
      .status(500)
      .json({ message: "Error removing user from organization", error });
  }
};

export const changeUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const userIndex = roleArray.findIndex(
      (user: { userId: string }) => user.userId === userId
    );
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
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses[0].emailAddress;

    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName} (${userEmail})`
      : userEmail;

    await sendMessage(
      userId,
      userEmail,
      `Your role in ${organization.name} has been updated`,
      `Your role in ${organization.name} has been updated to ${newRole}.`,
      `/organizations/${organizationId}`,
      { 
        sendEmail: true, 
        sendNotification: true, 
        rateLimited: true,
        html: generateStyledHtml(
          `Your role in "${organization.name}" has been updated to ${newRole}.<br><br>Click the button below to view your organization.`,
          `/organizations/${organizationId}`
        )
      }
    );
    res.json({ message: "User role changed successfully", data: organization });
  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({ message: "Error changing user role", error });
  }
};
