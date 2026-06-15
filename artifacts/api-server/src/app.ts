import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { corsOptions, requireApiToken, aiRateLimiter } from "./lib/security";

const app: Express = express();

// Resolve the real client IP from the Replit proxy's X-Forwarded-For header
// so rate limiting buckets per user rather than per proxy.
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Throttle the AI endpoint (OpenAI cost / abuse protection) before auth so a
// flood is capped per IP regardless of token validity.
app.use("/api/assistant/messages", aiRateLimiter);

// Require the shared app token on all mutating (non-GET) endpoints.
app.use("/api", requireApiToken);

app.use("/api", router);

export default app;
