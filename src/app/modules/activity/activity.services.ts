import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ActivityModel } from "./activity.model";
import { ActivityType } from "./activity.interface";

export const ACTIVITY_CATEGORIES: Record<string, ActivityType[]> = {
    AUTH: [
        ActivityType.REGISTER,
        ActivityType.LOGIN,
        ActivityType.EMAIL_VERIFY,
        ActivityType.PASSWORD_RESET,
        ActivityType.PROFILE_UPDATE,
        ActivityType.PASSWORD_CHANGE,
        ActivityType.EMAIL_UPDATE,
        ActivityType.USER_DELETE,
    ],
    USER: [
        ActivityType.REGISTER,
        ActivityType.LOGIN,
        ActivityType.EMAIL_VERIFY,
        ActivityType.PASSWORD_RESET,
        ActivityType.PROFILE_UPDATE,
        ActivityType.PASSWORD_CHANGE,
        ActivityType.EMAIL_UPDATE,
        ActivityType.USER_DELETE,
    ],
    PRODUCT: [
        ActivityType.CREATE_PRODUCT,
        ActivityType.UPDATE_PRODUCT,
        ActivityType.DELETE_PRODUCT,
        ActivityType.MERGE_PRODUCTS,
    ],
    BAZAR: [
        ActivityType.CREATE_BAZAR_ENTRY,
        ActivityType.UPDATE_BAZAR_ENTRY,
        ActivityType.DELETE_BAZAR_ENTRY,
    ],
    BAZAR_ENTRY: [
        ActivityType.CREATE_BAZAR_ENTRY,
        ActivityType.UPDATE_BAZAR_ENTRY,
        ActivityType.DELETE_BAZAR_ENTRY,
    ],
    GROUP: [
        ActivityType.CREATE_GROUP,
        ActivityType.JOIN_GROUP,
        ActivityType.LEAVE_GROUP,
        ActivityType.UPDATE_GROUP,
    ],
    BILL: [
        ActivityType.CREATE_BILL,
        ActivityType.UPDATE_BILL,
        ActivityType.DELETE_BILL,
    ],
};

export const parseActionOrTypeFilter = (
    input?: ActivityType | ActivityType[] | string
): any => {
    if (!input) return null;

    let items: string[] = [];

    if (Array.isArray(input)) {
        items = input.map((i) => String(i).trim());
    } else if (typeof input === "string") {
        items = input.split(",").map((i) => i.trim());
    } else {
        items = [String(input).trim()];
    }

    const resolvedTypes: Set<ActivityType> = new Set();

    for (const item of items) {
        if (!item) continue;
        const upper = item.toUpperCase();

        if (upper === "ALL") {
            return null;
        }

        if (ACTIVITY_CATEGORIES[upper]) {
            ACTIVITY_CATEGORIES[upper].forEach((act) => resolvedTypes.add(act));
        } else if (Object.values(ActivityType).includes(upper as ActivityType)) {
            resolvedTypes.add(upper as ActivityType);
        } else {
            const match = Object.values(ActivityType).find(
                (act) => act.toUpperCase() === upper
            );
            if (match) {
                resolvedTypes.add(match);
            }
        }
    }

    const typesArray = Array.from(resolvedTypes);

    if (typesArray.length === 0) {
        return null;
    }

    if (typesArray.length === 1) {
        return typesArray[0];
    }

    return { $in: typesArray };
};

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

export interface GetActivitiesQuery {
    page?: string | number;
    limit?: string | number;
    action?: ActivityType | ActivityType[] | string;
    type?: string;
    userId?: string;
    groupId?: string;
    startDate?: string;
    endDate?: string;
}

const getAllActivities = async (query: GetActivitiesQuery) => {
    const { page = 1, limit = 20, action, type, userId, groupId, startDate, endDate } = query;

    const filter: any = { isDeleted: false };

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    if (groupId && mongoose.Types.ObjectId.isValid(groupId)) {
        filter.group = new mongoose.Types.ObjectId(groupId);
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const targetActionOrType = action || type;
    if (targetActionOrType) {
        const actionFilter = parseActionOrTypeFilter(targetActionOrType);
        if (actionFilter) {
            filter.action = actionFilter;
        }
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
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: activities,
    };
};

const deleteActivity = async (activityId: string) => {
    const activity = await ActivityModel.findOneAndUpdate(
        { _id: activityId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!activity) {
        throw new ApiError(httpStatus.NOT_FOUND, "Activity log not found");
    }

    return activity;
};

export interface ClearActivitiesParams {
    startDate?: string;
    endDate?: string;
    action?: ActivityType | ActivityType[] | string;
    type?: string;
    userId?: string;
    groupId?: string;
    clearAll?: boolean;
}

const clearActivities = async (
    optionsOrStartDate?: ClearActivitiesParams | string,
    endDateParam?: string,
    actionParam?: ActivityType | ActivityType[] | string,
    typeParam?: string,
    userIdParam?: string,
    groupIdParam?: string
) => {
    let startDate: string | undefined;
    let endDate: string | undefined;
    let action: ActivityType | ActivityType[] | string | undefined;
    let type: string | undefined;
    let userId: string | undefined;
    let groupId: string | undefined;
    let clearAll: boolean | undefined;

    if (typeof optionsOrStartDate === "object" && optionsOrStartDate !== null) {
        ({ startDate, endDate, action, type, userId, groupId, clearAll } = optionsOrStartDate);
    } else {
        startDate = optionsOrStartDate;
        endDate = endDateParam;
        action = actionParam;
        type = typeParam;
        userId = userIdParam;
        groupId = groupIdParam;
    }

    const targetActionOrType = action || type;


    const filter: any = { isDeleted: false };

    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid userId specified");
        }
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    if (groupId) {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid groupId specified");
        }
        filter.group = new mongoose.Types.ObjectId(groupId);
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (targetActionOrType) {
        const actionFilter = parseActionOrTypeFilter(targetActionOrType);
        if (actionFilter) {
            filter.action = actionFilter;
        }
    }

    const result = await ActivityModel.updateMany(filter, { $set: { isDeleted: true } });

    const detailsMsg: string[] = [];
    if (startDate && endDate) detailsMsg.push(`from ${startDate} to ${endDate}`);
    else if (startDate) detailsMsg.push(`from ${startDate}`);
    else if (endDate) detailsMsg.push(`until ${endDate}`);

    if (targetActionOrType) {
        if (typeof targetActionOrType === "string") {
            detailsMsg.push(`with type/action "${targetActionOrType}"`);
        } else if (Array.isArray(targetActionOrType)) {
            detailsMsg.push(`with actions [${targetActionOrType.join(", ")}]`);
        }
    }

    if (userId) detailsMsg.push(`for user "${userId}"`);
    if (groupId) detailsMsg.push(`for group "${groupId}"`);

    const filterDetail = detailsMsg.length > 0 ? ` (${detailsMsg.join(", ")})` : "";

    return {
        message: `Activity log cleared successfully${filterDetail}`,
        count: result.modifiedCount,
    };
};

export const activityServices = {
    logActivity,
    getAllActivities,
    deleteActivity,
    clearActivities,
    parseActionOrTypeFilter,
};
