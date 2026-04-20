import { Router } from "express";
import emailSendRouter from "./send/route";

const router = Router();

router.use("/send", emailSendRouter);

export default router;
