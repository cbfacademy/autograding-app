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

export const probotApp = createNodeMiddleware(app, { probot: createProbot({ log }) });
