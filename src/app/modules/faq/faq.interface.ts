export interface IFaq {
    question: string;
    answer: string;
    category?: string;
    orderIndex?: number;
    isPublished?: boolean;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
