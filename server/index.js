import express from "express"
import dotenv from "dotenv"
import connectDb from "./utils/connectDb.js"
import authRouter from "./routes/auth.route.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import userRouter from "./routes/user.route.js"
import notesRouter from "./routes/genrate.route.js"
import pdfRouter from "./routes/pdf.route.js"
import creditRouter from "./routes/credits.route.js"
dotenv.config()

const app = express()

// Trust proxy — required for Render/Railway (secure cookies behind reverse proxy)
app.set("trust proxy", 1)

const allowedOrigins = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : ["http://localhost:5173", "http://localhost:3000"])
    .map(url => url.trim().replace(/\/$/, ""));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(normalized) || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json())
app.use(cookieParser())

const PORT = process.env.PORT || 5000

app.get("/", (req, res) => {
    res.json({ message: "EduNote Backend Running 🚀" })
})

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/notes", notesRouter)
app.use("/api/pdf", pdfRouter)
app.use("/api/credit", creditRouter)

// Connect to DB first, then start server
connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`)
    })
}).catch((err) => {
    console.error("❌ Failed to start server:", err.message)
    process.exit(1)
})