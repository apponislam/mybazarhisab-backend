import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { BazarEntryModel } from "../bazar-entry/bazar-entry.model";
import { Product } from "./product.interface";
import { ProductModel } from "./product.model";
import { activityServices } from "../activity/activity.services";
import { ActivityType } from "../activity/activity.interface";

const createProduct = async (userId: string, groupId: string | undefined, data: Partial<Product>) => {
    const product = await ProductModel.create({
        ...data,
        user: userId,
    });
    
    // Log activity in the background
    activityServices.logActivity(
        userId,
        ActivityType.CREATE_PRODUCT,
        `Created product "${product.name}"`,
        groupId,
        { productId: product._id }
    );

    return await ProductModel.findById(product._id).populate("user", "name email phone profileImage");
};

const getAllProducts = async (userId: string, query: any) => {
    const { searchTerm, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };

    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const products = await ProductModel.find(filter)
        .populate("user", "name email phone profileImage")
        .populate("updatedBy", "name email phone profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await ProductModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data: products,
    };
};

const getProductById = async (userId: string, productId: string) => {
    const product = await ProductModel.findOne({ _id: productId, isDeleted: false })
        .populate("user", "name email phone profileImage")
        .populate("updatedBy", "name email phone profileImage");

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    return product;
};

const updateProduct = async (userId: string, groupId: string | undefined, productId: string, data: Partial<Product>) => {
    const product = await ProductModel.findOneAndUpdate(
        { _id: productId, isDeleted: false },
        { 
            $set: {
                ...data,
                isEdited: true,
                updatedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        { new: true, runValidators: true }
    )
    .populate("user", "name email phone profileImage")
    .populate("updatedBy", "name email phone profileImage");

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found or not authorized");
    }

    // Log activity in the background
    activityServices.logActivity(
        userId,
        ActivityType.UPDATE_PRODUCT,
        `Updated product "${product.name}"`,
        groupId,
        { productId: product._id }
    );

    return product;
};

const deleteProduct = async (userId: string, groupId: string | undefined, productId: string) => {
    const product = await ProductModel.findOneAndUpdate(
        { _id: productId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    )
    .populate("user", "name email phone profileImage")
    .populate("updatedBy", "name email phone profileImage");

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found or not authorized");
    }

    // Log activity in the background
    activityServices.logActivity(
        userId,
        ActivityType.DELETE_PRODUCT,
        `Deleted product "${product.name}"`,
        groupId,
        { productId: product._id }
    );

    return product;
};

const mergeProducts = async (adminId: string, sourceProductId: string, targetProductId: string) => {
    if (!mongoose.Types.ObjectId.isValid(sourceProductId) || !mongoose.Types.ObjectId.isValid(targetProductId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid product ID(s)");
    }

    if (sourceProductId === targetProductId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Source and target product IDs cannot be the same");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify target product exists
        const targetProduct = await ProductModel.findOne({ _id: targetProductId, isDeleted: false }).session(session);
        if (!targetProduct) {
            throw new ApiError(httpStatus.NOT_FOUND, "Target product not found");
        }

        // 2. Verify source product exists
        const sourceProduct = await ProductModel.findOne({ _id: sourceProductId, isDeleted: false }).session(session);
        if (!sourceProduct) {
            throw new ApiError(httpStatus.NOT_FOUND, "Source product not found");
        }

        // 3. Update all BazarEntry documents referencing sourceProductId to targetProductId
        await BazarEntryModel.updateMany(
            { product: sourceProductId },
            { $set: { product: targetProductId } },
            { session }
        );

        // 4. Delete the source product permanently
        await ProductModel.deleteOne({ _id: sourceProductId }).session(session);

        // Log activity in the background (no session to avoid transaction block/closure crash)
        activityServices.logActivity(
            adminId,
            ActivityType.MERGE_PRODUCTS,
            `Merged product "${sourceProduct.name}" into "${targetProduct.name}"`,
            undefined,
            { sourceProductId, targetProductId }
        );

        await session.commitTransaction();
        session.endSession();

        return { message: "Products merged successfully" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const productServices = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    mergeProducts,
};
