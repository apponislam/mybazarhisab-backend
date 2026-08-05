import mongoose from "mongoose";
import PDFDocument from "pdfkit";
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
            quantityText: `(${qty} ${entry.unit || "PIECE"} @ TK ${entry.price})`,
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

    combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    const totalCombined = totalBazar + totalBills;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        const generatedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

        // ─── Header ─────────────────────────────────────────────────────────────
        doc.font("Helvetica-Bold").fontSize(22).fillColor("#1f2937").text("Bazar Hisab", 40, 40);
        doc.font("Helvetica").fontSize(9.5).fillColor("#4b5563").text("Consolidated Monthly Statement", 40, 66);

        // Header Meta (Right Aligned)
        doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563").text("Statement Period: ", 360, 45, { continued: true });
        doc.font("Helvetica-Bold").fillColor("#1f2937").text(periodText);

        doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563").text("Generated Date: ", 360, 60, { continued: true });
        doc.font("Helvetica-Bold").fillColor("#1f2937").text(generatedDate);

        // Header Bottom Border Line
        doc.moveTo(40, 85).lineTo(555, 85).lineWidth(2).strokeColor("#1f2937").stroke();

        // ─── Summary Box (3 Columns) ──────────────────────────────────────────
        const sumY = 98;
        const sumH = 46;
        const colW = 171.6;

        // Background box & border
        doc.rect(40, sumY, 515, sumH).fillAndStroke("#f9fafb", "#d1d5db");

        // Column Dividers
        doc.moveTo(40 + colW, sumY).lineTo(40 + colW, sumY + sumH).lineWidth(1).strokeColor("#d1d5db").stroke();
        doc.moveTo(40 + colW * 2, sumY).lineTo(40 + colW * 2, sumY + sumH).lineWidth(1).strokeColor("#d1d5db").stroke();

        // Summary Col 1: Total Combined
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#6b7280").text("TOTAL COMBINED", 52, sumY + 10);
        doc.font("Helvetica-Bold").fontSize(13).fillColor("#1f2937").text(`TK ${totalCombined.toFixed(2)}`, 52, sumY + 24);

        // Summary Col 2: Bazar Expenses
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#6b7280").text("BAZAR EXPENSES", 52 + colW, sumY + 10);
        doc.font("Helvetica-Bold").fontSize(13).fillColor("#059669").text(`TK ${totalBazar.toFixed(2)}`, 52 + colW, sumY + 24);

        // Summary Col 3: Utility Bills
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#6b7280").text("UTILITY BILLS", 52 + colW * 2, sumY + 10);
        doc.font("Helvetica-Bold").fontSize(13).fillColor("#2563eb").text(`TK ${totalBills.toFixed(2)}`, 52 + colW * 2, sumY + 24);

        // ─── Table Section ──────────────────────────────────────────────────────
        const drawTableHeader = (yPos: number) => {
            doc.rect(40, yPos, 515, 22).fillAndStroke("#f3f4f6", "#d1d5db");
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#1f2937");

            doc.text("DATE", 48, yPos + 7, { width: 65 });
            doc.text("DESCRIPTION / DETAILS", 118, yPos + 7, { width: 175 });
            doc.text("TYPE", 298, yPos + 7, { width: 45 });
            doc.text("CATEGORY", 350, yPos + 7, { width: 65 });
            doc.text("ADDED BY", 420, yPos + 7, { width: 65 });
            doc.text("AMOUNT", 490, yPos + 7, { width: 57, align: "right" });
        };

        let currentY = sumY + sumH + 15;
        drawTableHeader(currentY);
        currentY += 22;

        combined.forEach((item, index) => {
            if (currentY > 760) {
                doc.addPage();
                currentY = 40;
                drawTableHeader(currentY);
                currentY += 22;
            }

            const dateStr = item.date.toISOString().split("T")[0];

            // Row Bottom Border Line
            doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).lineWidth(0.5).strokeColor("#e5e7eb").stroke();

            // Date
            doc.font("Helvetica").fontSize(8).fillColor("#4b5563").text(dateStr, 48, currentY + 5, { width: 65 });

            // Description + Quantity Subtext
            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#111827").text(item.name, 118, currentY + 4, { width: 175, lineBreak: false });
            if (item.quantityText) {
                const nameWidth = doc.widthOfString(item.name);
                doc.font("Helvetica").fontSize(7).fillColor("#6b7280").text(` ${item.quantityText}`, 118 + nameWidth + 2, currentY + 5, { width: 175 - nameWidth, lineBreak: false });
            }

            // Type Badge (Bazar vs Bill)
            if (item.type === "BAZAR") {
                doc.roundedRect(296, currentY + 3, 44, 13, 3).fillAndStroke("#e6f4ea", "#a7f3d0");
                doc.font("Helvetica-Bold").fontSize(7).fillColor("#065f46").text("BAZAR", 296, currentY + 6, { width: 44, align: "center" });
            } else {
                doc.roundedRect(296, currentY + 3, 44, 13, 3).fillAndStroke("#e8f0fe", "#bfdbfe");
                doc.font("Helvetica-Bold").fontSize(7).fillColor("#1e3a8a").text("BILL", 296, currentY + 6, { width: 44, align: "center" });
            }

            // Category & Added By
            doc.font("Helvetica").fontSize(8).fillColor("#374151").text(item.category, 350, currentY + 5, { width: 65, lineBreak: false });
            doc.font("Helvetica").fontSize(8).fillColor("#374151").text(item.user, 420, currentY + 5, { width: 65, lineBreak: false });

            // Amount
            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#111827").text(`TK ${item.amount.toFixed(2)}`, 490, currentY + 4, { width: 57, align: "right" });

            currentY += 19;
        });

        if (combined.length === 0) {
            doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("No matching entries found for the selected period.", 40, currentY + 20, { align: "center", width: 515 });
        }

        doc.end();
    });
};

export const dashboardServices = {
    getAdminDashboardStats,
    getUserDashboardStats,
    getMonthlyExpenseTrend,
    getProductPriceGrowthTrend,
    getStatementHtml,
    getStatementPdf,
};
