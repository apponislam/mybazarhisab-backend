import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { feedbackControllers } from "./feedback.controllers";

const router = Router();

// Submit app feedback / bug report
router.post("/", auth, feedbackControllers.createFeedback);

// Get user's own feedback list (or all feedback list for admin)
router.get("/", auth, feedbackControllers.getAllFeedbacks);

// Admin status update & admin note
router.patch("/:id/status", auth, authorize(["ADMIN"]), feedbackControllers.updateFeedbackStatus);

// Soft delete feedback
router.delete("/:id", auth, feedbackControllers.deleteFeedback);

export const feedbackRoutes = router;
