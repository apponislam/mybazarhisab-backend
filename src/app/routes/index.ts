import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { productRoutes } from "../modules/product/product.routes";
import { bazarEntryRoutes } from "../modules/bazar-entry/bazar-entry.routes";
import { groupRoutes } from "../modules/group/group.routes";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
