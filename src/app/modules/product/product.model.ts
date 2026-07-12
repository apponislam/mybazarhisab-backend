import mongoose, { Schema } from "mongoose";
import { Product } from "./product.interface";

const productSchema = new Schema<Product>(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"],
        },
        unit: {
            type: String,
            required: [true, "Unit of measurement is required"],
            trim: true,
        },
        category: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
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

// Indexes for faster lookups
productSchema.index({ user: 1, isDeleted: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

export const ProductModel = mongoose.model<Product>("Product", productSchema);
