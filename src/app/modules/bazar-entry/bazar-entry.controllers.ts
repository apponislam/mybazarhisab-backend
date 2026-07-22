import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { bazarEntryServices } from "./bazar-entry.services";

const createBazarEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await bazarEntryServices.createBazarEntry(userId.toString(), req.user.groupId?.toString(), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Bazar entry created successfully",
        data: result,
    });
});

const getAllBazarEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await bazarEntryServices.getAllBazarEntries(userId.toString(), req.user.groupId?.toString(), req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bazar entries retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getBazarEntryById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await bazarEntryServices.getBazarEntryById(userId.toString(), req.user.groupId?.toString(), id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bazar entry retrieved successfully",
        data: result,
    });
});

const updateBazarEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await bazarEntryServices.updateBazarEntry(userId.toString(), req.user.groupId?.toString(), id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bazar entry updated successfully",
        data: result,
    });
});

const deleteBazarEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await bazarEntryServices.deleteBazarEntry(userId.toString(), req.user.groupId?.toString(), id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bazar entry deleted successfully",
        data: result,
    });
});

const getBazarEntryStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await bazarEntryServices.getBazarEntryStats(userId.toString(), req.user.groupId?.toString(), req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bazar entry stats retrieved successfully",
        data: result,
    });
});

const createBulkBazarEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await bazarEntryServices.createBulkBazarEntries(userId.toString(), req.user.groupId?.toString(), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Bulk bazar entries created successfully",
        data: result,
    });
});

export const bazarEntryControllers = {
    createBazarEntry,
    createBulkBazarEntries,
    getAllBazarEntries,
    getBazarEntryById,
    getBazarEntryStats,
    updateBazarEntry,
    deleteBazarEntry,
};

