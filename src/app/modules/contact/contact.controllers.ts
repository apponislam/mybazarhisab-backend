import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { contactServices } from "./contact.services";

const submitMessage = catchAsync(async (req: Request, res: Response) => {
    const result = await contactServices.submitMessage(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Message submitted successfully. We will get back to you soon.",
        data: result,
    });
});

const getAllMessages = catchAsync(async (req: Request, res: Response) => {
    const result = await contactServices.getAllMessages(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contact messages retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getMessageById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await contactServices.getMessageById(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contact message details retrieved successfully",
        data: result,
    });
});

const replyToMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { replyMessage } = req.body;
    const adminId = req.user._id;

    const result = await contactServices.replyToMessage(id as string, adminId.toString(), replyMessage);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reply sent and contact status updated successfully",
        data: result,
    });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await contactServices.deleteMessage(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contact message deleted successfully",
        data: result,
    });
});

export const contactControllers = {
    submitMessage,
    getAllMessages,
    getMessageById,
    replyToMessage,
    deleteMessage,
};
