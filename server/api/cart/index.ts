import { Router } from "express";
import calculateRouter from "./calculate/route";

const router = Router();

router.use("/calculate", calculateRouter);

export default router;
