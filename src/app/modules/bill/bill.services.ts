import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { Bill } from "./bill.interface";
import { BillModel } from "./bill.model";
import { activityServices } from "../activity/activity.services";
import { ActivityType } from "../activity/activity.interface";

const createBill = async (userId: string, groupId: string | undefined, data: Partial<Bill>) => {
    const bill = await BillModel.create({
        ...data,
        user: new mongoose.Types.ObjectId(userId),
        group: groupId ? new mongoose.Types.ObjectId(groupId) : undefined,
    });

    // Log activity in the background
    activityServices.logActivity(userId, ActivityType.CREATE_BILL, `Logged a new ${bill.category.toLowerCase()} bill: "${bill.title}" (৳${bill.amount})`, groupId, { billId: bill._id });

    return await BillModel.findById(bill._id).populate("user", "name email phone profileImage").populate("group", "name creator");
};

const getAllBills = async (userId: string, groupId: string | undefined, query: { category?: string; filter?: string; startDate?: string; endDate?: string; page?: string; limit?: string }) => {
    const { category, filter: dateFilter, startDate, endDate, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    if (category) {
        filter.category = category;
    }

    if (dateFilter?.toUpperCase() === "ALL") {
        // No date filter — return all data
    } else if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    } else {
        // Default: current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        filter.date = { $gte: firstDay, $lte: lastDay };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const bills = await BillModel.find(filter).populate("user", "name email phone profileImage").populate("group", "name creator").sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit));

    const total = await BillModel.countDocuments(filter);

    // Calculate total bill amount matching filter
    const totalAmountAggregation = await BillModel.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
            },
        },
    ]);

    const totalAmount = totalAmountAggregation[0]?.totalAmount || 0;

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            totalAmount,
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: bills,
    };
};

const getBillById = async (userId: string, groupId: string | undefined, id: string) => {
    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const bill = await BillModel.findOne(filter).populate("user", "name email phone profileImage").populate("group", "name creator");

    if (!bill) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bill entry not found");
    }

    return bill;
};

const updateBill = async (userId: string, groupId: string | undefined, id: string, data: Partial<Bill>) => {
    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const bill = await BillModel.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true }).populate("user", "name email phone profileImage").populate("group", "name creator");

    if (!bill) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bill entry not found or not authorized");
    }

    // Log activity in the background
    activityServices.logActivity(userId, ActivityType.UPDATE_BILL, `Updated bill: "${bill.title}"`, groupId, { billId: bill._id });

    return bill;
};

const deleteBill = async (userId: string, groupId: string | undefined, id: string) => {
    const filter: any = { _id: id, isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    const bill = await BillModel.findOneAndUpdate(filter, { $set: { isDeleted: true } }, { new: true });

    if (!bill) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bill entry not found or not authorized");
    }

    // Log activity in the background
    activityServices.logActivity(userId, ActivityType.DELETE_BILL, `Deleted bill: "${bill.title}" (৳${bill.amount})`, groupId, { billId: bill._id });

    return bill;
};

// const getBillStats = async (userId: string, groupId: string | undefined, query: { category?: string; filter?: string; startDate?: string; endDate?: string }) => {
//     const { category, filter: dateFilter, startDate, endDate } = query;

//     const filter: any = { isDeleted: false };
//     if (groupId) {
//         filter.group = groupId;
//     } else {
//         filter.user = userId;
//     }

//     if (category) {
//         filter.category = category;
//     }

//     if (dateFilter?.toUpperCase() === "ALL") {
//         // No date filter
//     } else if (startDate || endDate) {
//         filter.date = {};
//         if (startDate) filter.date.$gte = new Date(startDate);
//         if (endDate) filter.date.$lte = new Date(endDate);
//     } else {
//         // Default: current month
//         const now = new Date();
//         const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
//         const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
//         filter.date = { $gte: firstDay, $lte: lastDay };
//     }

//     const totalEntries = await BillModel.countDocuments(filter);

//     const totalAmountAggregation = await BillModel.aggregate([
//         { $match: filter },
//         {
//             $group: {
//                 _id: null,
//                 totalAmount: { $sum: "$amount" },
//             },
//         },
//     ]);

//     const totalAmount = totalAmountAggregation[0]?.totalAmount || 0;

//     return { totalEntries, totalAmount };
// };

const getBillStats = async (userId: string, groupId: string | undefined, query: { category?: string; filter?: string; startDate?: string; endDate?: string }) => {
    const { category, filter: dateFilter, startDate, endDate } = query;

    const filter: any = { isDeleted: false };
    if (groupId) {
        filter.group = groupId;
    } else {
        filter.user = userId;
    }

    if (category) {
        filter.category = category;
    }

    if (dateFilter?.toUpperCase() === "ALL") {
        // No date filter
    } else if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    } else {
        // Default: current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        filter.date = { $gte: firstDay, $lte: lastDay };
    }

    // Get all matching entries
    const entries = await BillModel.find(filter).select("amount").lean();

    const totalEntries = entries.length;
    const totalAmount = entries.reduce((sum, entry) => {
        const amount = Number(entry.amount) || 0;
        return sum + amount;
    }, 0);

    return { totalEntries, totalAmount };
};

export const billServices = {
    createBill,
    getAllBills,
    getBillById,
    getBillStats,
    updateBill,
    deleteBill,
};
