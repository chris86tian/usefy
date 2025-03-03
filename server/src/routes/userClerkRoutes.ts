import express from "express";
import { getUser, updateUser, getUsers, getCourseUsers, deleteUser } from "../controllers/userClerkController";

const router = express.Router();

router.get("/:userId", getUser);
router.put("/:userId", updateUser);
router.delete("/:userId", deleteUser);
router.get("/", getUsers);
router.get("/course/:courseId", getCourseUsers);

export default router;