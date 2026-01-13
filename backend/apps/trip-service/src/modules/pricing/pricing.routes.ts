import { Router } from "express";
import { PricingController } from "./pricing.controller.js";

const router = Router();
const controller = new PricingController();

router.post("/preview", controller.preview);

export default router;
