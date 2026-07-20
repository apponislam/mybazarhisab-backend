import mongoose, { Schema } from "mongoose";
import { IFaq } from "./faq.interface";

const faqSchema = new Schema<IFaq>(
    {
        question: {
            type: String,
            required: [true, "Question is required"],
            trim: true,
        },
        answer: {
            type: String,
            required: [true, "Answer is required"],
            trim: true,
        },
        category: {
            type: String,
            default: "GENERAL",
            trim: true,
        },
        orderIndex: {
            type: Number,
            default: 0,
        },
        isPublished: {
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

faqSchema.index({ isPublished: 1, isDeleted: 1, orderIndex: 1 });

export const FaqModel = mongoose.model<IFaq>("Faq", faqSchema);
