import { Types } from "mongoose";

export type ProductUnit = "KG" | "LITER" | "PIECE" | "GM";

export interface Product {
    name: string;
    unit: ProductUnit;
    photo?: string;
    is18Plus?: boolean;
    description?: string;
    user: Types.ObjectId;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
