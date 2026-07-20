import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { reviewServices } from "./review.services";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await reviewServices.createReview(userId.toString(), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review submitted successfully",
        data: result,
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "ADMIN";
    const result = await reviewServices.getAllReviews(isAdmin, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getReviewSummaryStats = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewServices.getReviewSummaryStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review summary statistics retrieved successfully",
        data: result,
    });
});

const toggleReviewVisibility = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await reviewServices.toggleReviewVisibility(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review visibility status updated successfully",
        data: result,
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const isAdmin = req.user.role === "ADMIN";
    const { id } = req.params;

    const result = await reviewServices.deleteReview(userId.toString(), isAdmin, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review deleted successfully",
        data: result,
    });
});

export const reviewControllers = {
    createReview,
    getAllReviews,
    getReviewSummaryStats,
    toggleReviewVisibility,
    deleteReview,
};
