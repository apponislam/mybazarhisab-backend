import { Types } from "mongoose";

export type VisitorPlatform = "WEB" | "ANDROID" | "IOS" | "APP";

export interface IVisitor {
    _id?: Types.ObjectId;
    ipAddress: string;
    userId?: Types.ObjectId;
    userAgent?: string;
    platform: VisitorPlatform;
    path?: string;
    date: string;
    count: number;
    lastVisitedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
