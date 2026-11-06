import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import logger from "../lib/logger";
import { sanitizeLogPath } from "../lib/logPath";

export const requestLogger = pinoHttp({
  logger,
  wrapSerializers: false,
  genReqId: (_req, res) => {
    const id = randomUUID();
    res.setHeader("X-Request-ID", id);
    return id;
  },
  customAttributeKeys: {
    reqId: "requestId",
    responseTime: "durationMs",
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      path: sanitizeLogPath(req.path ?? req.url),
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  customLogLevel: (req, res, err) => {
    if (sanitizeLogPath(req.url) === "/health" && res.statusCode < 400) return "silent";
    if (err || res.statusCode >= 500) return "error";
    return res.statusCode >= 400 ? "warn" : "info";
  },
  customSuccessMessage: (req, res) => `${req.method} ${sanitizeLogPath(req.url)} ${res.statusCode}`,
  customErrorMessage: (req, res) => `${req.method} ${sanitizeLogPath(req.url)} ${res.statusCode}`,
  customErrorObject: (_req, _res, _error, value) => {
    const { err: _err, error: _errorValue, ...completion } = value;
    return completion;
  },
  quietReqLogger: true,
});
