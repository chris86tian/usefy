import { Router } from "express";
import {
    createCohort,
    getCohorts,
    getCohort,
    updateCohort,
    deleteCohort,
    getCohortLearners,
    addLearnerToCohort,
    removeLearnerFromCohort,
    getCohortCourses,
    addCourseToCohort,
    removeCourseFromCohort,
} from "../controllers/cohortController";
import { requireAuth } from "@clerk/express";

const router = Router();

router.post("/:organizationId", requireAuth(), createCohort);
router.get("/:organizationId", getCohorts);
router.get("/:organizationId/:cohortId", getCohort);
router.put("/:organizationId/:cohortId", requireAuth(), updateCohort);
router.delete("/:organizationId/:cohortId", requireAuth(), deleteCohort);
router.get("/:organizationId/:cohortId/learners", getCohortLearners);
router.post("/:organizationId/:cohortId/add-learner", addLearnerToCohort);
router.delete("/:organizationId/remove-learner/:cohortId", removeLearnerFromCohort);
router.get("/:organizationId/:cohortId/courses", getCohortCourses);
router.post("/:organizationId/:cohortId/add-course", addCourseToCohort);
router.post("/:organizationId/:cohortId/remove-course", removeCourseFromCohort);

export default router;
