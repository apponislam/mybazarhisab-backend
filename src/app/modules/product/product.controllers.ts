import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { productServices } from "./product.services";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await productServices.createProduct(userId.toString(), req.user.groupId?.toString(), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Product created successfully",
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await productServices.getAllProducts(userId.toString(), req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Products retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await productServices.getProductById(userId.toString(), id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product retrieved successfully",
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await productServices.updateProduct(userId.toString(), req.user.groupId?.toString(), id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product updated successfully",
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await productServices.deleteProduct(userId.toString(), req.user.groupId?.toString(), id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product deleted successfully",
        data: result,
    });
});

const mergeProducts = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.user._id;
    const { sourceProductId, targetProductId } = req.body;
    const result = await productServices.mergeProducts(adminId.toString(), sourceProductId as string, targetProductId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const productControllers = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    mergeProducts,
};
