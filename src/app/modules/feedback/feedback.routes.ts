import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../config";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import catchAsync from "../../../utils/catchAsync";
import { UserModel } from "../auth/auth.model";
import { feedbackControllers } from "./feedback.controllers";

const router = Router();

// Middleware to optionally authenticate a request to check roles (e.g. for landing page stats)
const authOptional = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;
    if (token?.startsWith("Bearer ")) token = token.slice(7);

    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwt_access_secret as string) as { _id: string; role?: string };
            const user = await UserModel.findOne({ _id: decoded._id, isDeleted: false });
            if (user && user.isActive && user.role === decoded.role) {
                req.user = user;
            }
        } catch (err) {
            // Silently swallow errors for public endpoints
        }
    }
    next();
});

// Submit a new feedback review (authenticated users)
router.post("/", auth, feedbackControllers.createFeedback);

// Get list of feedbacks (public gets public list, admins get full query list)
router.get("/", authOptional, feedbackControllers.getAllFeedbacks);

// Moderation: Approve or hide feedback (Admin secured)
router.patch("/:id/toggle-public", auth, authorize(["ADMIN"]), feedbackControllers.toggleFeedbackVisibility);

// Delete reviews (Admins can delete any, users can delete their own)
router.delete("/:id", auth, feedbackControllers.deleteFeedback);

export const feedbackRoutes = router;
