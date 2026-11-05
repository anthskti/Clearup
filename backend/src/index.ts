import express from "express";
import productRoutes from "./routes/productRoutes";
import routineRoutes from "./routes/routineRoutes";
import merchantRoutes from "./routes/merchantRoutes";
import userRoutes from "./routes/userRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import defineAssociations from "./associations";
import sequelize from "./db";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import {
  authAuditLogger,
  authBruteForceLimiter,
  authRouteLimiter,
} from "./middleware/security";
import { requireAuth } from "./middleware/requireAuth";
import { validateSecurityConfig } from "./lib/security";
import { runMigrations } from "./migrations";
import { requestLogger } from "./middleware/requestLogger";
import { globalLimiter, RATE_LIMIT_EXPOSED_HEADERS } from "./middleware/rateLimits";
import { handleExpressError } from "./lib/httpError";
import logger, { reportError } from "./lib/logger";

const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(",")
  .map((s: string) => s.trim())
  .filter(Boolean) ?? ["http://localhost:3000"];

// Security and Handshakes First
app.use(requestLogger);
app.use(
  cors({
    origin: trustedOrigins,
    credentials: true,
    exposedHeaders: RATE_LIMIT_EXPOSED_HEADERS,
  }),
);
app.set("trust proxy", 1);

// SNS → SES bounce/complaint events are posted as text/plain JSON; keep outside global rate limit.
app.use(
  "/api/webhooks",
  express.text({ type: "*/*", limit: "512kb" }),
  webhookRoutes,
);

app.use(express.json());
app.use(globalLimiter);

// Optimization (Compress before parsing saving overhead)

const createStrictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "You are creating too many routines. Please wait a while.",
});

const routineMutateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many routine updates. Please try again later.",
});

app.use(
  compression({
    level: 6, // Balance between speed and compression (1-9)
    threshold: 1024, // Only compress responses larger than 1kb
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);
// Audits all auth routes (sign-in, sign-up, sign-out, etc.)
app.use("/api/auth", authRouteLimiter, authBruteForceLimiter, authAuditLogger);

// Authorizes user and returns their effective role (user or admin)
app.get("/api/auth/me", requireAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({
    id: req.user.id,
    email: req.user.email ?? null,
    role: req.user.role ?? "user",
  });
});
// Handles all auth routes (sign-in, sign-up, sign-out, etc.)
app.all("/api/auth/*path", toNodeHandler(auth));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use(
  "/api/routines",
  (req, res, next) => {
    if (req.method === "POST") {
      return createStrictLimiter(req, res, next);
    }
    if (["PUT", "PATCH", "DELETE"].includes(req.method)) {
      return routineMutateLimiter(req, res, next);
    }
    next();
  },
  routineRoutes,
);
app.use(
  "/api/merchant",
  (req, res, next) => {
    if (req.method === "POST") {
      return createStrictLimiter(req, res, next);
    }
    next();
  },
  merchantRoutes,
);

// Health
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      ok: true,
      status: "OK",
      message: "Server and database are reachable.",
    });
  } catch (error: unknown) {
    reportError(error, { scope: "health.database" }, req.log);
    res.status(503).json({
      ok: false,
      status: "DEGRADED",
      message: "Database unavailable.",
    });
  }
});

app.use(handleExpressError);

// Initialize database and start server
const startServer = async () => {
  try {
    validateSecurityConfig();
    // Test database connection
    logger.info({ event: "startup.database.connect" }, "Testing database connection");
    await sequelize.authenticate();
    // Define associations between models 
    logger.info({ event: "startup.database.connected" }, "Database connection established");

    // Define associations between models (restarting local dev needs)
    defineAssociations();

    // Create tables from models if they don't exist
    logger.info({ event: "startup.database.sync" }, "Syncing database models");
    await sequelize.sync();

    logger.info({ event: "startup.database.migrations" }, "Running database migrations");
    await runMigrations();
    logger.info({ event: "startup.database.migrations_complete" }, "Database migrations complete");

    // Start the server
    app.listen(port, () => {
      logger.info({ event: "startup.server.listening", port: Number(port) }, "Server listening");
    });
  } catch (error: unknown) {
    reportError(error, { scope: "startup" });
    logger.flush(() => process.exit(1));
  }
};

startServer();
