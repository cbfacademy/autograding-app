import { createNodeMiddleware, createProbot } from "probot";
import app from "./app.js";

if (process.env.PRIVATE_KEY_BASE64) {
  process.env.PRIVATE_KEY = Buffer.from(process.env.PRIVATE_KEY_BASE64, 'base64').toString('utf8');
}

const middleware = createNodeMiddleware(app, { probot: createProbot() });

export const probotApp = (req, res) => {
  middleware(req, res, () => {
    res.writeHead(404);
    res.end();
  });
};
