import { NotificationModel } from "./notification.model";
import mongoose from "mongoose";

const getMyNotifications = async (userId: string, groupId: string | undefined, query: { page?: string; limit?: string }) => {
    if (!groupId) {
        return {
            meta: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                unreadCount: 0,
                hasNext: false,
                hasPrev: false,
            },
            data: [],
        };
    }

    const { page = 1, limit = 10 } = query;
    const filter = {
        group: new mongoose.Types.ObjectId(groupId),
        deletedBy: { $ne: new mongoose.Types.ObjectId(userId) },
    };
    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await NotificationModel.find(filter).populate("sender", "name email phone profileImage").populate("group", "name").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();

    const total = await NotificationModel.countDocuments(filter);

    // Map to include isRead field dynamically
    const mappedNotifications = notifications.map((notif) => {
        const isRead = notif.readBy ? notif.readBy.some((id) => id.toString() === userId) : false;
        return {
            ...notif,
            isRead,
        };
    });

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: mappedNotifications,
    };
};

const markAsRead = async (userId: string, id: string) => {
    const result = await NotificationModel.findOneAndUpdate({ _id: id, deletedBy: { $ne: new mongoose.Types.ObjectId(userId) } }, { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } }, { new: true });
    return result;
};

const markAllAsRead = async (userId: string, groupId: string | undefined) => {
    if (!groupId) return null;
    const result = await NotificationModel.updateMany(
        {
            group: new mongoose.Types.ObjectId(groupId),
            deletedBy: { $ne: new mongoose.Types.ObjectId(userId) },
            readBy: { $ne: new mongoose.Types.ObjectId(userId) },
        },
        { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } },
    );
    return result;
};

const deleteNotification = async (userId: string, id: string) => {
    const result = await NotificationModel.findOneAndUpdate({ _id: id }, { $addToSet: { deletedBy: new mongoose.Types.ObjectId(userId) } }, { new: true });
    return result;
};

const deleteAllNotifications = async (userId: string, groupId: string | undefined) => {
    if (!groupId) return null;
    const result = await NotificationModel.updateMany(
        {
            group: new mongoose.Types.ObjectId(groupId),
            deletedBy: { $ne: new mongoose.Types.ObjectId(userId) },
        },
        { $addToSet: { deletedBy: new mongoose.Types.ObjectId(userId) } },
    );
    return result;
};

const getUnreadCount = async (userId: string, groupId: string | undefined) => {
    if (!groupId) {
        return { unreadCount: 0 };
    }
    const unreadCount = await NotificationModel.countDocuments({
        group: new mongoose.Types.ObjectId(groupId),
        sender: { $ne: new mongoose.Types.ObjectId(userId) },
        deletedBy: { $ne: new mongoose.Types.ObjectId(userId) },
        readBy: { $ne: new mongoose.Types.ObjectId(userId) },
    });
    return { unreadCount };
};

export const notificationServices = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    getUnreadCount,
};
