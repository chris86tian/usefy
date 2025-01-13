import express from "express";
import { updateUser, getUsers, getCourseUsers, promoteUser, demoteUser, deleteUser } from "../controllers/userClerkController";

const router = express.Router();

router.put("/:userId", updateUser);
router.get("/", getUsers);
router.get("/:courseId", getCourseUsers);
router.put("/:userId/promote", promoteUser);
router.put("/:userId/demote", demoteUser);
router.delete("/:userId", deleteUser);


export default router;