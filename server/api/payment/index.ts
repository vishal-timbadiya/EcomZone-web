import { Router } from "express";
import razorpayCreateRouter from "./razorpay/create/route";
import razorpayVerifyRouter from "./razorpay/verify/route";

const router = Router();

router.use("/razorpay/create", razorpayCreateRouter);
router.use("/razorpay/verify", razorpayVerifyRouter);
// NOTE: /razorpay/webhook is deliberately mounted directly in server.ts, ahead of
// the payment rate limiter, so retried webhook deliveries are never dropped.

export default router;
