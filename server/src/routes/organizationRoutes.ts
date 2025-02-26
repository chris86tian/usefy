import { Router } from "express";
import {
    getOrganization,
    listOrganizations,
    createOrganization,
    deleteOrganization,
} from "../controllers/organizationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/", listOrganizations);
router.get("/:organizationId", requireAuth(), getOrganization);
router.post("/", requireAuth(), requireAuth(), createOrganization);
router.delete("/:organizationId", requireAuth(), deleteOrganization);

export default router;
