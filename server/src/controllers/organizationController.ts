import { Request, Response } from "express";
import Organization from "../models/organizationModel";
import Course from "../models/courseModel";
import{ v4 as uuidv4 }from "uuid";
import { getAuth } from "@clerk/express";

export const getOrganization = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    try {
        const organization = await Organization.query("organizationId").eq(organizationId).exec();
        res.json({ message: "Organization retrieved successfully", data: organization });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving organization", error });
    }
}

export const listOrganizations = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizations = await Organization.scan().exec();
        res.json({ message: "Organizations retrieved successfully", data: organizations });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving organizations", error });
    }
}

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
    const { name, description } = req.body;
    const auth = getAuth(req);

    console.log("auth", auth);
    console.log("req.body", req.body);

    try {
        const organization = new Organization({
            organizationId: uuidv4(),
            name,
            description,
            admins: [{ userId: auth.userId }],
            instructors: [],
            learners: [],
            courses: [],
        });
        await organization.save();
        res.json({ message: "Organization created successfully", data: organization });
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Error creating organization", error });
    }
}

export const deleteOrganization = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    try {
        await Organization.delete(organizationId);
        res.json({ message: "Organization deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting organization", error });
    }
}

export const joinOrganization = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const auth = getAuth(req);
    try {
        const organization = await Organization.query("organizationId").eq(organizationId).exec();
        if (!organization || organization.length === 0) {
            res.status(404).json({ message: "Organization not found" });
            return;
        }
        organization[0].learners.push({ userId: auth.userId });
        await organization[0].save();
        res.json({ message: "Organization joined successfully", data: organization[0] });
    } catch (error) {
        res.status(500).json({ message: "Error joining organization", error });
    }
}

export const getMyOrganizations = async (req: Request, res: Response): Promise<void> => {
    const auth = getAuth(req);

    try {
        const allOrganizations = await Organization.scan().exec();

        const userOrganizations = allOrganizations.filter(org =>
            org.admins?.some((admin: { userId: string; }) => admin.userId === auth.userId) ||
            org.instructors?.some((instructor: { userId: string; }) => instructor.userId === auth.userId) ||
            org.learners?.some((learner: { userId: string; }) => learner.userId === auth.userId)
        );

        res.json({ message: "Organizations retrieved successfully", data: userOrganizations });
    } catch (error) {
        console.error("Error retrieving organizations:", error);
        res.status(500).json({ message: "Error retrieving organizations", error });
    }
};

export const getOrganizationCourses = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;

    try {
        const organization = await Organization.query("organizationId").eq(organizationId).exec();
        const orgData = organization?.[0];

        if (!orgData) {
            res.status(404).json({ message: "Organization not found" }); 
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
        res.status(500).json({ message: "Error retrieving courses", error }); 
        return;
    }
};

