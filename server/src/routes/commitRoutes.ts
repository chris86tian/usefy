import { Router } from "express";
import {
    getCommits,
    getCommitsByDate,
} from "../controllers/commitController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/", requireAuth(), getCommits);

// get user commits by date
router.get("/:date/:userId", requireAuth(), getCommitsByDate);

export default router;
