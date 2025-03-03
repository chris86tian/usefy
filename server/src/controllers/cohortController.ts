import { Request, Response } from "express";
import Cohort from "../models/cohortModel";

export const createCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId, name } = req.body;
    const organizationId = req.params.organizationId;

    try {
        const cohort = new Cohort({
            cohortId,
            name,
            organizationId,
            instructors: [],
            learners: [],
            courses: [],
        });
        await cohort.save();
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