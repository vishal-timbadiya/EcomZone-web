import { Router } from "express";
import invoiceRouter from "./router";
import invoiceByIdRouter from "./[orderId]/route";

const router = Router();

router.use("/", invoiceRouter);
router.use("/:orderId", invoiceByIdRouter);

export default router;
