import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { notificationServices } from "./notification.services";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const groupId = req.user.groupId?.toString();
    const result = await notificationServices.getMyNotifications(userId, groupId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await notificationServices.markAsRead(userId, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification marked as read",
        data: result,
    });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const groupId = req.user.groupId?.toString();
    const result = await notificationServices.markAllAsRead(userId, groupId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All notifications marked as read",
        data: result,
    });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await notificationServices.deleteNotification(userId, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification deleted successfully",
        data: result,
    });
});

const deleteAllNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const groupId = req.user.groupId?.toString();
    const result = await notificationServices.deleteAllNotifications(userId, groupId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All notifications deleted successfully",
        data: result,
    });
});

export const notificationControllers = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
};
