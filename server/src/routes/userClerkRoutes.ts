import express from "express";
import { updateUser, getUsers } from "../controllers/userClerkController";

const router = express.Router();

router.put("/:userId", updateUser);
router.get("/", getUsers);


export default router;