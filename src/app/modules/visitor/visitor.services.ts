import { VisitorModel } from "./visitor.model";

const getTodayDateString = (): string => {
    return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
};

const recordVisit = async (payload: {
    ipAddress: string;
    userAgent?: string;
    path?: string;
    userId?: string;
}) => {
    const dateStr = getTodayDateString();
    const { ipAddress, userAgent, path, userId } = payload;

    const updateDoc: any = {
        $inc: { count: 1 },
        $set: {
            lastVisitedAt: new Date(),
            userAgent: userAgent || "",
            path: path || "/",
        },
    };

    if (userId) {
        updateDoc.$set.userId = userId;
    }

    const visitor = await VisitorModel.findOneAndUpdate(
        { date: dateStr, ipAddress },
        updateDoc,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return visitor;
};

const getVisitorAnalytics = async (days = 30) => {
    const todayStr = getTodayDateString();

    // Today's total page views (hits) & unique IP count
    const todayStats = await VisitorModel.aggregate([
        { $match: { date: todayStr } },
        {
            $group: {
                _id: null,
                totalHits: { $sum: "$count" },
                uniqueVisitors: { $sum: 1 },
            },
        },
    ]);

    const todayTotalVisits = todayStats[0]?.totalHits || 0;
    const todayUniqueVisitors = todayStats[0]?.uniqueVisitors || 0;

    // All-time total visits & unique IP-day records
    const allTimeHits = await VisitorModel.aggregate([
        {
            $group: {
                _id: null,
                totalHits: { $sum: "$count" },
                totalRecords: { $sum: 1 },
            },
        },
    ]);

    const totalVisits = allTimeHits[0]?.totalHits || 0;
    const totalUniqueVisitors = allTimeHits[0]?.totalRecords || 0;

    // Daily breakdown for charts (past N days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split("T")[0];

    const dailyBreakdown = await VisitorModel.aggregate([
        { $match: { date: { $gte: startDateStr } } },
        {
            $group: {
                _id: "$date",
                totalVisits: { $sum: "$count" },
                uniqueVisitors: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const dailyTrend = dailyBreakdown.map((item) => ({
        date: item._id,
        totalVisits: item.totalVisits,
        uniqueVisitors: item.uniqueVisitors,
    }));

    return {
        todayTotalVisits,
        todayUniqueVisitors,
        totalVisits,
        totalUniqueVisitors,
        dailyTrend,
    };
};

export const visitorServices = {
    recordVisit,
    getVisitorAnalytics,
};
