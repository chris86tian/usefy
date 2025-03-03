import { Router } from "express";
import {
    createCohort,
    getCohorts,
} from "../controllers/cohortController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.post("/:organizationId", requireAuth(), createCohort);
router.get("/:organizationId", getCohorts);

export default router;
