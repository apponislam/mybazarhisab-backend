import { Router } from "express";
import auth from "../../middlewares/auth";
import { productControllers } from "./product.controllers";

const router = Router();

router.post("/", auth, productControllers.createProduct);
router.get("/", auth, productControllers.getAllProducts);
router.get("/:id", auth, productControllers.getProductById);
router.patch("/:id", auth, productControllers.updateProduct);
router.delete("/:id", auth, productControllers.deleteProduct);

export const productRoutes = router;
