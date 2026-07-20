import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { faqServices } from "./faq.services";

const createFaq = catchAsync(async (req: Request, res: Response) => {
    const result = await faqServices.createFaq(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "FAQ created successfully",
        data: result,
    });
});

const getAllFaqs = catchAsync(async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "ADMIN";
    const result = await faqServices.getAllFaqs(isAdmin, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQs retrieved successfully",
        data: result,
    });
});

const updateFaq = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await faqServices.updateFaq(id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQ updated successfully",
        data: result,
    });
});

const deleteFaq = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await faqServices.deleteFaq(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQ deleted successfully",
        data: result,
    });
});

export const faqControllers = {
    createFaq,
    getAllFaqs,
    updateFaq,
    deleteFaq,
};
