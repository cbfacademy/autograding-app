import { createNodeMiddleware, createProbot } from "probot";
import app from "./app.js";

const middleware = createNodeMiddleware(app, { probot: createProbot() });

export const probotApp = (req, res) => {
  middleware(req, res, () => {
    res.writeHead(404);
    res.end();
  });
};
