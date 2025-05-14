import { createNodeMiddleware, createProbot } from "probot";
import app from "./app.js";
console.log('Starting probot app');
if (process.env.PRIVATE_KEY_BASE64) {
  process.env.PRIVATE_KEY = Buffer.from(process.env.PRIVATE_KEY_BASE64, 'base64').toString('utf8');
}
console.log('Environment variables set:');
const middleware = createNodeMiddleware(app, { probot: createProbot() });
console.log('Middleware created');
export const probotApp = (req, res) => {
  console.log('Received request');
  middleware(req, res, () => {
    console.log('Response sent');
    if (!res.headersSent) {
      console.log('Sending 404 response');
      res.writeHead(404);
      res.end();
    }
  });
};
