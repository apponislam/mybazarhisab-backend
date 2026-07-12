import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { ProductModel } from "../product/product.model";
import { BazarEntryModel } from "./bazar-entry.model";
import { BazarEntry, BazarUnit } from "./bazar-entry.interface";

const createBazarEntry = async (
    userId: string,
    payload: {
        productId?: string;
        name: string;
        price: number;
        quantity?: number;
        unit?: BazarUnit;
        notes?: string;
        date?: Date;
    }
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { productId, name, price, quantity = 1, unit, notes, date = new Date() } = payload;

        if (!name || !name.trim()) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Product name is required");
        }

        // Get user group
        const user = await UserModel.findOne({ _id: userId, isDeleted: false }).session(session);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not found");
        }
        const groupId = user.groupId;

        let product = null;

        // 1. If productId is provided from frontend dropdown, verify it exists globally
        if (productId && mongoose.Types.ObjectId.isValid(productId)) {
            product = await ProductModel.findOne({ _id: productId, isDeleted: false }).session(session);
        }

        // 2. If no product was found by id, fallback to lookup by name (case-insensitive) to prevent duplicates
        if (!product) {
            product = await ProductModel.findOne({
                name: { $regex: new RegExp("^" + name.trim() + "$", "i") },
                isDeleted: false,
            }).session(session);
        }

        // 3. If product does not exist, create a new one globally
        if (!product) {
            const [newProduct] = await ProductModel.create(
                [
                    {
                        name: name.trim(),
                        user: userId,
                    },
                ],
                { session }
            );
            product = newProduct;
        }

        // 4. Create daily bazar entry under the user's group if they have one
        const [entry] = await BazarEntryModel.create(
            [
                {
                    product: product._id,
                    price,
                    quantity,
                    unit,
                    notes,
                    date,
                    user: userId,
                    group: groupId || undefined,
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        // Populate product details
        const populatedEntry = await BazarEntryModel.findById(entry._id).populate("product");
        return populatedEntry;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const getAllBazarEntries = async (userId: string, query: any) => {
    const { startDate, endDate, page = 1, limit = 10 } = query;

    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    const groupId = user.groupId;

    const filter: any = { isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const entries = await BazarEntryModel.find(filter)
        .populate("product")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await BazarEntryModel.countDocuments(filter);

    // Calculate total cost matching search filter
    const totalCostAggregation = await BazarEntryModel.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                totalCost: { $sum: { $multiply: ["$price", "$quantity"] } },
            },
        },
    ]);

    const totalCost = totalCostAggregation[0]?.totalCost || 0;

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
            totalCost,
        },
        data: entries,
    };
};

const getBazarEntryById = async (userId: string, id: string) => {
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    const groupId = user.groupId;

    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const entry = await BazarEntryModel.findOne(filter).populate("product");

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found");
    }

    return entry;
};

const updateBazarEntry = async (userId: string, id: string, data: Partial<BazarEntry>) => {
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    const groupId = user.groupId;

    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const entry = await BazarEntryModel.findOneAndUpdate(
        filter,
        { $set: data },
        { new: true, runValidators: true }
    ).populate("product");

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found or not authorized");
    }

    return entry;
};

const deleteBazarEntry = async (userId: string, id: string) => {
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    const groupId = user.groupId;

    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const entry = await BazarEntryModel.findOneAndUpdate(
        filter,
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found or not authorized");
    }

    return entry;
};

export const bazarEntryServices = {
    createBazarEntry,
    getAllBazarEntries,
    getBazarEntryById,
    updateBazarEntry,
    deleteBazarEntry,
};
