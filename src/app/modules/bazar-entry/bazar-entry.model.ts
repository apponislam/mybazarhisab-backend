import mongoose, { Schema } from "mongoose";
import { BazarEntry } from "./bazar-entry.interface";

const bazarEntrySchema = new Schema<BazarEntry>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product ID is required"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0.001, "Quantity must be greater than 0"],
            default: 1,
        },
        unit: {
            type: String,
            enum: ["KG", "LITER", "PIECE", "GM"],
            trim: true,
        },
        date: {
            type: Date,
            default: Date.now,
            required: [true, "Date is required"],
        },
        notes: {
            type: String,
            trim: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: "Group",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes
bazarEntrySchema.index({ user: 1, isDeleted: 1, date: -1, createdAt: -1 });
bazarEntrySchema.index({ group: 1, isDeleted: 1, date: -1, createdAt: -1 });
bazarEntrySchema.index({ product: 1, isDeleted: 1 });

export const BazarEntryModel = mongoose.model<BazarEntry>("BazarEntry", bazarEntrySchema);
