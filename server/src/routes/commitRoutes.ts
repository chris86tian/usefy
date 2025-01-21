import { Router } from "express";
import {
    getCommits,
} from "../controllers/commitController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/:userId", requireAuth(), getCommits);

export default router;
