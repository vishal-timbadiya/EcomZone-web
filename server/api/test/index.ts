import { Router } from "express";
import testRouter from "./route";

const router = Router();

router.use("/", testRouter);

export default router;
