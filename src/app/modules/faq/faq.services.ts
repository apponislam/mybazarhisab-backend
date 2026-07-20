import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { IFaq } from "./faq.interface";
import { FaqModel } from "./faq.model";

const DEFAULT_FAQS: Partial<IFaq>[] = [
    {
        question: "How do I create and share a family household group?",
        answer: "After signing in, click 'Create Group', set your household name and monthly budget limit. You will receive a unique group code that you can copy and send to family members or flatmates.",
        category: "GENERAL",
        orderIndex: 1,
        isPublished: true,
    },
    {
        question: "How many members can join a single household group?",
        answer: "Each My Bazar Hisab group supports up to 20 members, allowing all family members and roommates to log daily market expenses simultaneously.",
        category: "GENERAL",
        orderIndex: 2,
        isPublished: true,
    },
    {
        question: "How do unit quantities work for groceries?",
        answer: "When logging daily bazar items, you can specify exact units such as KG, GM, Litre, Piece, or Packet along with the total price to maintain clear inventory logs.",
        category: "GENERAL",
        orderIndex: 3,
        isPublished: true,
    },
    {
        question: "Is our family spending data private and secure?",
        answer: "Yes. All transactions are encrypted. Only individuals who enter your secret household group invitation code can view or contribute entries.",
        category: "SECURITY",
        orderIndex: 4,
        isPublished: true,
    },
];

const createFaq = async (data: Partial<IFaq>) => {
    return await FaqModel.create(data);
};

const getAllFaqs = async (isAdmin: boolean, query: { category?: string }) => {
    const filter: any = { isDeleted: false };
    if (!isAdmin) {
        filter.isPublished = true;
    }
    if (query.category) {
        filter.category = query.category;
    }

    const faqs = await FaqModel.find(filter).sort({ orderIndex: 1, createdAt: -1 });

    if (faqs.length === 0 && !query.category && !isAdmin) {
        return DEFAULT_FAQS;
    }

    return faqs;
};

const updateFaq = async (id: string, data: Partial<IFaq>) => {
    const faq = await FaqModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!faq) {
        throw new ApiError(httpStatus.NOT_FOUND, "FAQ item not found");
    }

    return faq;
};

const deleteFaq = async (id: string) => {
    const faq = await FaqModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!faq) {
        throw new ApiError(httpStatus.NOT_FOUND, "FAQ item not found");
    }

    return faq;
};

export const faqServices = {
    createFaq,
    getAllFaqs,
    updateFaq,
    deleteFaq,
};
