import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notificationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/", requireAuth(), getNotifications);
router.put("/:notificationId", requireAuth(), markNotificationAsRead);

export default router;
