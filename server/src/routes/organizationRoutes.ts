import { Router } from "express";
import {
    getOrganization,
    listOrganizations,
    createOrganization,
    deleteOrganization,
    joinOrganization,
    getMyOrganizations,
    getOrganizationCourses
} from "../controllers/organizationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/my", requireAuth(), getMyOrganizations);
router.get("/", listOrganizations);
router.get("/:organizationId", getOrganization);
router.post("/", requireAuth(), requireAuth(), createOrganization);
router.delete("/:organizationId", requireAuth(), deleteOrganization);
router.post("/:organizationId/join", requireAuth(), joinOrganization);
router.get("/:organizationId/courses", requireAuth(), getOrganizationCourses);

export default router;
