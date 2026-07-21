import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { productRoutes } from "../modules/product/product.routes";
import { bazarEntryRoutes } from "../modules/bazar-entry/bazar-entry.routes";
import { groupRoutes } from "../modules/group/group.routes";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { activityRoutes } from "../modules/activity/activity.routes";
import { billRoutes } from "../modules/bill/bill.routes";
import { contactRoutes } from "../modules/contact/contact.routes";
import { feedbackRoutes } from "../modules/feedback/feedback.routes";
import { policyRoutes } from "../modules/policy/policy.routes";
import { reviewRoutes } from "../modules/review/review.routes";
import { faqRoutes } from "../modules/faq/faq.routes";
import { visitorRoutes } from "../modules/visitor/visitor.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },
    {
        path: "/products",
        route: productRoutes,
    },
    {
        path: "/bazar-entries",
        route: bazarEntryRoutes,
    },
    {
        path: "/groups",
        route: groupRoutes,
    },
    {
        path: "/dashboard",
        route: dashboardRoutes,
    },
    {
        path: "/activities",
        route: activityRoutes,
    },
    {
        path: "/bills",
        route: billRoutes,
    },
    {
        path: "/contacts",
        route: contactRoutes,
    },
    {
        path: "/feedbacks",
        route: feedbackRoutes,
    },
    {
        path: "/reviews",
        route: reviewRoutes,
    },
    {
        path: "/policies",
        route: policyRoutes,
    },
    {
        path: "/faqs",
        route: faqRoutes,
    },
    {
        path: "/visitors",
        route: visitorRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
