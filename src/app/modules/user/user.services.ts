import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { GroupModel } from "../group/group.model";
import { ReviewModel } from "../review/review.model";
import { ActivityModel } from "../activity/activity.model";
import { ProductModel } from "../product/product.model";
import { BazarEntryModel } from "../bazar-entry/bazar-entry.model";
import { BillModel } from "../bill/bill.model";

const getAllUsers = async (query: {
    searchTerm?: string;
    role?: string;
    isActive?: string;
    page?: string;
    limit?: string;
}) => {
    const { searchTerm, role, isActive, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };

    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { phone: { $regex: searchTerm, $options: "i" } },
        ];
    }

    if (role) {
        filter.role = role.toUpperCase();
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await UserModel.find(filter)
        .populate({
            path: "groupId",
            select: "name inviteCode",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await UserModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: users,
    };
};

const getUserProfileAndSummary = async (userId: string) => {
    const user = await UserModel.findOne({ _id: userId, isDeleted: false }).populate({
        path: "groupId",
        select: "name inviteCode creator members",
        populate: [
            { path: "creator", select: "name email phone profileImage" },
            { path: "members", select: "name email phone profileImage" },
        ],
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
        totalReviews,
        totalActivities,
        totalProducts,
        totalBazarEntries,
        totalBills,
        bazarSpentAggregation,
        billSpentAggregation,
    ] = await Promise.all([
        ReviewModel.countDocuments({ user: userObjectId, isDeleted: false }),
        ActivityModel.countDocuments({ user: userObjectId, isDeleted: false }),
        ProductModel.countDocuments({ user: userObjectId, isDeleted: false }),
        BazarEntryModel.countDocuments({ user: userObjectId, isDeleted: false }),
        BillModel.countDocuments({ user: userObjectId, isDeleted: false }),
        BazarEntryModel.aggregate([
            { $match: { user: userObjectId, isDeleted: false } },
            { $group: { _id: null, totalSpent: { $sum: "$price" } } },
        ]),
        BillModel.aggregate([
            { $match: { user: userObjectId, isDeleted: false } },
            { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
        ]),
    ]);

    const totalBazarSpent = bazarSpentAggregation.length > 0 ? bazarSpentAggregation[0].totalSpent : 0;
    const totalBillSpent = billSpentAggregation.length > 0 ? billSpentAggregation[0].totalSpent : 0;

    let groupStats = null;

    if (user.groupId) {
        const groupObjId = (user.groupId as any)._id;

        const [
            groupTotalBazarEntries,
            groupTotalBills,
            groupBazarSpentAgg,
            groupBillSpentAgg,
        ] = await Promise.all([
            BazarEntryModel.countDocuments({ group: groupObjId, isDeleted: false }),
            BillModel.countDocuments({ group: groupObjId, isDeleted: false }),
            BazarEntryModel.aggregate([
                { $match: { group: groupObjId, isDeleted: false } },
                { $group: { _id: null, totalSpent: { $sum: "$price" } } },
            ]),
            BillModel.aggregate([
                { $match: { group: groupObjId, isDeleted: false } },
                { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
            ]),
        ]);

        const groupTotalBazarSpent = groupBazarSpentAgg.length > 0 ? groupBazarSpentAgg[0].totalSpent : 0;
        const groupTotalBillSpent = groupBillSpentAgg.length > 0 ? groupBillSpentAgg[0].totalSpent : 0;

        groupStats = {
            totalMembers: (user.groupId as any).members?.length || 0,
            totalBazarEntries: groupTotalBazarEntries,
            totalBills: groupTotalBills,
            totalBazarSpent: groupTotalBazarSpent,
            totalBillSpent: groupTotalBillSpent,
            totalOverallSpent: groupTotalBazarSpent + groupTotalBillSpent,
        };
    }

    return {
        user,
        stats: {
            totalReviews,
            totalActivities,
            totalProducts,
            totalBazarEntries,
            totalBills,
            totalBazarSpent,
            totalBillSpent,
            totalOverallSpent: totalBazarSpent + totalBillSpent,
        },
        groupStats,
    };

};

const getUserReviews = async (userId: string, query: { page?: string; limit?: string }) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { user: new mongoose.Types.ObjectId(userId), isDeleted: false };

    const reviews = await ReviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await ReviewModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: reviews,
    };
};

const getUserActivities = async (userId: string, query: { page?: string; limit?: string }) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { user: new mongoose.Types.ObjectId(userId), isDeleted: false };

    const activities = await ActivityModel.find(filter)
        .populate("group", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await ActivityModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: activities,
    };
};

const getUserProducts = async (userId: string, query: { page?: string; limit?: string }) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { user: new mongoose.Types.ObjectId(userId), isDeleted: false };

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
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: products,
    };
};

const getUserBazarEntries = async (userId: string, query: { page?: string; limit?: string }) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { user: new mongoose.Types.ObjectId(userId), isDeleted: false };

    const bazarEntries = await BazarEntryModel.find(filter)
        .populate("product", "name photo")
        .populate("group", "name")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await BazarEntryModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: bazarEntries,
    };
};

const getUserBills = async (userId: string, query: { page?: string; limit?: string }) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { user: new mongoose.Types.ObjectId(userId), isDeleted: false };

    const bills = await BillModel.find(filter)
        .populate("group", "name")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await BillModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: bills,
    };
};

const updateUserStatus = async (userId: string, isActive: boolean) => {
    const user = await UserModel.findOneAndUpdate(
        { _id: userId, isDeleted: false },
        { $set: { isActive } },
        { new: true }
    );

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
};

const updateUserRole = async (userId: string, role: "ADMIN" | "USER") => {
    if (!["ADMIN", "USER"].includes(role)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role. Allowed values: ADMIN, USER");
    }

    const user = await UserModel.findOneAndUpdate(
        { _id: userId, isDeleted: false },
        { $set: { role } },
        { new: true }
    );

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
};

const deleteUser = async (userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await UserModel.findOne({ _id: userId, isDeleted: false }).session(session);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not found");
        }

        user.isDeleted = true;
        await user.save({ session });

        // If user belongs to a group, remove them from group.members
        if (user.groupId) {
            const group = await GroupModel.findOne({ _id: user.groupId, isDeleted: false }).session(session);
            if (group) {
                group.members = group.members.filter((m) => m.toString() !== userId);
                if (group.members.length === 0) {
                    group.isDeleted = true;
                } else if (group.creator.toString() === userId) {
                    group.creator = group.members[0];
                }
                await group.save({ session });
            }
        }

        await session.commitTransaction();
        session.endSession();

        return { message: "User deleted successfully" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const userServices = {
    getAllUsers,
    getUserProfileAndSummary,
    getUserReviews,
    getUserActivities,
    getUserProducts,
    getUserBazarEntries,
    getUserBills,
    updateUserStatus,
    updateUserRole,
    deleteUser,
};
