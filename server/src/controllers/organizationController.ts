import { Request, Response } from "express";
import Organization from "../models/organizationModel";

export const getOrganization = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    try {
        const organization = await Organization.scan("organizationId").eq(organizationId).exec();
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
    const { organizationId, name, description, admins, instructors, learners } = req.body;
    try {
        const organization = new Organization({
            organizationId,
            name,
            description,
            admins,
            instructors,
            learners,
        });
        await organization.save();
        res.json({ message: "Organization created successfully", data: organization });
    } catch (error) {
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