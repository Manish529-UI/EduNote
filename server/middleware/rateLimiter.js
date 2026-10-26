import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many authentication attempts from this IP, please try again after 15 minutes."
    }
});

export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 password reset requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many password reset attempts, please try again after an hour."
    }
});
