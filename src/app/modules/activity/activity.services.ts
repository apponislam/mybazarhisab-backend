import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { ActivityModel } from "./activity.model";

const createActivityLog = async (
    userId: string,
    action: string,
    details: string,
    groupId?: string,
    metadata?: Record<string, any>,
    session?: any
) => {
    const activityData: any = {
        user: userId,
        action,
        details,
    };
    if (groupId) activityData.group = groupId;
    if (metadata) activityData.metadata = metadata;

    const options = session ? { session } : {};
    await ActivityModel.create([activityData], options);
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
    createActivityLog,
    getAllActivities,
};
