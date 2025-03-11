import { Router } from "express";
import {
  getOrganization,
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  joinOrganization,
  getMyOrganizations,
  getOrganizationCourses,
  getMyOrganizationCourses,
  getMyUserCourseProgresses,
  addCourseToOrganization,
  removeCourseFromOrganization,
  inviteUserToOrganization,
  inviteUserToCohort,
  getOrganizationUsers,
  removeUserFromOrganization,
  changeUserRole,
} from "../controllers/organizationController";
import { requireAuth } from "@clerk/express";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/my", requireAuth(), getMyOrganizations);
router.get("/", listOrganizations);
router.get("/:organizationId", getOrganization);
router.post("/", requireAuth(), createOrganization);
router.put("/:organizationId", requireAuth(), upload.any(), updateOrganization);
router.delete("/:organizationId", requireAuth(), deleteOrganization);
router.post("/:organizationId/join", requireAuth(), joinOrganization);
router.get("/:organizationId/courses", getOrganizationCourses);
router.get("/:organizationId/my-courses", requireAuth(), getMyOrganizationCourses);
router.get("/:organizationId/progresses", requireAuth(), getMyUserCourseProgresses);
router.post("/:organizationId/invite", requireAuth(), inviteUserToOrganization);
router.post("/:organizationId/cohort/:cohortId/invite", requireAuth(), inviteUserToCohort);
router.post(
  "/:organizationId/:courseId",
  requireAuth(),
  addCourseToOrganization
);
router.delete(
  "/:organizationId/:courseId",
  requireAuth(),
  removeCourseFromOrganization
);
router.get("/:organizationId/users", requireAuth(), getOrganizationUsers);
router.delete(
  "/:organizationId/remove/:userId",
  requireAuth(),
  removeUserFromOrganization
);
router.put(
  "/:organizationId/change-role/:userId",
  requireAuth(),
  changeUserRole
);

export default router;
