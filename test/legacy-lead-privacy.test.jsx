import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { getAttribution } = vi.hoisted(() => ({
  getAttribution: vi.fn(() => ({
    landingPage: "/services/premium-painting",
    utmSource: "fixture",
  })),
}));

vi.mock("@/utils/analytics", () => ({
  getAttribution,
  trackEvent: vi.fn(),
}));
vi.mock("@/utils/useTheme", () => ({ useTheme: vi.fn() }));

import ContactSection from "@/components/ContactSection";
import LeadFormPopup from "@/components/LeadFormPopup";

const apiFailureAcknowledgement = {
  success: true,
  lead_saved: false,
  lead_id: null,
};

function renderEmbeddedForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ContactSection />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  getAttribution.mockClear();
});

async function advanceEmbeddedForm() {
  fireEvent.click(screen.getByRole("button", { name: "Interior", exact: true }));
  fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
    target: { value: "Privacy Fixture" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
  fireEvent.click(screen.getByRole("button", { name: "Email", exact: true }));
  fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
}

async function advancePopupForm() {
  fireEvent.click(screen.getByRole("button", { name: "Interior", exact: true }));
  fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
    target: { value: "Privacy Fixture" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
  fireEvent.click(screen.getByRole("button", { name: "Email", exact: true }));
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Go to next step" }));
}

function captureNavigation() {
  const originalWindow = window;
  const attemptedUrls = [];
  const locationProxy = new Proxy(originalWindow.location, {
    get(target, property) {
      return Reflect.get(target, property, target);
    },
    set(target, property, value) {
      if (property === "href") {
        attemptedUrls.push(value);
        return true;
      }
      return Reflect.set(target, property, value, target);
    },
  });
  const windowProxy = new Proxy(originalWindow, {
    get(target, property) {
      if (property === "location") return locationProxy;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  vi.stubGlobal("window", windowProxy);
  return attemptedUrls;
}

describe("retained legacy lead forms", () => {
  it("posts embedded form details and attribution without reporting a false save as success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => apiFailureAcknowledgement,
    });
    vi.stubGlobal("fetch", fetchMock);
    renderEmbeddedForm();

    await advanceEmbeddedForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Privacy Fixture",
      email: "fixture@example.test",
      phone: "",
      serviceType: "interior",
      preferredContact: "email",
      attribution: getAttribution(),
    });
    expect(await screen.findByText("We couldn't send your request. Please try again or call us directly.")).toBeVisible();
    expect(window.location.pathname).not.toBe("/thank-you");
  });

  it("posts popup form details and attribution without reporting a false save as success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => apiFailureAcknowledgement,
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadFormPopup isOpen onClose={vi.fn()} source="privacy-fixture" />);

    await advancePopupForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Privacy Fixture",
      email: "fixture@example.test",
      phone: "",
      serviceType: "interior",
      preferredContact: "email",
      attribution: getAttribution(),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't send your request. Please try again or call us directly.");
    expect(window.location.pathname).not.toBe("/thank-you");
  });
});

describe("legacy lead success redirects", () => {
  it("submits the embedded form and attempts exactly the clean thank-you URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, lead_saved: true, lead_id: 45 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const attemptedUrls = captureNavigation();
    renderEmbeddedForm();

    await advanceEmbeddedForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(attemptedUrls).toEqual(["/thank-you"]));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Privacy Fixture",
      email: "fixture@example.test",
      phone: "",
      serviceType: "interior",
      preferredContact: "email",
      attribution: getAttribution(),
    });
  });

  it("submits the popup form and attempts exactly the clean thank-you URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, lead_saved: true, lead_id: 45 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const attemptedUrls = captureNavigation();
    render(<LeadFormPopup isOpen onClose={vi.fn()} source="privacy-fixture" />);

    await advancePopupForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(attemptedUrls).toEqual(["/thank-you"]));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Privacy Fixture",
      email: "fixture@example.test",
      phone: "",
      serviceType: "interior",
      preferredContact: "email",
      attribution: getAttribution(),
    });
  });
});
