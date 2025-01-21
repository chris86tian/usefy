import { Request, Response } from "express";
import Commit from "../models/commitModel";

export const getCommits = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
        const commits = await Commit.scan("userId").eq(userId).exec();
        res.json({ message: "Commits retrieved successfully", data: commits });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving commit", error });
    }
}