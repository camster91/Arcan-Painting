import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import NotFoundPage, { loader } from "@/app/__create/not-found";

describe("generic not-found route", () => {
  it("returns an HTTP 404 while retaining the not-found page component", () => {
    const response = loader();

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
  });

  it("provides a skip link to its main content", () => {
    const { container } = render(<MemoryRouter><NotFoundPage /></MemoryRouter>);

    expect(within(container).getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(container.querySelector("main#main")).not.toBeNull();
  });
});
