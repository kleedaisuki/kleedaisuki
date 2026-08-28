import assert from "node:assert/strict";
import test from "node:test";
import { getGitHubProfile } from "../src/lib/github-profile.ts";
import { parseGitHubProfile } from "../src/lib/github-profile-model.ts";

/** @brief 完整且有效的 GitHub 用户响应样本 (Complete valid GitHub user-response fixture)。 */
const validProfile = {
  login: "kleedaisuki",
  name: "MoeSegFault",
  avatar_url: "https://avatars.githubusercontent.com/u/189504231?v=4",
  html_url: "https://github.com/kleedaisuki",
  bio: "Vibe coding is all you need!",
  company: null,
  blog: "https://me.moesegfault.dev",
  location: null,
  public_repos: 19,
  followers: 6,
  following: 3,
  created_at: "2024-11-24T05:57:43Z",
} as const;

test("maps a complete GitHub profile through the shared data boundary", () => {
  /** @brief 规范化后的 GitHub 资料 (Normalized GitHub profile)。 */
  const profile = parseGitHubProfile(validProfile);
  assert.equal(profile.login, "kleedaisuki");
  assert.equal(profile.publicRepositories, 19);
  assert.equal(profile.company, null);
});

test("rejects malformed dynamic data before it can replace static content", () => {
  assert.throws(
    () => parseGitHubProfile({ login: "kleedaisuki" }),
    /omitted required profile fields/,
  );
});

test("fails the build resolver when no valid GitHub snapshot can be fetched", async (context) => {
  /** @brief 测试前的原始 fetch 实现 (Original fetch implementation before the test)。 */
  const originalFetch = globalThis.fetch;
  /** @brief 测试前的原始错误日志实现 (Original error logger before the test)。 */
  const originalError = console.error;
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  console.error = () => undefined;
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  });

  await assert.rejects(getGitHubProfile("kleedaisuki"), /Unable to build a static GitHub profile/);
});
