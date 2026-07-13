import mongoose from "mongoose";
import { UserModel } from "../auth/auth.model";
import { GroupModel } from "../group/group.model";
import { ProductModel } from "../product/product.model";
import { BazarEntryModel } from "../bazar-entry/bazar-entry.model";
import { BillModel } from "../bill/bill.model";

// Shared helpers for aggregations
const getExpenseAggregation = async (filter: any, start: Date, end: Date): Promise<number> => {
    const result = await BazarEntryModel.aggregate([
        {
            $match: {
                ...filter,
                date: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: { $multiply: ["$price", "$quantity"] } },
            },
        },
    ]);
    return result[0]?.total || 0;
};

const getBillExpenseAggregation = async (filter: any, start: Date, end: Date): Promise<number> => {
    const result = await BillModel.aggregate([
        {
            $match: {
                ...filter,
                date: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);
    return result[0]?.total || 0;
};

// Year-wise grouping aggregation helpers
const getYearlyTrendAggregation = async (model: any, filter: any, year: number) => {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    const isBazarModel = model.modelName === "BazarEntry";

    const result = await model.aggregate([
        {
            $match: {
                ...filter,
                date: { $gte: startOfYear, $lte: endOfYear },
            },
        },
        {
            $group: {
                _id: { $month: "$date" },
                total: isBazarModel
                    ? { $sum: { $multiply: ["$price", "$quantity"] } }
                    : { $sum: "$amount" },
            },
        },
    ]);

    const monthMap: Record<number, number> = {};
    result.forEach((item: any) => {
        monthMap[item._id] = item.total;
    });
    return monthMap;
};

// Month-wise grouping aggregation helpers
const getMonthlyTrendAggregation = async (model: any, filter: any, year: number, month: number) => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const isBazarModel = model.modelName === "BazarEntry";

    const result = await model.aggregate([
        {
            $match: {
                ...filter,
                date: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        {
            $group: {
                _id: { $dayOfMonth: "$date" },
                total: isBazarModel
                    ? { $sum: { $multiply: ["$price", "$quantity"] } }
                    : { $sum: "$amount" },
            },
        },
    ]);

    const dayMap: Record<number, number> = {};
    result.forEach((item: any) => {
        dayMap[item._id] = item.total;
    });
    return dayMap;
};

const getAdminDashboardStats = async () => {
    const totalUsers = await UserModel.countDocuments({ isDeleted: false });
    const totalGroups = await GroupModel.countDocuments({ isDeleted: false });
    const totalProducts = await ProductModel.countDocuments({ isDeleted: false });
    const totalBazarEntries = await BazarEntryModel.countDocuments({ isDeleted: false });
    const totalBills = await BillModel.countDocuments({ isDeleted: false });

    // Calculate average bazar entry cost (average of price * quantity)
    const averageBazarAggregation = await BazarEntryModel.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                avgCost: { $avg: { $multiply: ["$price", "$quantity"] } },
            },
        },
    ]);

    const averageBazarEntry = averageBazarAggregation[0]?.avgCost || 0;

    // Calculate global bill metrics
    const billAggregation = await BillModel.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
                avgAmount: { $avg: "$amount" },
            },
        },
    ]);

    const totalBillAmount = billAggregation[0]?.totalAmount || 0;
    const averageBillAmount = billAggregation[0]?.avgAmount || 0;

    return {
        totalUsers,
        totalGroups,
        totalProducts,
        totalBazarEntries,
        totalBills,
        averageBazarEntry: parseFloat(averageBazarEntry.toFixed(2)),
        totalBillAmount: parseFloat(totalBillAmount.toFixed(2)),
        averageBillAmount: parseFloat(averageBillAmount.toFixed(2)),
    };
};

const getUserDashboardStats = async (userId: string, groupId: string | undefined) => {
    // 1. Total members in their group
    let totalMembers = 1;
    if (groupId) {
        const group = await GroupModel.findOne({ _id: groupId, isDeleted: false });
        if (group) {
            totalMembers = group.members.length;
        }
    }

    // 2. Total group bazar entries (or user's own if no group)
    const groupEntriesFilter: any = { isDeleted: false };
    if (groupId) {
        groupEntriesFilter.group = groupId;
    } else {
        groupEntriesFilter.user = userId;
    }
    const totalGroupBazarEntries = await BazarEntryModel.countDocuments(groupEntriesFilter);

    // 3. Total daily entries created by the user personally
    const totalMyBazarEntries = await BazarEntryModel.countDocuments({
        user: userId,
        isDeleted: false,
    });

    // 4. Total products created by the user personally
    const totalProductsCreatedByMe = await ProductModel.countDocuments({
        user: userId,
        isDeleted: false,
    });

    // 5. Expense tracking calculation ranges
    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const endOfThisYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfPrevYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    const [
        thisMonthBazarExpense,
        prevMonthBazarExpense,
        thisYearBazarExpense,
        prevYearBazarExpense,
        thisMonthBillExpense,
        prevMonthBillExpense,
        thisYearBillExpense,
        prevYearBillExpense,
    ] = await Promise.all([
        getExpenseAggregation(groupEntriesFilter, startOfThisMonth, endOfThisMonth),
        getExpenseAggregation(groupEntriesFilter, startOfPrevMonth, endOfPrevMonth),
        getExpenseAggregation(groupEntriesFilter, startOfThisYear, endOfThisYear),
        getExpenseAggregation(groupEntriesFilter, startOfPrevYear, endOfPrevYear),
        getBillExpenseAggregation(groupEntriesFilter, startOfThisMonth, endOfThisMonth),
        getBillExpenseAggregation(groupEntriesFilter, startOfPrevMonth, endOfPrevMonth),
        getBillExpenseAggregation(groupEntriesFilter, startOfThisYear, endOfThisYear),
        getBillExpenseAggregation(groupEntriesFilter, startOfPrevYear, endOfPrevYear),
    ]);

    const thisMonthTotalExpense = thisMonthBazarExpense + thisMonthBillExpense;
    const prevMonthTotalExpense = prevMonthBazarExpense + prevMonthBillExpense;
    const thisYearTotalExpense = thisYearBazarExpense + thisYearBillExpense;
    const prevYearTotalExpense = prevYearBazarExpense + prevYearBillExpense;

    return {
        totalMembers,
        totalGroupBazarEntries,
        totalMyBazarEntries,
        totalProductsCreatedByMe,
        thisMonthBazarExpense,
        prevMonthBazarExpense,
        thisYearBazarExpense,
        prevYearBazarExpense,
        thisMonthBillExpense,
        prevMonthBillExpense,
        thisYearBillExpense,
        prevYearBillExpense,
        thisMonthTotalExpense,
        prevMonthTotalExpense,
        thisYearTotalExpense,
        prevYearTotalExpense,
    };
};

const getMonthlyExpenseTrend = async (userId: string, groupId: string | undefined, view: string = "yearly") => {
    const groupEntriesFilter: any = { isDeleted: false };
    if (groupId) {
        groupEntriesFilter.group = groupId;
    } else {
        groupEntriesFilter.user = userId;
    }

    const now = new Date();

    if (view === "monthly") {
        // Daily trend 1-28/29/30/31 of the current month
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const [bazarMap, billMap] = await Promise.all([
            getMonthlyTrendAggregation(BazarEntryModel, groupEntriesFilter, year, month),
            getMonthlyTrendAggregation(BillModel, groupEntriesFilter, year, month),
        ]);

        const trend = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const bazarExpense = bazarMap[day] || 0;
            const billExpense = billMap[day] || 0;
            trend.push({
                label: `Day ${day}`,
                bazarExpense,
                billExpense,
                totalExpense: bazarExpense + billExpense,
            });
        }
        return trend;
    } else {
        // Yearly trend: Month-wise 12 months (default)
        const year = now.getFullYear();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const [bazarMap, billMap] = await Promise.all([
            getYearlyTrendAggregation(BazarEntryModel, groupEntriesFilter, year),
            getYearlyTrendAggregation(BillModel, groupEntriesFilter, year),
        ]);

        const trend = monthNames.map((name, index) => {
            const monthNum = index + 1; // 1-12
            const bazarExpense = bazarMap[monthNum] || 0;
            const billExpense = billMap[monthNum] || 0;
            return {
                label: name,
                bazarExpense,
                billExpense,
                totalExpense: bazarExpense + billExpense,
            };
        });
        return trend;
    }
};

const getProductPriceGrowthTrend = async (
    userId: string,
    groupId: string | undefined,
    productId: string,
    query: { page?: string; limit?: string }
) => {
    const { page = 1, limit = 10 } = query;

    const filter: any = {
        product: new mongoose.Types.ObjectId(productId),
        isDeleted: false,
    };
    if (groupId) {
        filter.group = new mongoose.Types.ObjectId(groupId);
    } else {
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    const entries = await BazarEntryModel.find(filter)
        .sort({ date: 1, createdAt: 1 });

    const normalizedEntries = entries.map((entry) => {
        const qty = entry.quantity || 1;
        let pricePerUnit = entry.price / qty;
        let unit: string = entry.unit || "PIECE";

        if (unit === "GM") {
            pricePerUnit = (entry.price / qty) * 1000;
            unit = "KG";
        }

        return {
            date: entry.date,
            pricePerUnit: parseFloat(pricePerUnit.toFixed(2)),
            unit,
            notes: entry.notes,
        };
    });

    // Apply consecutive deduplication (only keep the last consecutive entry for a given price)
    const filteredTrend = [];
    for (let i = 0; i < normalizedEntries.length; i++) {
        const current = normalizedEntries[i];
        const next = normalizedEntries[i + 1];

        if (!next || current.pricePerUnit !== next.pricePerUnit) {
            filteredTrend.push(current);
        }
    }

    const total = filteredTrend.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedData = filteredTrend.slice(skip, skip + Number(limit));

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: paginatedData,
    };
};

export const dashboardServices = {
    getAdminDashboardStats,
    getUserDashboardStats,
    getMonthlyExpenseTrend,
    getProductPriceGrowthTrend,
};
