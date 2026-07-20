import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { feedbackServices } from "./feedback.services";

const createFeedback = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await feedbackServices.createFeedback(userId.toString(), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Feedback submitted successfully",
        data: result,
    });
});

const getAllFeedbacks = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const isAdmin = req.user?.role === "ADMIN";

    const result = await feedbackServices.getAllFeedbacks(userId.toString(), isAdmin, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Feedbacks retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const updateFeedbackStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const result = await feedbackServices.updateFeedbackStatus(id as string, status, adminNote);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Feedback status updated successfully",
        data: result,
    });
});

const deleteFeedback = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const isAdmin = req.user.role === "ADMIN";
    const { id } = req.params;

    const result = await feedbackServices.deleteFeedback(userId.toString(), isAdmin, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Feedback deleted successfully",
        data: result,
    });
});

export const feedbackControllers = {
    createFeedback,
    getAllFeedbacks,
    updateFeedbackStatus,
    deleteFeedback,
};
