import { serverless } from 'probot';
import app from './app.js';

export const probotApp = serverless(app); 