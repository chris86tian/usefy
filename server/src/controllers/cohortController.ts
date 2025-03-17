import { Request, Response } from "express";
import Cohort from "../models/cohortModel";
import Course from "../models/courseModel";
import Organization from "../models/organizationModel";
import { clerkClient } from "..";
import { getAuth, User } from "@clerk/express";
import { sendMessage } from "../utils/utils";

export const createCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId, name } = req.body;
    const organizationId = req.params.organizationId;

    try {
        const existingCohort = await Cohort.get(cohortId);
        if (existingCohort) {
            res.status(400).json({ message: "Cohort already exists" });
            return;
        }

        const cohort = new Cohort({
            cohortId,
            name,
            organizationId,
            instructors: [],
            learners: [],
            courses: [],
        });
        await cohort.save();

        const organization = await Organization.get(organizationId);
        if (organization) {
            const admins = organization.admins || [];
            
            for (const admin of admins) {
                try {
                    const clerkUser = await clerkClient.users.getUser(admin.userId);
                    const userEmail = clerkUser.emailAddresses[0].emailAddress
                    
                    if (userEmail) {
                        await sendMessage(
                            admin.userId,
                            userEmail,
                            `Cohort ${name} created`, 
                            `A new cohort ${name} has been created in your organization ${organization.name}`,
                            `/organizations/${organizationId}/cohorts/${cohortId}`,
                            { sendEmail: true, sendNotification: true, rateLimited: true }
                        );
                    } else {
                        console.warn(`No email found for user ${admin.userId}`);
                    }
                } catch (error) {
                    console.error(`Error sending message to user ${admin.userId}:`, error);
                }
            }
        }
        res.json({ message: "Cohort created successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error creating cohort", error });
    }
};

export const getCohorts = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.params.organizationId;
    try {
        const cohorts = await Cohort.scan("organizationId").eq(organizationId).exec();
        res.json({ message: "Cohorts retrieved successfully", data: cohorts });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving cohorts", error });
    }
};

export const getCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        res.json({ message: "Cohort retrieved successfully", data: cohort });
    } catch (error) {
        console.error("Error retrieving cohort:", error);
        res.status(500).json({ message: "Error retrieving cohort", error });
    }
};

export const deleteCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        await Cohort.delete(cohortId);
        res.json({ message: "Cohort deleted successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error deleting cohort", error });
    }
};

export const updateCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { name } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        cohort.name = name;
        await cohort.save();
        res.json({ message: "Cohort updated successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error updating cohort", error });
    }
};

export const getCohortLearners = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        
        if (!cohort.learners || cohort.learners.length === 0) {
            res.json({ message: "No learners in this cohort", data: [] });
            return;
        }

        const learners = await Promise.all(
            cohort.learners.map(async (learner: any) => {
                try {
                    return await clerkClient.users.getUser(learner.userId);
                } catch (error) {
                    console.error(`Error fetching user ${learner.userId}:`, error);
                    return null;
                }
            })
        );
        
        res.json({ message: "Cohort learners retrieved successfully", data: learners });
    } catch (error) {
        console.error("Error retrieving cohort learners:", error);
        res.status(500).json({ message: "Error retrieving cohort learners", error });
    }
}; 

export const addLearnerToCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { learnerId } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }

        if (cohort.learners.some((learner: any) => learner.userId === learnerId)) {
            res.status(400).json({ message: "Learner is already in the cohort" });
            return;
        }

        cohort.learners.push({ userId: learnerId });
        await cohort.save();

        const organization = await Organization.get(cohort.organizationId);
        if (organization) {
            const admins = organization.admins || [];
            const learners = cohort.learners || [];
            const allUsers = [...admins, ...learners];
            for (const user of allUsers) {
                try {
                    const clerkUser = await clerkClient.users.getUser(user.userId);
                    const userEmail = clerkUser.emailAddresses[0].emailAddress
                    
                    if (userEmail) {
                        await sendMessage(
                            user.userId,
                            userEmail,
                            `Learner added to cohort ${cohort.name}`, 
                            `A new learner has been added to cohort ${cohort.name}`,
                            `/organizations/${organization.organizationId}/cohorts/${cohort.cohortId}`,
                            { sendEmail: true, sendNotification: true, rateLimited: true }
                        );
                    } else {
                        console.warn(`No email found for user ${user.userId}`);
                    }
                } catch (error) {
                    console.error(`Error sending message to user ${user.userId}:`, error);
                }
            }
        }
        res.json({ message: "Learner added to cohort successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error adding learner to cohort", error });
    }
};

export const removeLearnerFromCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { learnerId } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }

        if (!cohort.learners.some((learner: any) => learner.userId === learnerId)) {
            res.status(400).json({ message: "Learner is not in the cohort" });
            return;
        }

        cohort.learners = cohort.learners.filter((learner: any) => learner.userId !== learnerId);
        await cohort.save();

        const organization = await Organization.get(cohort.organizationId);
        if (organization) {
            const admins = organization.admins || [];
            const learners = cohort.learners || [];
            const allUsers = [...admins, ...learners];
            for (const user of allUsers) {
                try {
                    const clerkUser = await clerkClient.users.getUser(user.userId);
                    const userEmail = clerkUser.emailAddresses[0].emailAddress

                    if (userEmail) {
                        await sendMessage(
                            user.userId,
                            userEmail,
                            `Learner removed from cohort ${cohort.name}.`, 
                            `A learner has been removed from cohort ${cohort.name}`,
                            `/organizations/${organization.organizationId}/cohorts/${cohort.cohortId}`,
                            { sendEmail: true, sendNotification: true, rateLimited: true }
                        );
                    } else {
                        console.warn(`No email found for user ${user.userId}`);
                    }
                } catch (error) {
                    console.error(`Error sending message to user ${user.userId}:`, error);
                }
            }
        }
        res.json({ message: "Learner removed from cohort successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error removing learner from cohort", error });
    }
};

export const getCohortCourses = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }

        const courses = await Promise.all(
            cohort.courses.map(async (course: any) => {
                const courseData = await Course.get(course.courseId);
                return courseData;
            })
        );
        res.json({ message: "Cohort courses retrieved successfully", data: courses });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving cohort courses", error });
    }
};
    

export const addCourseToCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { courseId } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }

        if (cohort.courses.some((course: any) => course.courseId === courseId)) {
            res.status(400).json({ message: "Course is already in the cohort" });
            return;
        }

        cohort.courses.push({ courseId });
        await cohort.save();

        const course = await Course.get(courseId);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        const organization = await Organization.get(cohort.organizationId);
        if (organization) {
            const admins = organization.admins || [];
            const learners = cohort.learners || [];
            const instructors = course.instructors || [];
            const allUsers = [...admins, ...learners, ...instructors];
            for (const user of allUsers) {
                try {
                    const clerkUser = await clerkClient.users.getUser(user.userId);
                    const userEmail = clerkUser.emailAddresses[0].emailAddress
                    
                    if (userEmail) {
                        await sendMessage(
                            user.userId,
                            userEmail,
                            `Course added to cohort ${cohort.name}`, 
                            `A new course has been added to cohort ${cohort.name}`,
                            `/organizations/${organization.organizationId}/cohorts/${cohort.cohortId}`,
                            { sendEmail: true, sendNotification: true, rateLimited: true }
                        );
                    } else {
                        console.warn(`No email found for user ${user.userId}`);
                    }
                } catch (error) {
                    console.error(`Error sending message to user ${user.userId}:`, error);
                }
            }
        }
        res.json({ message: "Course added to cohort successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error adding course to cohort", error });
    }
};

export const removeCourseFromCohort = async (req: Request, res: Response): Promise<void> => {
    const { courseId , cohortId } = req.body;
    
    try {
        const cohort = await Cohort.get(cohortId);
        
        if (!cohort || cohort.length === 0) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }

        const course = await Course.get(courseId);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        if (!cohort.courses.some((c: any) => c.courseId === courseId)) {
            res.status(400).json({ message: "Course is not in the cohort" });
            return;
        }

        cohort.courses = cohort.courses.filter((c: any) => c.courseId !== courseId);
        await cohort.save();

        res.json({ message: "Course removed from cohort successfully", data: cohort[0] });
    } catch (error) {
        console.error("Error removing course from cohort:", error);
        res.status(500).json({ message: "Error removing course from cohort", error });
    }
};

