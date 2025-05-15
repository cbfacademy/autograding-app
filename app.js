/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

export default (app) => {
  app.on("repository.created", async (context) => {
    context.log.info("Received repository.created event!");
    console.log("Received repository.created event!");
  });
  app.onAny(async (context) => {
    context.log.error({ event: context.name, action: context.payload.action });
  });
};
