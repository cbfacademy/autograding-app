import 'dotenv/config';
import nock from "nock";
// Requiring our app implementation
import fs from "fs";
import path from "path";
import { Probot, ProbotOctokit } from "probot";
import { fileURLToPath } from "url";
import myProbotApp from "../app.js";
// Requiring our fixtures
//import payload from "./fixtures/repositories.created.json" with { type: "json" };
const issueCreatedBody = { body: "Thanks for opening this issue!" };

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test-specific environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env.test') });

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

const payload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/repositories.created.json"), "utf-8"),
);

// Use a valid 32-byte base64-encoded public key for the test
const validPublicKey = Buffer.alloc(32, 1).toString("base64");

describe("My Probot app", () => {
  let probot;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      secret: "test",
      Octokit: ProbotOctokit,
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test("populates secrets and variables when a repository is created", async () => {
    // Mock the public key endpoint
    nock("https://api.github.com")
      .get("/repos/test-owner/test-repo/actions/secrets/public-key")
      .reply(200, {
        key_id: "test-key-id",
        key: validPublicKey,
      });

    // Mock the createOrUpdateRepoSecret endpoint
    nock("https://api.github.com")
      .put("/repos/test-owner/test-repo/actions/secrets/CLASSROOM_TOKEN")
      .reply(201);

    // Mock the list variables endpoint
    nock("https://api.github.com")
      .get("/repos/test-owner/test-repo/actions/variables")
      .reply(200, { variables: [] });

    // Mock the create variable endpoint
    nock("https://api.github.com")
      .post("/repos/test-owner/test-repo/actions/variables", body => {
        assert.deepStrictEqual(body, {
          name: "PR_AGENT_BOT_USER",
          value: process.env.PR_AGENT_BOT_USER,
        });
        return true;
      })
      .reply(201);

    // Mock the create feedback branch ruleset endpoint
    nock("https://api.github.com")
      .post("/repos/test-owner/test-repo/rulesets", body => {
        assert.strictEqual(body.name, "Protect feedback branch");
        assert.strictEqual(body.enforcement, "active");
        assert.strictEqual(body.bypass_actors[0].actor_type, "OrganizationAdmin");
        assert.strictEqual(body.bypass_actors[0].bypass_mode, "always");
        assert.strictEqual(body.bypass_actors[1].actor_type, "RepositoryRole");
        assert.strictEqual(body.bypass_actors[1].actor_id, 5);
        assert.strictEqual(body.bypass_actors[1].bypass_mode, "always");
        assert.deepStrictEqual(body.conditions.ref_name.include, ["refs/heads/feedback"]);
        assert.strictEqual(body.rules[0].type, "deletion");
        assert.strictEqual(body.rules[1].type, "non_fast_forward");
        assert.strictEqual(body.rules[2].type, "pull_request");
        assert.strictEqual(body.rules[2].parameters.required_approving_review_count, 1);
        return true;
      })
      .reply(201);

    // Simulate the repository.created event
    await probot.receive({
      name: "repository",
      payload: {
        action: "created",
        repository: {
          name: "test-repo",
          owner: { login: "test-owner" },
        },
      },
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
