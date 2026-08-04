import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { userControllers } from "./user.controllers";

const router = Router();

// All routes require ADMIN role
router.use(auth, authorize(["ADMIN"]));

router.get("/", userControllers.getAllUsers);
router.get("/:id", userControllers.getUserProfileAndSummary);
router.get("/:id/reviews", userControllers.getUserReviews);
router.get("/:id/activities", userControllers.getUserActivities);
router.get("/:id/products", userControllers.getUserProducts);
router.get("/:id/bazar-entries", userControllers.getUserBazarEntries);
router.get("/:id/bills", userControllers.getUserBills);

router.patch("/:id/status", userControllers.updateUserStatus);
router.patch("/:id/role", userControllers.updateUserRole);
router.delete("/:id", userControllers.deleteUser);

export const userRoutes = router;
