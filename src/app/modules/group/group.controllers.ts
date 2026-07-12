import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { groupServices } from "./group.services";

const createGroup = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { name } = req.body;
    const result = await groupServices.createGroup(userId.toString(), name);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Group created successfully",
        data: result,
    });
});

const joinGroup = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { inviteCode } = req.body;
    const result = await groupServices.joinGroup(userId.toString(), inviteCode);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Joined group successfully",
        data: result,
    });
});

const leaveGroup = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await groupServices.leaveGroup(userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getMyGroup = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await groupServices.getMyGroup(userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result ? "Group details retrieved successfully" : "No active group membership found",
        data: result,
    });
});

export const groupControllers = {
    createGroup,
    joinGroup,
    leaveGroup,
    getMyGroup,
};
