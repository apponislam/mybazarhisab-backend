import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { Feedback, TFeedbackStatus } from "./feedback.interface";
import { FeedbackModel } from "./feedback.model";

const createFeedback = async (userId: string, data: Partial<Feedback>) => {
    return await FeedbackModel.create({
        ...data,
        user: new mongoose.Types.ObjectId(userId),
    });
};

const getAllFeedbacks = async (
    userId: string,
    isAdmin: boolean,
    query: { category?: string; status?: string; page?: string; limit?: string }
) => {
    const { category, status, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };

    if (!isAdmin) {
        filter.user = new mongoose.Types.ObjectId(userId);
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const feedbacks = await FeedbackModel.find(filter)
        .populate("user", "name email phone profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await FeedbackModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: feedbacks,
    };
};

const updateFeedbackStatus = async (id: string, status: TFeedbackStatus, adminNote?: string) => {
    const feedback = await FeedbackModel.findOne({ _id: id, isDeleted: false });
    if (!feedback) {
        throw new ApiError(httpStatus.NOT_FOUND, "Feedback item not found");
    }

    feedback.status = status;
    if (adminNote !== undefined) feedback.adminNote = adminNote;
    await feedback.save();

    return await FeedbackModel.findById(feedback._id).populate("user", "name email phone profileImage");
};

const deleteFeedback = async (userId: string, isAdmin: boolean, id: string) => {
    const filter: any = { _id: id, isDeleted: false };
    if (!isAdmin) {
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    const feedback = await FeedbackModel.findOneAndUpdate(
        filter,
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!feedback) {
        throw new ApiError(httpStatus.NOT_FOUND, "Feedback item not found or not authorized");
    }

    return feedback;
};

export const feedbackServices = {
    createFeedback,
    getAllFeedbacks,
    updateFeedbackStatus,
    deleteFeedback,
};
