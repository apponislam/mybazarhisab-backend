import { Router } from "express";
import auth from "../../middlewares/auth";
import { activityControllers } from "./activity.controllers";

const router = Router();

router.get("/", auth, activityControllers.getAllActivities);

export const activityRoutes = router;
