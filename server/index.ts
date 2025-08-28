import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectToDatabase } from "./db";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from parent directory
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

/**
 * Logging helper
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

/**
 * CORS setup
 * Important: credentials:true is required for cookies (JWT)
 */
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://smart-q-new.onrender.com",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked origin:", origin);
        // In dev, allow everything to avoid auth issues
        if (process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * Custom request logger
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Error handler
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errorDetails =
    process.env.NODE_ENV === "development" ? err.stack : undefined;

  log(`Error: ${message} (Status: ${status})`, "error");
  res.status(status).json({ message, error: errorDetails });
});

/**
 * Start server
 */
(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in environment");
    }

    await connectToDatabase(process.env.MONGODB_URI);
    log("✅ Connected to MongoDB successfully");

    const server = await registerRoutes(app);

    const port = parseInt(process.env.PORT || "5002", 10);
    server.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`🚀 API server running on http://localhost:${port}`);
      }
    );
  } catch (error) {
    log(`❌ Failed to start server: ${(error as Error).message}`, "error");
    process.exit(1);
  }
})();
