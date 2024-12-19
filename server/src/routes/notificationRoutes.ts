import { Router } from "express";
import {
  listNotifications,
  createNotification,
} from "../controllers/notificationController";

const router = Router();

router.get("/", listNotifications);
router.post("/", createNotification);

export default router;
