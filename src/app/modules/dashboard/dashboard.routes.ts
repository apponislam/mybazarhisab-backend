import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { dashboardControllers } from "./dashboard.controllers";

const router = Router();

// Admin
router.get("/admin-stats", auth, authorize(["ADMIN"]), dashboardControllers.getAdminDashboardStats);

// User 
router.get("/user-stats", auth, dashboardControllers.getUserDashboardStats);
router.get("/monthly-trend", auth, dashboardControllers.getMonthlyExpenseTrend);

export const dashboardRoutes = router;
