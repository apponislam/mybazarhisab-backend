
import { UserModel } from "../auth/auth.model";
import { GroupModel } from "../group/group.model";
import { ProductModel } from "../product/product.model";
import { BazarEntryModel } from "../bazar-entry/bazar-entry.model";
import { BillModel } from "../bill/bill.model";

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

    const getExpenseForRange = async (start: Date, end: Date): Promise<number> => {
        const result = await BazarEntryModel.aggregate([
            {
                $match: {
                    ...groupEntriesFilter,
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

    const getBillExpenseForRange = async (start: Date, end: Date): Promise<number> => {
        const result = await BillModel.aggregate([
            {
                $match: {
                    ...groupEntriesFilter,
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
        getExpenseForRange(startOfThisMonth, endOfThisMonth),
        getExpenseForRange(startOfPrevMonth, endOfPrevMonth),
        getExpenseForRange(startOfThisYear, endOfThisYear),
        getExpenseForRange(startOfPrevYear, endOfPrevYear),
        getBillExpenseForRange(startOfThisMonth, endOfThisMonth),
        getBillExpenseForRange(startOfPrevMonth, endOfPrevMonth),
        getBillExpenseForRange(startOfThisYear, endOfThisYear),
        getBillExpenseForRange(startOfPrevYear, endOfPrevYear),
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

export const dashboardServices = {
    getAdminDashboardStats,
    getUserDashboardStats,
};
