import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { userServices } from "./user.services";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getAllUsers(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getUserProfileAndSummary = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await userServices.getUserProfileAndSummary(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User profile and summary metrics retrieved successfully",
        data: result,
    });
});

const getUserReviews = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await userServices.getUserReviews(id as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User reviews retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getUserActivities = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await userServices.getUserActivities(id as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User activities retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getUserProducts = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await userServices.getUserProducts(id as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User products retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getUserBazarEntries = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await userServices.getUserBazarEntries(id as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User bazar entries retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getUserBills = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await userServices.getUserBills(id as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User bills retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const result = await userServices.updateUserStatus(id as string, isActive);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `User status updated to ${isActive ? "Active" : "Inactive"}`,
        data: result,
    });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const result = await userServices.updateUserRole(id as string, role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `User role updated to ${role}`,
        data: result,
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await userServices.deleteUser(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const userControllers = {
    getAllUsers,
    getUserProfileAndSummary,
    getUserReviews,
    getUserActivities,
    getUserProducts,
    getUserBazarEntries,
    getUserBills,
    updateUserStatus,
    updateUserRole,
    deleteUser,
};
