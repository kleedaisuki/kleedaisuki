import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import worker from "../src/worker.ts";

/** A complete public GitHub response independent of the Worker's implementation. */
const githubProfile = {
  login: "kleedaisuki",
  name: "MoeSegFault",
  avatar_url: "https://avatars.githubusercontent.com/u/189504231?v=4",
  html_url: "https://github.com/kleedaisuki",
  bio: "Public biography",
  company: null,
  blog: "https://me.moesegfault.dev",
  location: "Tianjin",
  public_repos: 19,
  followers: 6,
  following: 3,
  created_at: "2024-11-24T05:57:43Z",
  private_repos: 999,
} as const;

/** Capture fake edge-cache writes so a later request can prove cache reuse. */
function installFixture(context: TestContext, upstream: Response) {
  const originalFetch = globalThis.fetch;
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  const originalWarn = console.warn;
  const responses = new Map<string, Response>();
  const pending: Promise<unknown>[] = [];
  let upstreamCalls = 0;
  let assetCalls = 0;

  globalThis.fetch = async (input) => {
    upstreamCalls += 1;
    assert.equal(String(input), "https://api.github.com/users/kleedaisuki");
    return upstream.clone();
  };
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      open: async (name: string) => {
        assert.equal(name, "github-profile");
        return {
          match: async (key: Request) => responses.get(key.url)?.clone(),
          put: async (key: Request, response: Response) => {
            responses.set(key.url, response.clone());
          },
        };
      },
    },
  });
  console.warn = () => undefined;
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalCaches) Object.defineProperty(globalThis, "caches", originalCaches);
    else Reflect.deleteProperty(globalThis, "caches");
  });

  const env = {
    ASSETS: {
      fetch: async () => {
        assetCalls += 1;
        return new Response("static asset", { status: 200 });
      },
    },
  } as unknown as Parameters<typeof worker.fetch>[1];
  const execution = {
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  } as unknown as Parameters<typeof worker.fetch>[2];
  const request = (path: string, method = "GET") =>
    worker.fetch(
      new Request(`https://me.moesegfault.dev${path}`, { method }) as Parameters<
        typeof worker.fetch
      >[0],
      env,
      execution,
    );
  return {
    request,
    flush: async () => Promise.all(pending),
    upstreamCalls: () => upstreamCalls,
    assetCalls: () => assetCalls,
  };
}

test("Worker returns a narrow validated profile and reuses the edge cache", async (context) => {
  const fixture = installFixture(context, Response.json(githubProfile));
  const first = await fixture.request("/api/github/profile");
  assert.equal(first.status, 200);
  assert.match(first.headers.get("cache-control") ?? "", /max-age=300/);
  assert.deepEqual(
    await first.json(),
    (({ private_repos: _ignored, ...publicFields }) => publicFields)(githubProfile),
  );
  await fixture.flush();

  const second = await fixture.request("/api/github/profile");
  assert.equal(second.status, 200);
  assert.equal(fixture.upstreamCalls(), 1, "a cache hit must not make another GitHub request");
});

for (const status of [403, 429] as const) {
  test(`Worker maps GitHub ${status} to a non-cacheable 429`, async (context) => {
    const fixture = installFixture(context, new Response("rate limited", { status }));
    const response = await fixture.request("/api/github/profile");
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("cache-control"), "no-store");
    await fixture.flush();
    await fixture.request("/api/github/profile");
    assert.equal(fixture.upstreamCalls(), 2, "a failure must not enter the edge cache");
  });
}

test("Worker rejects malformed upstream data without caching it", async (context) => {
  const fixture = installFixture(context, Response.json({ login: "kleedaisuki" }));
  const response = await fixture.request("/api/github/profile");
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  await fixture.flush();
  await fixture.request("/api/github/profile");
  assert.equal(fixture.upstreamCalls(), 2);
});

test("Worker isolates unknown API paths and methods from static assets", async (context) => {
  const fixture = installFixture(context, Response.json(githubProfile));
  const wrongMethod = await fixture.request("/api/github/profile", "POST");
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "GET");
  const unknown = await fixture.request("/api/not-a-route");
  assert.equal(unknown.status, 404);
  assert.match(unknown.headers.get("content-type") ?? "", /application\/json/);
  assert.equal(fixture.upstreamCalls(), 0);
  assert.equal(fixture.assetCalls(), 0);
  assert.equal((await fixture.request("/uses/")).status, 200);
  assert.equal(fixture.assetCalls(), 1);
});
