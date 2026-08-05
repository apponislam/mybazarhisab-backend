import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { IReview } from "./review.interface";
import { ReviewModel } from "./review.model";

const createReview = async (userId: string, data: Partial<IReview>) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const existingReview = await ReviewModel.findOne({
        user: userObjectId,
        isDeleted: false,
    });

    if (existingReview) {
        // Second time / update: update comment only (preserve original rating)
        existingReview.comment = data.comment || existingReview.comment;
        await existingReview.save();
        return existingReview;
    }

    // First time: create review with rating and comment
    return await ReviewModel.create({
        ...data,
        user: userObjectId,
    });
};

const getAllReviews = async (isAdmin: boolean, query: { isPublic?: string; page?: string; limit?: string }) => {
    const { isPublic, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };

    if (!isAdmin) {
        filter.isPublic = true;
    } else if (isPublic !== undefined) {
        filter.isPublic = isPublic === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);
    const reviews = await ReviewModel.find(filter).populate("user", "name email phone profileImage").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    const total = await ReviewModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: reviews,
    };
};

const getReviewSummaryStats = async () => {
    const filter = { isPublic: true, isDeleted: false };
    const reviews = await ReviewModel.find(filter);

    const totalReviews = reviews.length;
    let totalRatingSum = 0;
    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
        totalRatingSum += r.rating;
        const roundedStar = Math.min(5, Math.max(1, Math.round(r.rating)));
        ratingBreakdown[roundedStar] = (ratingBreakdown[roundedStar] || 0) + 1;
    });

    const averageRating = totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(1)) : 0.0;

    return {
        averageRating,
        totalReviews,
        ratingBreakdown,
    };
};

const toggleReviewVisibility = async (id: string) => {
    const review = await ReviewModel.findOne({ _id: id, isDeleted: false });
    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    review.isPublic = !review.isPublic;
    await review.save();

    return await ReviewModel.findById(review._id).populate("user", "name email phone profileImage");
};

const deleteReview = async (userId: string, isAdmin: boolean, id: string) => {
    const filter: any = { _id: id, isDeleted: false };
    if (!isAdmin) {
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    const review = await ReviewModel.findOneAndUpdate(filter, { $set: { isDeleted: true } }, { returnDocument: "after" });

    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found or not authorized");
    }

    return review;
};

const getMyReview = async (userId: string) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const review = await ReviewModel.findOne({
        user: userObjectId,
        isDeleted: false,
    }).populate("user", "name email phone profileImage");

    return {
        hasReviewed: !!review,
        canReview: !review,
        review: review || null,
    };
};

export const reviewServices = {
    createReview,
    getAllReviews,
    getReviewSummaryStats,
    getMyReview,
    toggleReviewVisibility,
    deleteReview,
};
