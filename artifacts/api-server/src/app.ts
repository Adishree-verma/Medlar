import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

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
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

const medlarDist = path.resolve(process.cwd(), "../medlar/dist/public");

if (fs.existsSync(medlarDist)) {
  app.use(express.static(medlarDist, { index: false }));
  app.get("/{*path}", (_req: Request, res: Response) => {
    res.sendFile(path.join(medlarDist, "index.html"));
  });
} else {
  app.get("/{*path}", (_req: Request, res: Response) => {
    res.status(503).send("Frontend not built yet. Run: pnpm --filter @workspace/medlar run build");
  });
}

export default app;
