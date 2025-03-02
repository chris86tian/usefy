import { Router } from "express";
import {
    getOrganization,
    listOrganizations,
    createOrganization,
    deleteOrganization,
    joinOrganization,
    getMyOrganizations,
    getOrganizationCourses,
    addCourseToOrganization,
    removeCourseFromOrganization,
} from "../controllers/organizationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/my", requireAuth(), getMyOrganizations);
router.get("/", listOrganizations);
router.get("/:organizationId", getOrganization);
router.post("/", requireAuth(), createOrganization);
router.delete("/:organizationId", requireAuth(), deleteOrganization);
router.post("/:organizationId/join", requireAuth(), joinOrganization);
router.get("/:organizationId/courses", getOrganizationCourses);
router.post("/:organizationId/:courseId", requireAuth(), addCourseToOrganization);
router.delete("/:organizationId/:courseId", requireAuth(), removeCourseFromOrganization);

export default router;
