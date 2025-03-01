import { Router } from "express";
import {
  listNotifications,
} from "../controllers/notificationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/", requireAuth(), listNotifications);

export default router;
