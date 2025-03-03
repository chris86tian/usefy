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
  addCourseToOrganization,
  removeCourseFromOrganization,
  inviteUserToOrganization,
  getOrganizationUsers,
  removeUserFromOrganization,
  changeUserRole,
} from "../controllers/organizationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/my", requireAuth(), getMyOrganizations);
router.get("/", listOrganizations);
router.get("/:organizationId", getOrganization);
router.post("/", requireAuth(), createOrganization);
router.put("/:organizationId", requireAuth(), updateOrganization);
router.delete("/:organizationId", requireAuth(), deleteOrganization);
router.post("/:organizationId/join", requireAuth(), joinOrganization);
router.get("/:organizationId/courses", getOrganizationCourses);
router.post("/:organizationId/invite", requireAuth(), inviteUserToOrganization);
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
