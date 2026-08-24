import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LeadFormPopup from "@/components/LeadFormPopup";

describe("LeadFormPopup accessibility", () => {
  it("exposes a labelled modal dialog, focuses its close control, and closes on Escape", () => {
    const onClose = vi.fn();

    render(<LeadFormPopup isOpen onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: /request your estimate/i })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(screen.getByRole("button", { name: "Close estimate form" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
