/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
import sodium from 'tweetsodium';

/**
 * Creates or updates a repository variable using the GitHub REST API.
 *
 * Checks if the variable exists by listing all variables for the repository.
 * If the variable exists, it updates (PATCH) the value; otherwise, it creates (POST) the variable.
 *
 * @param {import('@octokit/rest').Octokit} octokit - An authenticated Octokit instance.
 * @param {Object} params - Parameters for the variable operation.
 * @param {string} params.owner - The repository owner.
 * @param {string} params.repo - The repository name.
 * @param {string} params.name - The variable name.
 * @param {string} params.value - The variable value.
 * @throws Will log and rethrow errors if the API requests fail.
 */
async function createOrUpdateRepoVariable(octokit, params) {
  const { owner, repo, name } = params;
  let exists = false;

  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/actions/variables', { owner, repo });

    exists = data.variables.some(v => v.name === name);
  } catch (err) {
    app.log.error(`Failed to list variables for ${owner}/${repo}:`, err);

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

    await octokit.request(params);
  } catch (err) {
    app.log.error(`Failed to create or update variable ${name} for ${owner}/${repo}:`, err);

    throw err;
  }
}

export default (app) => {
  app.on('repository.created', async (context) => {
    const { owner, name } = context.payload.repository;
    const ownerLogin = owner.login;
    context.log.info(`Received repository.created for ${ownerLogin}/${name}`);

    // Get the public key for the repo (needed to encrypt secrets)
    const { data: publicKey } = await context.octokit.actions.getRepoPublicKey({
      owner: ownerLogin,
      repo: name,
    });
    context.log.info('Public key retrieved');
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
    context.log.info('CLASSROOM_TOKEN secret added');
    // Add or update the PR_AGENT_BOT_USER variable
    await createOrUpdateRepoVariable(context.octokit, {
      owner: ownerLogin,
      repo: name,
      name: 'PR_AGENT_BOT_USER',
      value: process.env.PR_AGENT_BOT_USER,
    });
    context.log.info('PR_AGENT_BOT_USER variable added');
    context.log.info(`Added secrets and variables to ${ownerLogin}/${name}`);
  });
  app.onAny(async (context) => {
    context.log.info({ event: context.name, action: context.payload.action });
  });
};
