/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

export default (app) => {
  app.onAny(async (context) => {
    context.log.info({ event: context.name, action: context.payload.action });
  });
};
