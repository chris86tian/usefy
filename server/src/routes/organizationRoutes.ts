import { Router } from "express";
import {
    getOrganization,
    listOrganizations,
    createOrganization,
    deleteOrganization,
    getCoursesByOrganization,
    joinOrganization,
    getMyOrganizations,
} from "../controllers/organizationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/my", requireAuth(), getMyOrganizations);
router.get("/", listOrganizations);
router.get("/:organizationId", getOrganization);
router.post("/", requireAuth(), requireAuth(), createOrganization);
router.delete("/:organizationId", requireAuth(), deleteOrganization);
router.get("/:organizationId/courses", getCoursesByOrganization);
router.post("/:organizationId/join", requireAuth(), joinOrganization);

export default router;
