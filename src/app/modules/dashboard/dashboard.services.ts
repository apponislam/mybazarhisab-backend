import mongoose from "mongoose";
// puppeteer-core will be imported dynamically via import()
// Dynamic import of @sparticuz/chromium-min for Vercel compatibility
import { getStatementHtmlTemplate } from "./statement";
import { UserModel } from "../auth/auth.model";
import { GroupModel } from "../group/group.model";
import { ProductModel } from "../product/product.model";
import { BazarEntryModel } from "../bazar-entry/bazar-entry.model";
import { BillModel } from "../bill/bill.model";
import { visitorServices } from "../visitor/visitor.services";

// Helper to cast string IDs to ObjectIds in aggregate matches
const normalizeFilterForAggregation = (filter: any) => {
    const normalized = { ...filter };
    if (normalized.group && typeof normalized.group === "string" && mongoose.Types.ObjectId.isValid(normalized.group)) {
        normalized.group = new mongoose.Types.ObjectId(normalized.group);
    }
    if (normalized.user && typeof normalized.user === "string" && mongoose.Types.ObjectId.isValid(normalized.user)) {
        normalized.user = new mongoose.Types.ObjectId(normalized.user);
    }
    return normalized;
};

// Shared helpers for aggregations
const getExpenseAggregation = async (filter: any, start: Date, end: Date): Promise<number> => {
    const matchFilter = normalizeFilterForAggregation(filter);
    const result = await BazarEntryModel.aggregate([
        {
            $match: {
                ...matchFilter,
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
    const matchFilter = normalizeFilterForAggregation(filter);
    const result = await BillModel.aggregate([
        {
            $match: {
                ...matchFilter,
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
    const matchFilter = normalizeFilterForAggregation(filter);

    const result = await model.aggregate([
        {
            $match: {
                ...matchFilter,
                date: { $gte: startOfYear, $lte: endOfYear },
            },
        },
        {
            $group: {
                _id: { $month: "$date" },
                total: isBazarModel ? { $sum: { $multiply: ["$price", "$quantity"] } } : { $sum: "$amount" },
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
    const matchFilter = normalizeFilterForAggregation(filter);

    const result = await model.aggregate([
        {
            $match: {
                ...matchFilter,
                date: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        {
            $group: {
                _id: { $dayOfMonth: "$date" },
                total: isBazarModel ? { $sum: { $multiply: ["$price", "$quantity"] } } : { $sum: "$amount" },
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

    // Fetch visitor statistics
    const visitorStats = await visitorServices.getVisitorAnalytics(7);

    return {
        totalUsers,
        totalGroups,
        totalProducts,
        totalBazarEntries,
        totalBills,
        averageBazarEntry: parseFloat(averageBazarEntry.toFixed(2)),
        totalBillAmount: parseFloat(totalBillAmount.toFixed(2)),
        averageBillAmount: parseFloat(averageBillAmount.toFixed(2)),
        visitors: {
            todayTotalVisits: visitorStats.todayTotalVisits,
            todayUniqueVisitors: visitorStats.todayUniqueVisitors,
            todayWebVisits: visitorStats.todayWebVisits,
            todayWebUnique: visitorStats.todayWebUnique,
            todayAppVisits: visitorStats.todayAppVisits,
            todayAppUnique: visitorStats.todayAppUnique,
            todayPlatformBreakdown: visitorStats.todayPlatformBreakdown,
            totalVisits: visitorStats.totalVisits,
            totalUniqueVisitors: visitorStats.totalUniqueVisitors,
            allTimePlatformBreakdown: visitorStats.allTimePlatformBreakdown,
            dailyTrend: visitorStats.dailyTrend,
        },
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

    // 2. Total group bazar entries + bills (or user's own if no group)
    const groupEntriesFilter: any = { isDeleted: false };
    if (groupId) {
        groupEntriesFilter.group = groupId;
    } else {
        groupEntriesFilter.user = userId;
    }
    const totalBazarCount = await BazarEntryModel.countDocuments(groupEntriesFilter);
    const totalBillCount = await BillModel.countDocuments(groupEntriesFilter);
    const totalGroupBazarAndBills = totalBazarCount + totalBillCount;

    // 3. Total daily entries + bills created by the user personally
    const myBazarCount = await BazarEntryModel.countDocuments({
        user: userId,
        isDeleted: false,
    });
    const myBillCount = await BillModel.countDocuments({
        user: userId,
        isDeleted: false,
    });
    const totalMyBazarAndBills = myBazarCount + myBillCount;

    // 4. Total products created by the user personally
    const totalNewProductsCreatedByMe = await ProductModel.countDocuments({
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

    const [thisMonthBazarExpense, prevMonthBazarExpense, thisYearBazarExpense, prevYearBazarExpense, thisMonthBillExpense, prevMonthBillExpense, thisYearBillExpense, prevYearBillExpense] = await Promise.all([
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
        totalGroupBazarAndBills,
        totalMyBazarAndBills,
        totalNewProductsCreatedByMe,
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

        const [bazarMap, billMap] = await Promise.all([getMonthlyTrendAggregation(BazarEntryModel, groupEntriesFilter, year, month), getMonthlyTrendAggregation(BillModel, groupEntriesFilter, year, month)]);

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

        const [bazarMap, billMap] = await Promise.all([getYearlyTrendAggregation(BazarEntryModel, groupEntriesFilter, year), getYearlyTrendAggregation(BillModel, groupEntriesFilter, year)]);

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

const getProductPriceGrowthTrend = async (userId: string, groupId: string | undefined, productId: string, query: { page?: string; limit?: string }) => {
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

    const entries = await BazarEntryModel.find(filter).sort({ date: 1, createdAt: 1 });

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

const getStatementHtml = async (userId: string, groupId: string | undefined, query: { startDate?: string; endDate?: string; year?: string }) => {
    let start: Date;
    let end: Date;
    let periodText: string;

    const currentYear = new Date().getFullYear();

    if (query.year) {
        const y = parseInt(query.year);
        start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
        end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
        periodText = `Year ${y}`;
    } else if (query.startDate || query.endDate) {
        if (query.startDate) {
            const [y, m, d] = query.startDate.split("-").map(Number);
            start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
        } else {
            start = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
        }

        if (query.endDate) {
            const [y, m, d] = query.endDate.split("-").map(Number);
            end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
        } else {
            end = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
        }

        const format = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
        periodText = `${format(start)} - ${format(end)}`;
    } else {
        const now = new Date();
        start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
        end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
        periodText = now.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    }

    const groupEntriesFilter: any = { isDeleted: false };
    if (groupId) {
        groupEntriesFilter.group = new mongoose.Types.ObjectId(groupId);
    } else {
        groupEntriesFilter.user = new mongoose.Types.ObjectId(userId);
    }

    const filter = {
        ...groupEntriesFilter,
        date: { $gte: start, $lte: end },
    };

    const bazarEntries = await BazarEntryModel.find(filter).populate("product").populate("user", "name email phone profileImage").sort({ date: -1, createdAt: -1 });

    const bills = await BillModel.find(filter).populate("user", "name email phone profileImage").sort({ date: -1, createdAt: -1 });

    interface StatementItem {
        date: Date;
        type: "BAZAR" | "BILL";
        name: string;
        category: string;
        quantityText?: string;
        user: string;
        amount: number;
    }

    const combined: StatementItem[] = [];

    let totalBazar = 0;
    bazarEntries.forEach((entry) => {
        const qty = entry.quantity || 1;
        const totalCost = entry.price * qty;
        totalBazar += totalCost;
        combined.push({
            date: entry.date,
            type: "BAZAR",
            name: (entry.product as any)?.name || "Unknown Product",
            category: "GROCERY",
            quantityText: `(${qty} ${entry.unit || "PIECE"} @ ৳${entry.price})`,
            user: (entry.user as any)?.name || "Unknown",
            amount: totalCost,
        });
    });

    let totalBills = 0;
    bills.forEach((bill) => {
        totalBills += bill.amount;
        combined.push({
            date: bill.date,
            type: "BILL",
            name: bill.title,
            category: bill.category,
            user: (bill.user as any)?.name || "Unknown",
            amount: bill.amount,
        });
    });

    // Sort combined by date descending
    combined.sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalCombined = totalBazar + totalBills;

    // Build Table Rows HTML
    let tableRows = "";
    combined.forEach((item) => {
        const dateStr = item.date.toISOString().split("T")[0];
        const badgeClass = item.type === "BAZAR" ? "badge-bazar" : "badge-bill";
        const badgeText = item.type === "BAZAR" ? "Bazar" : "Bill";
        const quantityHtml = item.quantityText ? ` <span class="qty-subtext">${item.quantityText}</span>` : "";

        tableRows += `
            <tr class="item-row" data-type="${item.type}">
                <td class="date-cell">${dateStr}</td>
                <td class="desc-cell">${item.name}${quantityHtml}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>${item.category}</td>
                <td>${item.user}</td>
                <td class="amount-cell">৳${item.amount.toFixed(2)}</td>
            </tr>
        `;
    });

    return getStatementHtmlTemplate({
        periodText,
        generatedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        totalCombined: totalCombined.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalBazar: totalBazar.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalBills: totalBills.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        tableRows,
        tableStyle: combined.length === 0 ? "display: none;" : "display: table;",
        emptyStateStyle: combined.length === 0 ? "display: block;" : "display: none;",
    });
};

const getStatementPdf = async (userId: string, groupId: string | undefined, query: { startDate?: string; endDate?: string; year?: string }): Promise<Buffer> => {
    // 1. Generate dynamic HTML using the existing helper
    const htmlContent = await getStatementHtml(userId, groupId, query);

    // 2. Launch Puppeteer dynamically (Vercel-compatible in production, local standard Puppeteer in development)
    let browser;
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
        try {
            const puppeteerCore = (await import("puppeteer-core")).default;
            const chromium = (await import("@sparticuz/chromium-min")).default;
            const execPath = await chromium.executablePath();
            browser = await puppeteerCore.launch({
                args: chromium.args,
                executablePath: execPath,
                headless: true,
            });
        } catch (err) {
            console.error("Puppeteer launch failed on Vercel:", err);
            throw err;
        }
    } else {
                const puppeteer = (await import("puppeteer")).default;
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
    }

    try {
        const page = await browser.newPage();

        // Load the HTML content directly
        await page.setContent(htmlContent, {
            waitUntil: "domcontentloaded",
        });

        // Print page to PDF buffer
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "15mm",
                bottom: "15mm",
                left: "15mm",
                right: "15mm",
            },
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
    } catch (error) {
        await browser.close();
        throw error;
    }
};

export const dashboardServices = {
    getAdminDashboardStats,
    getUserDashboardStats,
    getMonthlyExpenseTrend,
    getProductPriceGrowthTrend,
    getStatementHtml,
    getStatementPdf,
};
