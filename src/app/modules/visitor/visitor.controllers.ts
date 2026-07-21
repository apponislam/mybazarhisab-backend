import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { visitorServices } from "./visitor.services";
import { VisitorPlatform } from "./visitor.interface";

const trackVisit = catchAsync(async (req: Request, res: Response) => {
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "127.0.0.1";
    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : (rawIp as string).split(",")[0].trim();
    const userAgent = req.headers["user-agent"] || "";
    const path = req.body.path || req.headers["referer"] || "/";
    const userId = (req as any).user?._id || req.body.userId;

    // Detect or read platform (WEB, APP, ANDROID, IOS)
    let platform: VisitorPlatform = "WEB";
    const reqPlatform = (req.body.platform || req.headers["x-platform"] || "").toString().toUpperCase();

    if (["WEB", "ANDROID", "IOS", "APP"].includes(reqPlatform)) {
        platform = reqPlatform as VisitorPlatform;
    } else if (userAgent.includes("okhttp") || userAgent.includes("CFNetwork") || userAgent.includes("Dalvik") || userAgent.includes("BazarHisabApp")) {
        platform = "APP";
    }

    const result = await visitorServices.recordVisit({
        ipAddress,
        userAgent,
        platform,
        path,
        userId,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Visit recorded successfully",
        data: result,
    });
});

const getVisitorStats = catchAsync(async (req: Request, res: Response) => {
    const days = req.query.days ? Number(req.query.days) : 30;
    const result = await visitorServices.getVisitorAnalytics(days);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Visitor analytics fetched successfully",
        data: result,
    });
});

export const visitorControllers = {
    trackVisit,
    getVisitorStats,
};
