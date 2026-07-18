import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { dashboardServices } from "./dashboard.services";

const getAdminDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getAdminDashboardStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: result,
    });
});

const getUserDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await dashboardServices.getUserDashboardStats(userId.toString(), req.user.groupId?.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User dashboard statistics retrieved successfully",
        data: result,
    });
});

const getMonthlyExpenseTrend = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const view = req.query.view as string | undefined;
    const result = await dashboardServices.getMonthlyExpenseTrend(userId.toString(), req.user.groupId?.toString(), view);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Monthly expense trend retrieved successfully",
        data: result,
    });
});

const getProductPriceGrowthTrend = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const result = await dashboardServices.getProductPriceGrowthTrend(
        userId.toString(),
        req.user.groupId?.toString(),
        productId as string,
        req.query
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product price growth trend retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getStatementPdf = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await dashboardServices.getStatementPdf(userId.toString(), req.user.groupId?.toString(), req.query);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=statement.pdf");
    res.status(httpStatus.OK).send(result);
});

export const dashboardControllers = {
    getAdminDashboardStats,
    getUserDashboardStats,
    getMonthlyExpenseTrend,
    getProductPriceGrowthTrend,
    getStatementPdf,
};
