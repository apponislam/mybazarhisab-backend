import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { Product } from "./product.interface";
import { ProductModel } from "./product.model";

const createProduct = async (userId: string, data: Partial<Product>) => {
    const product = await ProductModel.create({
        ...data,
        user: userId,
    });
    return product;
};

const getAllProducts = async (userId: string, query: any) => {
    const { searchTerm, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };

    if (searchTerm) {
        filter.name = { $regex: searchTerm, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const products = await ProductModel.find(filter)
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
    const product = await ProductModel.findOne({ _id: productId, isDeleted: false });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    return product;
};

const updateProduct = async (userId: string, productId: string, data: Partial<Product>) => {
    const product = await ProductModel.findOneAndUpdate(
        { _id: productId, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found or not authorized");
    }

    return product;
};

const deleteProduct = async (userId: string, productId: string) => {
    const product = await ProductModel.findOneAndUpdate(
        { _id: productId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found or not authorized");
    }

    return product;
};

export const productServices = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
