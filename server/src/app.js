import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.type("text").send("LMS API is running ✅"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);

export default app;
