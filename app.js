/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

export default (app) => {
  app.log.info("Yay! The app was loaded!");
  app.onAny(async (context) => {
    context.log.info({ event: context.name, action: context.payload.action });
  });
};
