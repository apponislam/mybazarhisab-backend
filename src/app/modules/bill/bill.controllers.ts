import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { billServices } from "./bill.services";

const createBill = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await billServices.createBill(userId.toString(), req.user.groupId?.toString(), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Bill logged successfully",
        data: result,
    });
});

const getAllBills = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await billServices.getAllBills(userId.toString(), req.user.groupId?.toString(), req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bills retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getBillById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await billServices.getBillById(userId.toString(), req.user.groupId?.toString(), id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bill retrieved successfully",
        data: result,
    });
});

const updateBill = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await billServices.updateBill(userId.toString(), req.user.groupId?.toString(), id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bill updated successfully",
        data: result,
    });
});

const deleteBill = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await billServices.deleteBill(userId.toString(), req.user.groupId?.toString(), id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bill deleted successfully",
        data: result,
    });
});

const getBillStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await billServices.getBillStats(userId.toString(), req.user.groupId?.toString(), req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bill stats retrieved successfully",
        data: result,
    });
});

const createBulkBills = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await billServices.createBulkBills(userId.toString(), req.user.groupId?.toString(), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Bulk bills logged successfully",
        data: result,
    });
});

export const billControllers = {
    createBill,
    createBulkBills,
    getAllBills,
    getBillById,
    getBillStats,
    updateBill,
    deleteBill,
};
