import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { retireLegacyWorker } from "@/utils/retireLegacyWorker";

function registration({
  scope = "http://localhost:3000/",
  scriptURL = "http://localhost:3000/sw.js",
  update = vi.fn().mockResolvedValue(undefined),
} = {}) {
  return {
    scope,
    active: { scriptURL },
    update,
  };
}

describe("retireLegacyWorker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations: vi.fn().mockResolvedValue([]) },
    });
  });

  it("updates only the same-origin root /sw.js registration", async () => {
    const matching = registration();
    const otherScript = registration({ scriptURL: "http://localhost:3000/other.js" });
    const nestedScope = registration({ scope: "http://localhost:3000/admin/" });
    const thirdParty = registration({ scope: "https://third-party.example/", scriptURL: "https://third-party.example/sw.js" });
    const getRegistrations = navigator.serviceWorker.getRegistrations;
    getRegistrations.mockResolvedValue([matching, otherScript, nestedScope, thirdParty]);

    await retireLegacyWorker();

    expect(matching.update).toHaveBeenCalledOnce();
    expect(otherScript.update).not.toHaveBeenCalled();
    expect(nestedScope.update).not.toHaveBeenCalled();
    expect(thirdParty.update).not.toHaveBeenCalled();
  });

  it("quietly handles unsupported and failed browser APIs", async () => {
    navigator.serviceWorker.getRegistrations.mockRejectedValue(new Error("blocked"));
    await expect(retireLegacyWorker()).resolves.toBeUndefined();

    const update = vi.fn().mockRejectedValue(new Error("update failed"));
    navigator.serviceWorker.getRegistrations.mockResolvedValue([registration({ update })]);
    await expect(retireLegacyWorker()).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledOnce();
  });

  it("retires only the known Arcan caches and proxies every request to the network", async () => {
    const handlers = {};
    const skipWaiting = vi.fn().mockResolvedValue(undefined);
    const claim = vi.fn().mockResolvedValue(undefined);
    const unregister = vi.fn().mockResolvedValue(true);
    const keys = vi.fn().mockResolvedValue([
      "arcan-crm-v1",
      "arcan-static-v1",
      "arcan-dynamic-v1",
      "unrelated-cache",
    ]);
    const remove = vi.fn().mockResolvedValue(true);
    const networkResponse = new Response("network");
    const networkFetch = vi.fn().mockResolvedValue(networkResponse);
    const worker = {
      addEventListener: (type, handler) => { handlers[type] = handler; },
      skipWaiting,
      clients: { claim },
      registration: { unregister },
    };
    vm.runInNewContext(readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8"), {
      self: worker,
      caches: { keys, delete: remove },
      fetch: networkFetch,
    });

    const install = { waitUntil: vi.fn() };
    handlers.install(install);
    await install.waitUntil.mock.calls[0][0];
    expect(skipWaiting).toHaveBeenCalledOnce();

    const activate = { waitUntil: vi.fn() };
    handlers.activate(activate);
    await activate.waitUntil.mock.calls[0][0];
    expect(claim).toHaveBeenCalledOnce();
    expect(remove.mock.calls.map(([name]) => name)).toEqual([
      "arcan-crm-v1",
      "arcan-static-v1",
      "arcan-dynamic-v1",
    ]);
    expect(unregister).toHaveBeenCalledOnce();

    const fetchEvent = { request: new Request("https://arcanpainting.ca/contact"), respondWith: vi.fn() };
    handlers.fetch(fetchEvent);
    await expect(fetchEvent.respondWith.mock.calls[0][0]).resolves.toBe(networkResponse);
    expect(networkFetch).toHaveBeenCalledWith(fetchEvent.request);
  });
});
