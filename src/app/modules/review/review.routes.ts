import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../config";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import catchAsync from "../../../utils/catchAsync";
import { UserModel } from "../auth/auth.model";
import { reviewControllers } from "./review.controllers";

const router = Router();

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
            // Silently swallow errors for public optional routes
        }
    }
    next();
});

router.post("/", auth, reviewControllers.createReview);
router.get("/summary", reviewControllers.getReviewSummaryStats);
router.get("/", authOptional, reviewControllers.getAllReviews);
router.patch("/:id/toggle-public", auth, authorize(["ADMIN"]), reviewControllers.toggleReviewVisibility);
router.delete("/:id", auth, reviewControllers.deleteReview);

export const reviewRoutes = router;
