import express from "express";
import { getUser, updateUser, getUsers, getCourseUsers, promoteUser, demoteUser, deleteUser } from "../controllers/userClerkController";

const router = express.Router();

router.get("/:userId", getUser);
router.put("/:userId", updateUser);
router.delete("/:userId", deleteUser);
router.put("/:userId/promote", promoteUser);
router.put("/:userId/demote", demoteUser);
router.get("/", getUsers);
router.get("/course/:courseId", getCourseUsers);

export default router;