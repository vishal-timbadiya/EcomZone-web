import { Router } from "express";
import loginRouter from "./login/route";
import signupRouter from "./signup/route";
import profileRouter from "./profile/route";
import forgotPasswordRouter from "./forgot-password/route";
import subAdminRouter from "./sub-admin/index";

const router = Router();

router.use("/login", loginRouter);
router.use("/signup", signupRouter);
router.use("/profile", profileRouter);
router.use("/forgot-password", forgotPasswordRouter);
router.use("/sub-admin", subAdminRouter);

export default router;
