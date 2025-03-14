import { Router } from "express";
import {
  listNotifications,
  markNotificationAsRead,
} from "../controllers/notificationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/", requireAuth(), listNotifications);
router.put("/:notificationId", requireAuth(), markNotificationAsRead);

export default router;
