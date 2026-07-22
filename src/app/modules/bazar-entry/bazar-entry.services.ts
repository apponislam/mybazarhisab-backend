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
    },
) => {
    const { productId, name, price, quantity = 1, unit, notes, date = new Date() } = payload;
    const priceNum = Number(price);
    const quantityNum = Number(quantity);

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
                    { session },
                ).then((res) => res[0]);
            }
        }

        // 3. Create daily bazar entry under the user's group if they have one
        const [entry] = await BazarEntryModel.create(
            [
                {
                    product: product._id,
                    price: priceNum,
                    quantity: quantityNum,
                    unit,
                    notes,
                    date,
                    user: userId,
                    group: groupId || undefined,
                },
            ],
            { session },
        );

        // Log activity in the background
        activityServices.logActivity(userId, ActivityType.CREATE_BAZAR_ENTRY, `Created daily bazar entry for "${product.name}" (${quantity} ${unit || ""}) with cost of ${price * quantity}`, groupId, { entryId: entry._id });

        await session.commitTransaction();
        session.endSession();

        // Populate product, creator user (with phone), and group details
        const populatedEntry = await BazarEntryModel.findById(entry._id).populate("product").populate("user", "name email phone profileImage").populate("group", "name creator");
        return populatedEntry;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const getAllBazarEntries = async (userId: string, groupId: string | undefined, query: { filter?: string; startDate?: string; endDate?: string; page?: string; limit?: string }) => {
    const { filter: dateFilter, startDate, endDate, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    if (dateFilter?.toUpperCase() === "ALL") {
        // No date filter — return all data
    } else if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    } else {
    }

    const skip = (Number(page) - 1) * Number(limit);
    const entries = await BazarEntryModel.find(filter).populate("product").populate("user", "name email phone profileImage").populate("group", "name creator").sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit));

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
            totalPages: Math.ceil(total / Number(limit)),
            totalCost,
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
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

    const entry = await BazarEntryModel.findOne(filter).populate("product").populate("user", "name email phone profileImage").populate("group", "name creator");

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

    const entry = await BazarEntryModel.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true }).populate("product").populate("user", "name email phone profileImage").populate("group", "name creator");

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found or not authorized");
    }

    // Log activity in the background
    const productName = (entry.product as any)?.name || "";
    activityServices.logActivity(userId, ActivityType.UPDATE_BAZAR_ENTRY, `Updated daily bazar entry for "${productName}"`, groupId, { entryId: entry._id });

    return entry;
};

const deleteBazarEntry = async (userId: string, groupId: string | undefined, id: string) => {
    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const entry = await BazarEntryModel.findOneAndUpdate(filter, { $set: { isDeleted: true } }, { new: true }).populate("product");

    if (!entry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bazar entry not found or not authorized");
    }

    // Log activity in the background
    const productName = (entry.product as any)?.name || "";
    activityServices.logActivity(userId, ActivityType.DELETE_BAZAR_ENTRY, `Deleted daily bazar entry for "${productName}"`, groupId, { entryId: entry._id });

    return entry;
};

// const getBazarEntryStats = async (userId: string, groupId: string | undefined, query: { filter?: string; startDate?: string; endDate?: string }) => {
//     const { filter: dateFilter, startDate, endDate } = query;

//     const filter: any = { isDeleted: false };
//     if (groupId) {
//         filter.group = groupId;
//     } else {
//         filter.user = userId;
//     }

//     if (dateFilter?.toUpperCase() === "ALL") {
//         // No date filter
//     } else if (startDate || endDate) {
//         filter.date = {};
//         if (startDate) filter.date.$gte = new Date(startDate);
//         if (endDate) filter.date.$lte = new Date(endDate);
//     }

//     const totalEntries = await BazarEntryModel.countDocuments(filter);
//     // DEBUG: log price & quantity of matched docs
//     const debugEntries = await BazarEntryModel.find(filter).select("price quantity").lean();
//     console.log("DEBUG: matched entries for totalAmount:", debugEntries);

//     const totalAmountAggregation = await BazarEntryModel.aggregate([
//         { $match: filter },
//         {
//             $group: {
//                 _id: null,
//                 totalAmount: {
//                     $sum: {
//                         $multiply: [{ $toDouble: "$price" }, { $toDouble: "$quantity" }],
//                     },
//                 },
//             },
//         },
//     ]);

//     const totalAmount = totalAmountAggregation[0]?.totalAmount || 0;

//     return { totalEntries, totalAmount };
// };

const getBazarEntryStats = async (userId: string, groupId: string | undefined, query: { filter?: string; startDate?: string; endDate?: string }) => {
    const { filter: dateFilter, startDate, endDate } = query;

    const filter: any = { isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    if (dateFilter?.toUpperCase() === "ALL") {
        // No date filter
    } else if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get all matching entries
    const entries = await BazarEntryModel.find(filter).select("price quantity").lean();

    const totalEntries = entries.length;
    const totalAmount = entries.reduce((sum, entry) => {
        const price = Number(entry.price) || 0;
        const quantity = Number(entry.quantity) || 0;
        return sum + price * quantity;
    }, 0);

    console.log("DEBUG: Calculated totalAmount:", totalAmount);
    console.log("DEBUG: Entries count:", totalEntries);

    return { totalEntries, totalAmount };
};

const createBulkBazarEntries = async (
    userId: string,
    groupId: string | undefined,
    payload: Array<{
        productId?: string;
        name: string;
        price: number;
        quantity?: number;
        unit?: BazarUnit;
        notes?: string;
        date?: Date;
    }> | { entries: Array<{
        productId?: string;
        name: string;
        price: number;
        quantity?: number;
        unit?: BazarUnit;
        notes?: string;
        date?: Date;
    }> }
) => {
    const entriesPayload = Array.isArray(payload) ? payload : payload?.entries;

    if (!Array.isArray(entriesPayload) || entriesPayload.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "An array of bazar entries is required for bulk creation");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const createdEntryIds: mongoose.Types.ObjectId[] = [];

        for (const item of entriesPayload) {
            const { productId, name, price, quantity = 1, unit, notes, date = new Date() } = item;
            const priceNum = Number(price);
            const quantityNum = Number(quantity);

            if (!name || !name.trim()) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Product name is required for all entries");
            }

            if (isNaN(priceNum) || priceNum < 0) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Invalid price for product "${name}"`);
            }

            let product;

            // 1. Resolve target product
            if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                product = await ProductModel.findOne({ _id: productId, isDeleted: false }).session(session);
                if (!product) {
                    throw new ApiError(httpStatus.NOT_FOUND, `Product with ID ${productId} not found`);
                }
            } else {
                // Search case-insensitive name globally
                product = await ProductModel.findOne({
                    name: { $regex: new RegExp("^" + name.trim() + "$", "i") },
                    isDeleted: false,
                }).session(session);

                if (!product) {
                    // Create global product if not exists
                    product = await ProductModel.create(
                        [
                            {
                                name: name.trim(),
                                user: userId,
                            },
                        ],
                        { session },
                    ).then((res) => res[0]);
                }
            }

            // 2. Create daily bazar entry
            const [entry] = await BazarEntryModel.create(
                [
                    {
                        product: product._id,
                        price: priceNum,
                        quantity: quantityNum,
                        unit,
                        notes,
                        date,
                        user: userId,
                        group: groupId || undefined,
                    },
                ],
                { session },
            );

            createdEntryIds.push(entry._id);
        }

        // Log background activity summarizing bulk creation
        activityServices.logActivity(
            userId,
            ActivityType.CREATE_BAZAR_ENTRY,
            `Bulk created ${createdEntryIds.length} daily bazar entries`,
            groupId,
            { entryCount: createdEntryIds.length }
        );

        await session.commitTransaction();
        session.endSession();

        const populatedEntries = await BazarEntryModel.find({ _id: { $in: createdEntryIds } })
            .populate("product")
            .populate("user", "name email phone profileImage")
            .populate("group", "name creator")
            .sort({ createdAt: -1 });

        return {
            count: populatedEntries.length,
            entries: populatedEntries,
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const bazarEntryServices = {
    createBazarEntry,
    createBulkBazarEntries,
    getAllBazarEntries,
    getBazarEntryById,
    getBazarEntryStats,
    updateBazarEntry,
    deleteBazarEntry,
};

