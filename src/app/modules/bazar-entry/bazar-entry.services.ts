import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ProductModel } from "../product/product.model";
import { BazarEntryModel } from "./bazar-entry.model";
import { BazarEntry, BazarUnit } from "./bazar-entry.interface";
import { activityServices } from "../activity/activity.services";
import { ActivityType } from "../activity/activity.interface";

const createBazarEntry = async (
    userId: string,
    groupId: string | undefined,
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
    const { productId, name, price, quantity = 1, unit, notes, date = new Date() } = payload;

    if (!name || !name.trim()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Product name is required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let product;

        // 1. Resolve target product
        if (productId) {
            product = await ProductModel.findOne({ _id: productId, isDeleted: false }).session(session);
            if (!product) {
                throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
            }
        } else {
            // Search case-insensitive name globally across all products
            product = await ProductModel.findOne({
                name: { $regex: new RegExp("^" + name.trim() + "$", "i") },
                isDeleted: false,
            }).session(session);

            if (!product) {
                // 2. Create global product if not exists
                product = await ProductModel.create(
                    [
                        {
                            name: name.trim(),
                            user: userId,
                        },
                    ],
                    { session }
                ).then((res) => res[0]);
            }
        }

        // 3. Create daily bazar entry under the user's group if they have one
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

        // Log activity in the background
        activityServices.logActivity(
            userId,
            ActivityType.CREATE_BAZAR_ENTRY,
            `Created daily bazar entry for "${product.name}" (${quantity} ${unit || ""}) with cost of ${price * quantity}`,
            groupId,
            { entryId: entry._id }
        );

        await session.commitTransaction();
        session.endSession();

        // Populate product, creator user (with phone), and group details
        const populatedEntry = await BazarEntryModel.findById(entry._id)
            .populate("product")
            .populate("user", "name email phone profileImage")
            .populate("group", "name creator");
        return populatedEntry;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const getAllBazarEntries = async (userId: string, groupId: string | undefined, query: any) => {
    const { startDate, endDate, page = 1, limit = 10 } = query;

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
        .populate("user", "name email phone profileImage")
        .populate("group", "name creator")
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

const getBazarEntryById = async (userId: string, groupId: string | undefined, id: string) => {
    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const entry = await BazarEntryModel.findOne(filter)
        .populate("product")
        .populate("user", "name email phone profileImage")
        .populate("group", "name creator");

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found");
    }

    return entry;
};

const updateBazarEntry = async (userId: string, groupId: string | undefined, id: string, data: Partial<BazarEntry>) => {
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
    )
        .populate("product")
        .populate("user", "name email phone profileImage")
        .populate("group", "name creator");

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found or not authorized");
    }

    // Log activity in the background
    const productName = (entry.product as any)?.name || "";
    activityServices.logActivity(
        userId,
        ActivityType.UPDATE_BAZAR_ENTRY,
        `Updated daily bazar entry for "${productName}"`,
        groupId,
        { entryId: entry._id }
    );

    return entry;
};

const deleteBazarEntry = async (userId: string, groupId: string | undefined, id: string) => {
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
    ).populate("product");

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found or not authorized");
    }

    // Log activity in the background
    const productName = (entry.product as any)?.name || "";
    activityServices.logActivity(
        userId,
        ActivityType.DELETE_BAZAR_ENTRY,
        `Deleted daily bazar entry for "${productName}"`,
        groupId,
        { entryId: entry._id }
    );

    return entry;
};

export const bazarEntryServices = {
    createBazarEntry,
    getAllBazarEntries,
    getBazarEntryById,
    updateBazarEntry,
    deleteBazarEntry,
};
