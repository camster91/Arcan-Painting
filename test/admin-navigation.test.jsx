import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router";
import BottomTabNav from "../src/components/BottomTabNav";
import { getAdminNavigation, getActiveAdminGroup, matchesAdminPath } from "../src/components/admin/navigation";

describe("business navigation", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });
  it("maps supporting routes into their business area without matching unrelated prefixes", () => {
    expect(getActiveAdminGroup("/admin/payments").key).toBe("invoices");
    expect(getActiveAdminGroup("/admin/team").key).toBe("team");
    expect(getActiveAdminGroup("/admin/contracts/templates").key).toBe("estimates");
    expect(matchesAdminPath("/admin/leads-export", "/admin/leads")).toBe(false);
    expect(getActiveAdminGroup("/admin/").key).toBe("home");
  });

  it("keeps desktop destinations reachable on mobile and updates selection after routing", () => {
    function RouteButton() {
      const navigate = useNavigate();
      return <button onClick={() => navigate("/admin/invoices")}>Route to invoices</button>;
    }
    render(<MemoryRouter initialEntries={["/admin/projects"]}><BottomTabNav /><RouteButton /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Jobs" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByText("Route to invoices"));
    expect(screen.getByRole("link", { name: "Invoices" }).getAttribute("aria-current")).toBe("page");
    const dialog = document.querySelector("dialog");
    for (const group of getAdminNavigation()) {
      expect(dialog.querySelector(`a[href="${group.entryHref}"]`)).not.toBeNull();
      for (const tab of group.tabs) expect(dialog.querySelector(`a[href="${tab.href}"]`)).not.toBeNull();
    }
  });

  it("opens a native modal dialog and restores focus when dismissed", () => {
    render(<MemoryRouter><BottomTabNav /></MemoryRouter>);
    const dialog = document.querySelector("dialog");
    dialog.showModal = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(dialog.showModal).toHaveBeenCalledOnce();
    fireEvent(dialog, new Event("close"));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "More" }));
  });
});
