import { getTransformStream } from "@probot/pino";
import pino from "pino";
import { createNodeMiddleware, createProbot } from "probot";
import app from "./app.js";

if (process.env.PRIVATE_KEY_BASE64) {
  process.env.PRIVATE_KEY = Buffer.from(
    process.env.PRIVATE_KEY_BASE64,
    "base64"
  ).toString("utf8");
}

const log = pino(
  {
    transport: {
      target: "cloud-pine",
      options: {
        cloudLoggingOptions: {
          skipInit: true,
          sync: true,
        },
      },
    },
  },
  getTransformStream()
);
const middleware = createNodeMiddleware(app, { probot: createProbot() });

export const probotApp = (req, res) => {
  console.log(`Starting probotApp for URL: ${req.url}`);
  try {
    console.log("Calling middleware");
    middleware(req, res, () => {
      console.log("Middleware callback called");
      if (!res.headersSent) {
        res.writeHead(404);
        res.end();
      }
    });
  } catch (err) {
    // Custom error handling
    console.error("Unhandled error in Probot middleware:", err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  }
};
