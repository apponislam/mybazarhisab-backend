import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { policyServices } from "./policy.services";
import { TPolicyType } from "./policy.interface";

const getPolicyByType = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params;
    const result = await policyServices.getPolicyByType(type as TPolicyType);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${result?.title || "Policy"} retrieved successfully`,
        data: result,
    });
});

const getAllPolicies = catchAsync(async (req: Request, res: Response) => {
    const result = await policyServices.getAllPolicies();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Policies retrieved successfully",
        data: result,
    });
});

const upsertPolicy = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params;
    const userId = req.user._id;

    const result = await policyServices.upsertPolicy(type as TPolicyType, req.body, userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${result?.title || "Policy"} updated successfully`,
        data: result,
    });
});

export const policyControllers = {
    getPolicyByType,
    getAllPolicies,
    upsertPolicy,
};
