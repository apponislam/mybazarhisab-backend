import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { activityServices } from "./activity.services";

const getAllActivities = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await activityServices.getAllActivities(userId.toString(), req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Activity log retrieved successfully",
        data: result,
    });
});

export const activityControllers = {
    getAllActivities,
};
