import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { activityControllers } from "./activity.controllers";

const router = Router();

router.get("/", auth, activityControllers.getAllActivities);

// Delete operations are restricted to ADMIN users only
router.delete("/", auth, authorize(["ADMIN"]), activityControllers.clearActivities);
router.delete("/:id", auth, authorize(["ADMIN"]), activityControllers.deleteActivity);

export const activityRoutes = router;
