import mongoose, { Schema } from "mongoose";
import { Bill } from "./bill.interface";

const billSchema = new Schema<Bill>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: "Group",
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: {
                values: ["RENT", "TRAVEL", "WIFI", "ELECTRICITY", "GAS", "WATER", "MAID", "MAINTENANCE", "SUBSCRIPTION", "MOBILE", "MEDICAL", "EDUCATION", "SHOPPING", "ENTERTAINMENT", "LAUNDRY", "LOAN_EMI", "SALON_GROOMING", "GIFTS_FESTIVALS", "UTILITIES", "OTHERS"],
                message: "{VALUE} is not a valid category",
            },
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0, "Amount must be a positive number"],
        },
        date: {
            type: Date,
            required: [true, "Date is required"],
            default: Date.now,
        },
        notes: {
            type: String,
            trim: true,
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

// Compound indexes for optimal sorting/querying
billSchema.index({ group: 1, isDeleted: 1, date: -1 });
billSchema.index({ user: 1, isDeleted: 1, date: -1 });

export const BillModel = mongoose.model<Bill>("Bill", billSchema);
