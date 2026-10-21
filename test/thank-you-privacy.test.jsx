import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ThankYouPage, { loader } from "@/app/thank-you/page";

vi.mock("@/components/Header", () => ({ default: () => <header /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/SchedulerSection", () => ({ default: () => <section aria-label="Scheduler" /> }));
afterEach(() => cleanup());

it("renders a generic confirmation without reading personal query parameters", () => {
  window.history.replaceState({}, "", "/thank-you?name=Privacy%20Fixture&email=fixture%40example.test&phone=4165550101&serviceType=interior");
  render(<ThankYouPage />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Thank you!$/);
  expect(screen.queryByText(/Privacy Fixture|fixture@example.test|4165550101/)).toBeNull();
});

it.each([
  "?name=Privacy%20Fixture&email=fixture%40example.test&phone=4165550101",
  "?serviceType=interior&utm_source=search",
])("redirects legacy query-string links before page rendering: %s", (query) => {
  const response = loader({ request: new Request(`https://example.test/thank-you${query}`) });
  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe("/thank-you");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
});

it("allows a clean thank-you page without any customer data", () => {
  expect(loader({ request: new Request("https://example.test/thank-you") })).toBeNull();
});
