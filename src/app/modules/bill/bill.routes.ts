import { Router } from "express";
import auth from "../../middlewares/auth";
import { billControllers } from "./bill.controllers";

const router = Router();

router.post("/", auth, billControllers.createBill);
router.post("/bulk", auth, billControllers.createBulkBills);
router.get("/", auth, billControllers.getAllBills);
router.get("/stats", auth, billControllers.getBillStats);
router.get("/:id", auth, billControllers.getBillById);
router.patch("/:id", auth, billControllers.updateBill);
router.delete("/:id", auth, billControllers.deleteBill);

export const billRoutes = router;
