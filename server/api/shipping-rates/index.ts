import { Router } from "express";
import shippingRouter from "./route";

const router = Router();

router.use("/", shippingRouter);

export default router;
