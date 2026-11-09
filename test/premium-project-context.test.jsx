import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLoaderData } from "react-router";
import Project from "../src/app/projects/[slug]/page";
import { projects } from "../src/data/premiumSite";
import { projectGallery } from "../src/data/projectGallery";

vi.mock("react-router", async (original) => ({ ...await original(), useLoaderData: vi.fn() }));
vi.mock("@/components/premium/PremiumShell", () => ({ default: ({ children }) => <main>{children}</main> }));
afterEach(cleanup);

describe("written project enquiry links", () => {
  it.each(projects)("preserves the $title reference in both estimate actions", (project) => {
    vi.mocked(useLoaderData).mockReturnValue(project);
    render(<Project />);
    const actions = screen.getAllByRole("link", { name: "Request an estimate" });
    expect(actions).toHaveLength(2);
    for (const action of actions) {
      const url = new URL(action.getAttribute("href"), "https://arcanpainting.ca");
      expect(url.pathname).toBe("/contact");
      const photo = projectGallery.find((item) => item.file === url.searchParams.get("project"));
      expect(photo?.scene).toBe(project.scene);
    }
  });
});
