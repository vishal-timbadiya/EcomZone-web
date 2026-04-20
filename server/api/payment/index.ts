import { Router } from "express";
import phonePeCreateRouter from "./phonepe/create/route";
import phonePeWebhookRouter from "./phonepe/webhook/route";

const router = Router();

router.use("/phonepe/create", phonePeCreateRouter);
router.use("/phonepe/webhook", phonePeWebhookRouter);

export default router;
