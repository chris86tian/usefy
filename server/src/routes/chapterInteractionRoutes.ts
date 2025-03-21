import { Router } from "express";
import {
    getChapterInteraction,
    toggleChapterDislike,
    toggleChapterLike,
    getChapterReactionCount
} from "../controllers/chapterInteractionController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/:chapterId", getChapterInteraction);
router.get("/:chapterId/reactions", getChapterReactionCount);
router.post("/:chapterId/like", requireAuth(), toggleChapterLike);
router.post("/:chapterId/dislike", requireAuth(), toggleChapterDislike);


export default router;
