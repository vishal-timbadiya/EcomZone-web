import { Router } from "express";
import createOrderRouter from "./create/route";
import myOrdersRouter from "./my-orders/route";
import trackRouter from "./track/route";
import userRouter from "./user/route";
import orderByIdRouter from "./[orderId]/route";

const router = Router();

router.use("/create", createOrderRouter);
router.use("/my-orders", myOrdersRouter);
router.use("/track", trackRouter);
router.use("/user", userRouter);
router.use("/:orderId", orderByIdRouter);

export default router;
