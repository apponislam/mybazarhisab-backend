import { Types } from "mongoose";

export type BazarUnit = "KG" | "LITER" | "PIECE" | "GM";

export interface BazarEntry {
    product: Types.ObjectId;
    price: number;
    quantity: number;
    unit?: BazarUnit;
    date: Date;
    notes?: string;
    user: Types.ObjectId;
    group?: Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
