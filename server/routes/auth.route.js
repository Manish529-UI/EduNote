import express from "express";
import { register, login, logOut, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter.js";

const authRouter = express.Router();

authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.get("/logout", logOut);
authRouter.post("/forgot-password", passwordResetLimiter, forgotPassword);
authRouter.post("/reset-password", passwordResetLimiter, resetPassword);

export default authRouter;