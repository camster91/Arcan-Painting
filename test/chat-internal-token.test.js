import { afterEach, describe, expect, test, vi } from "vitest";

const { chatWithGemini, notifyGerardo } = vi.hoisted(() => ({
  chatWithGemini: vi.fn(),
  notifyGerardo: vi.fn(),
}));

vi.mock("@/app/api/utils/gemini.js", () => ({ chatWithGemini }));
vi.mock("@/app/api/utils/telegram.js", () => ({ notifyGerardo }));
vi.mock("@/app/api/utils/rate-limit.js", () => ({
  createRateLimiter: () => () => null,
}));

const { POST } = await import("@/app/api/chat/route.js");
const originalToken = process.env.INTERNAL_API_TOKEN;
const originalAppUrl = process.env.APP_URL;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalToken === undefined) delete process.env.INTERNAL_API_TOKEN;
  else process.env.INTERNAL_API_TOKEN = originalToken;
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
});

describe("public chat handoff", () => {
  test("passes the internal token when it triggers customer-support triage", async () => {
    process.env.INTERNAL_API_TOKEN = "trusted-token";
    process.env.APP_URL = "https://arcanpainting.ca";
    chatWithGemini.mockResolvedValue("Thanks, we can help.");
    const internalFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", internalFetch);

    const response = await POST(new Request("https://arcanpainting.ca/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "I need help with an exterior painting quote." }),
    }));

    expect(response.status).toBe(200);
    expect(internalFetch).toHaveBeenCalledWith(
      "https://arcanpainting.ca/api/agents/customer-support",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-internal-api-token": "trusted-token" }),
      }),
    );
  });

  test("does not silently attempt an unauthenticated triage request when the token is missing", async () => {
    delete process.env.INTERNAL_API_TOKEN;
    process.env.APP_URL = "https://arcanpainting.ca";
    chatWithGemini.mockResolvedValue("Thanks, we can help.");
    const internalFetch = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", internalFetch);

    const response = await POST(new Request("https://arcanpainting.ca/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "I need help with an exterior painting quote." }),
    }));

    expect(response.status).toBe(200);
    expect(internalFetch).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("INTERNAL_API_TOKEN"));
  });

  test("bounds untrusted conversation history before sending it to Gemini", async () => {
    chatWithGemini.mockResolvedValue("Thanks, we can help.");
    const history = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: `${index}:${"x".repeat(3_000)}`,
    }));

    const response = await POST(new Request("https://arcanpainting.ca/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Can you help me?", history }),
    }));

    expect(response.status).toBe(200);
    expect(chatWithGemini).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: expect.stringMatching(/^8:x+/) }),
      ]),
      "Can you help me?",
    );
    const [sentHistory] = chatWithGemini.mock.calls[0];
    expect(sentHistory).toHaveLength(12);
    expect(sentHistory.every((entry) => entry.content.length <= 2_000)).toBe(true);
  });
});
