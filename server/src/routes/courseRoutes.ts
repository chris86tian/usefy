import express from "express";
import multer from "multer";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
  getUploadVideoUrl,
  getUploadImageUrl,
} from "../controllers/courseController";
import { requireAuth } from "@clerk/express";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", listCourses);
router.post("/", requireAuth(), createCourse);

router.get("/:courseId", getCourse);
router.put("/:courseId", requireAuth(), upload.single("image"), updateCourse);
router.delete("/:courseId", requireAuth(), deleteCourse);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/get-upload-url",
  requireAuth(),
  getUploadVideoUrl
);

router.post("/:courseId/get-upload-image-url", requireAuth(), getUploadImageUrl);

export default router;
