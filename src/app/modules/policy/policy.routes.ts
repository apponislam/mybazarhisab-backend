import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { policyControllers } from "./policy.controllers";

const router = Router();

// Public routes
router.get("/", policyControllers.getAllPolicies);
router.get("/:type", policyControllers.getPolicyByType);

// Admin secured routes
router.put("/:type", auth, authorize(["ADMIN"]), policyControllers.upsertPolicy);

export const policyRoutes = router;
