import { Router } from "express";
import auth from "../../middlewares/auth";
import checkAuth from "../../middlewares/checkAuth";
import authorize from "../../middlewares/authorized";
import { reviewControllers } from "./review.controllers";

const router = Router();

router.post("/", auth, reviewControllers.createReview);
router.get("/summary", reviewControllers.getReviewSummaryStats);
router.get("/me", auth, reviewControllers.getMyReview);
router.get("/", checkAuth, reviewControllers.getAllReviews);
router.patch("/:id/toggle-public", auth, authorize(["ADMIN"]), reviewControllers.toggleReviewVisibility);
router.delete("/:id", auth, reviewControllers.deleteReview);

export const reviewRoutes = router;
