import { Router } from "express";
import auth from "../../middlewares/auth";
import checkAuth from "../../middlewares/checkAuth";
import authorize from "../../middlewares/authorized";
import { faqControllers } from "./faq.controllers";

const router = Router();

router.get("/", checkAuth, faqControllers.getAllFaqs);
router.post("/", auth, authorize(["ADMIN"]), faqControllers.createFaq);
router.patch("/:id", auth, authorize(["ADMIN"]), faqControllers.updateFaq);
router.delete("/:id", auth, authorize(["ADMIN"]), faqControllers.deleteFaq);

export const faqRoutes = router;
