import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import configureCors from "./configs/cors.config";
import cookieParser from "cookie-parser";
import logger from "./utils/logger";
import proxy from "express-http-proxy";
import { authMiddleware } from "./middlewares/auth.middleware";

const app = express();

// middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(configureCors());
app.use(cookieParser());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req: Request) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

// setting up proxy for user service - users
app.use(
  "/v1/users",
  proxy(process.env.USER_SERVICE_URL as string, {
    ...proxyOptions,

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

// setting up proxy for user service - tokens
app.use(
  "/v1/tokens",
  proxy(process.env.USER_SERVICE_URL as string, {
    ...proxyOptions,

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

// setting up proxy for product service : products
app.use(
  "/v1/products",
  proxy(process.env.PRODUCT_SERVICE_URL as string, {
    ...proxyOptions,

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

// setting up proxy for product service : collections
app.use(
  "/v1/collections",
  proxy(process.env.PRODUCT_SERVICE_URL as string, {
    ...proxyOptions,

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`api gateway is running on port : ${PORT}`);
});
