import { Router } from "express";
import seedRouter from "./route";

const router = Router();

router.use("/", seedRouter);

export default router;
