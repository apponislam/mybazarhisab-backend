import { VisitorPlatform } from "./visitor.interface";
import { VisitorModel } from "./visitor.model";

const getTodayDateString = (): string => {
    return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
};

const recordVisit = async (payload: {
    ipAddress: string;
    userAgent?: string;
    platform?: VisitorPlatform;
    path?: string;
    userId?: string;
}) => {
    const dateStr = getTodayDateString();
    const { ipAddress, userAgent, platform = "WEB", path, userId } = payload;
    const formattedPlatform = platform.toUpperCase() as VisitorPlatform;

    const updateDoc: any = {
        $inc: { count: 1 },
        $set: {
            lastVisitedAt: new Date(),
            userAgent: userAgent || "",
            path: path || "/",
            platform: formattedPlatform,
        },
    };

    if (userId) {
        updateDoc.$set.userId = userId;
    }

    const visitor = await VisitorModel.findOneAndUpdate(
        { date: dateStr, ipAddress, platform: formattedPlatform },
        updateDoc,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return visitor;
};

const getVisitorAnalytics = async (days = 30) => {
    const todayStr = getTodayDateString();

    // Today's total visits & unique IP breakdown per platform
    const todayStats = await VisitorModel.aggregate([
        { $match: { date: todayStr } },
        {
            $group: {
                _id: "$platform",
                totalHits: { $sum: "$count" },
                uniqueVisitors: { $sum: 1 },
            },
        },
    ]);

    let todayTotalVisits = 0;
    let todayUniqueVisitors = 0;
    const todayPlatformBreakdown: Record<string, { visits: number; unique: number }> = {
        WEB: { visits: 0, unique: 0 },
        APP: { visits: 0, unique: 0 },
        ANDROID: { visits: 0, unique: 0 },
        IOS: { visits: 0, unique: 0 },
    };

    todayStats.forEach((stat) => {
        const platformKey = stat._id || "WEB";
        todayTotalVisits += stat.totalHits;
        todayUniqueVisitors += stat.uniqueVisitors;

        todayPlatformBreakdown[platformKey] = {
            visits: stat.totalHits,
            unique: stat.uniqueVisitors,
        };
    });

    // Combined WEB vs APP totals for today
    const todayWebVisits = todayPlatformBreakdown.WEB.visits;
    const todayWebUnique = todayPlatformBreakdown.WEB.unique;
    const todayAppVisits =
        todayPlatformBreakdown.APP.visits +
        todayPlatformBreakdown.ANDROID.visits +
        todayPlatformBreakdown.IOS.visits;
    const todayAppUnique =
        todayPlatformBreakdown.APP.unique +
        todayPlatformBreakdown.ANDROID.unique +
        todayPlatformBreakdown.IOS.unique;

    // All-time total visits & unique records per platform
    const allTimeStats = await VisitorModel.aggregate([
        {
            $group: {
                _id: "$platform",
                totalHits: { $sum: "$count" },
                uniqueRecords: { $sum: 1 },
            },
        },
    ]);

    let totalVisits = 0;
    let totalUniqueVisitors = 0;
    const allTimePlatformBreakdown: Record<string, { visits: number; unique: number }> = {
        WEB: { visits: 0, unique: 0 },
        APP: { visits: 0, unique: 0 },
        ANDROID: { visits: 0, unique: 0 },
        IOS: { visits: 0, unique: 0 },
    };

    allTimeStats.forEach((stat) => {
        const platformKey = stat._id || "WEB";
        totalVisits += stat.totalHits;
        totalUniqueVisitors += stat.uniqueRecords;

        allTimePlatformBreakdown[platformKey] = {
            visits: stat.totalHits,
            unique: stat.uniqueRecords,
        };
    });

    // Daily breakdown for charts (past N days) with platform splits
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split("T")[0];

    const dailyBreakdown = await VisitorModel.aggregate([
        { $match: { date: { $gte: startDateStr } } },
        {
            $group: {
                _id: { date: "$date", platform: "$platform" },
                totalVisits: { $sum: "$count" },
                uniqueVisitors: { $sum: 1 },
            },
        },
        { $sort: { "_id.date": 1 } },
    ]);

    // Format daily trend grouping by date
    const dailyMap: Record<
        string,
        {
            date: string;
            totalVisits: number;
            uniqueVisitors: number;
            webVisits: number;
            webUnique: number;
            appVisits: number;
            appUnique: number;
        }
    > = {};

    dailyBreakdown.forEach((item) => {
        const dateKey = item._id.date;
        const platform = item._id.platform || "WEB";

        if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = {
                date: dateKey,
                totalVisits: 0,
                uniqueVisitors: 0,
                webVisits: 0,
                webUnique: 0,
                appVisits: 0,
                appUnique: 0,
            };
        }

        dailyMap[dateKey].totalVisits += item.totalVisits;
        dailyMap[dateKey].uniqueVisitors += item.uniqueVisitors;

        if (platform === "WEB") {
            dailyMap[dateKey].webVisits += item.totalVisits;
            dailyMap[dateKey].webUnique += item.uniqueVisitors;
        } else {
            dailyMap[dateKey].appVisits += item.totalVisits;
            dailyMap[dateKey].appUnique += item.uniqueVisitors;
        }
    });

    const dailyTrend = Object.values(dailyMap);

    return {
        todayTotalVisits,
        todayUniqueVisitors,
        todayWebVisits,
        todayWebUnique,
        todayAppVisits,
        todayAppUnique,
        todayPlatformBreakdown,
        totalVisits,
        totalUniqueVisitors,
        allTimePlatformBreakdown,
        dailyTrend,
    };
};

export const visitorServices = {
    recordVisit,
    getVisitorAnalytics,
};
