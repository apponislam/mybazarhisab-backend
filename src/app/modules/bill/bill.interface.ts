import { Types } from "mongoose";

export type BillCategory = "RENT" | "TRAVEL" | "WIFI" | "ELECTRICITY" | "UTILITIES" | "OTHERS";

export interface Bill {
    user: Types.ObjectId;
    group?: Types.ObjectId;
    category: BillCategory;
    title: string;
    amount: number;
    date: Date;
    notes?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
