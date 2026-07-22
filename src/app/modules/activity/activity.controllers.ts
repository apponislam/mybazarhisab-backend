import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { activityServices } from "./activity.services";

const getAllActivities = catchAsync(async (req: Request, res: Response) => {
    const result = await activityServices.getAllActivities(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Activity log retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const deleteActivity = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await activityServices.deleteActivity(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Activity log entry deleted successfully",
        data: result,
    });
});

const clearActivities = catchAsync(async (req: Request, res: Response) => {
    const result = await activityServices.clearActivities(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Activity log feed cleared successfully",
        data: result,
    });
});

export const activityControllers = {
    getAllActivities,
    deleteActivity,
    clearActivities,
};
