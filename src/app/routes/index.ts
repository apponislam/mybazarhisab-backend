import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { productRoutes } from "../modules/product/product.routes";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
