/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

/**
 * Creates or updates a repository variable using the GitHub REST API.
 *
 * Checks if the variable exists by listing all variables for the repository.
 * If the variable exists, it updates (PATCH) the value; otherwise, it creates (POST) the variable.
 *
 * @param {import('probot').Context} context - A Probot context object with an authenticated Octokit instance.
 * @param {Object} params - Parameters for the variable operation.
 * @param {string} params.owner - The repository owner.
 * @param {string} params.repo - The repository name.
 * @param {string} params.name - The variable name.
 * @param {string} params.value - The variable value.
 * @throws Will log and rethrow errors if the API requests fail.
 */
async function createOrUpdateRepoVariable(context, params) {
  const { owner, repo, name } = params;
  let exists = false;

  try {
    const { data } = await context.octokit.request('GET /repos/{owner}/{repo}/actions/variables', { owner, repo });

    exists = data.variables.some(v => v.name === name);
  } catch (err) {
    context.log.error(`Failed to list variables for ${owner}/${repo}:`, err);

    throw err;
  }

  try {
    if (exists) {
      params.method = 'PATCH';
      params.url = '/repos/{owner}/{repo}/actions/variables/{name}';
    } else {
      params.method = 'POST';
      params.url = '/repos/{owner}/{repo}/actions/variables';
    }

    await context.octokit.request(params);
  } catch (err) {
    context.log.error(`Failed to create or update variable ${name} for ${owner}/${repo}:`, err);

    throw err;
  }
}

export default (app) => {
  app.on('repository.created', async (context) => {
    context.log.error('Starting repository.created');
    /* const { owner, name } = context.payload.repository;
    const ownerLogin = owner.login;
    context.log.error(`Received repository.created for ${ownerLogin}/${name}`);

    // Get the public key for the repo (needed to encrypt secrets)
    const { data: publicKey } = await context.octokit.actions.getRepoPublicKey({
      owner: ownerLogin,
      repo: name,
    });
    context.log.error('Public key retrieved');
    // Encrypt the secret value
    const secretValue = process.env.CLASSROOM_TOKEN;
    const key = publicKey.key;
    const messageBytes = Buffer.from(secretValue);
    const keyBytes = Buffer.from(key, 'base64');
    const encryptedBytes = sodium.seal(messageBytes, keyBytes);
    const encryptedValue = Buffer.from(encryptedBytes).toString('base64');

    // Add the CLASSROOM_TOKEN secret
    await context.octokit.actions.createOrUpdateRepoSecret({
      owner: ownerLogin,
      repo: name,
      secret_name: 'CLASSROOM_TOKEN',
      encrypted_value: encryptedValue,
      key_id: publicKey.key_id,
    });
    context.log.error('CLASSROOM_TOKEN secret added');
    // Add or update the PR_AGENT_BOT_USER variable
    await createOrUpdateRepoVariable(context, {
      owner: ownerLogin,
      repo: name,
      name: 'PR_AGENT_BOT_USER',
      value: process.env.PR_AGENT_BOT_USER,
    });
    context.log.error('PR_AGENT_BOT_USER variable added');
    context.log.error(`Added secrets and variables to ${ownerLogin}/${name}`); */
  });
  app.onAny(async (context) => {
    context.log.error({ event: context.name, action: context.payload.action });
  });
};
