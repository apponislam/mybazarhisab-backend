import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";


const router = express.Router();


const moduleRoutes = [
    // {
    //     path: "/dashboard",
    //     route: dashboardRoutes,
    // },

    {
        path: "/auth",
        route: authRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
