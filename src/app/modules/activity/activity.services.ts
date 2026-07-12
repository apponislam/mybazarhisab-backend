import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { ActivityModel } from "./activity.model";
import { ActivityType } from "./activity.interface";

const logActivity = (
    userId: any,
    action: ActivityType,
    details: string,
    groupId?: string,
    metadata?: Record<string, any>
) => {
    // Fire and forget: don't await model creation, handle errors internally
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error("Invalid userId for activity logging:", userId);
            return;
        }

        const activityData: any = {
            user: new mongoose.Types.ObjectId(userId),
            action,
            details,
        };

        if (groupId && mongoose.Types.ObjectId.isValid(groupId)) {
            activityData.group = new mongoose.Types.ObjectId(groupId);
        }
        if (metadata) {
            activityData.metadata = metadata;
        }

        // Create without await
        ActivityModel.create(activityData).catch((err) => {
            console.error("Failed to log activity in background:", err);
        });
    } catch (error) {
        console.error("Failed to initiate activity logging in background:", error);
    }
};

const getAllActivities = async (userId: string, query: any) => {
    const { page = 1, limit = 20 } = query;

    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const groupId = user.groupId;
    const filter: any = { isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const activities = await ActivityModel.find(filter)
        .populate("user", "name email phone profileImage")
        .populate("group", "name creator")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await ActivityModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data: activities,
    };
};

export const activityServices = {
    logActivity,
    getAllActivities,
};
