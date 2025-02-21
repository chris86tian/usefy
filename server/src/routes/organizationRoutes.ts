import { Router } from "express";
import {
    getOrganization,
    listOrganizations,
    createOrganization,
    deleteOrganization,
} from "../controllers/organizationController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/:organizationId", requireAuth(), getOrganization);
router.get("/", listOrganizations);
router.post("/", requireAuth(), createOrganization);
router.delete("/:organizationId", requireAuth(), deleteOrganization);

export default router;
