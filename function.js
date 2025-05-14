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

const transform = getTransformStream({
  logFormat: "json",
  logLevelInString: true,
  sentryDsn: "https://40bf6d4b06a9e5dc6e4090fe9bd41021@o4509324107448320.ingest.de.sentry.io/4509324114002000",
});
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
  transform
);
const middleware = createNodeMiddleware(app, { probot: createProbot({ log }) });

export const probotApp = (req, res) => {
  middleware(req, res, () => {
    if (!res.headersSent) {
      res.writeHead(404);
      res.end();
    }
  });
};
