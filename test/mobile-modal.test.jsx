import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import MobileModal from "@/components/MobileModal";
import { ModalProvider, useModal } from "@/contexts/ModalContext";

function State() {
  const { modalCount } = useModal();
  return <output aria-label="Open dialog count">{modalCount}</output>;
}

const nativeMethods = Object.fromEntries(["showModal", "close"].map((name) =>
  [name, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name)]));
beforeEach(() => {
  // jsdom has no native dialog implementation; browser containment needs E2E proof.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value: vi.fn(function () { this.open = true; }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value: vi.fn(function () { this.open = false; }),
  });
});
afterEach(() => {
  cleanup();
  for (const name of ["showModal", "close"]) {
    if (nativeMethods[name]) Object.defineProperty(HTMLDialogElement.prototype, name, nativeMethods[name]);
    else delete HTMLDialogElement.prototype[name];
  }
  document.body.style.overflow = "";
  document.body.style.height = "";
});

describe("shared admin dialogs", () => {
  it("registers once when a form rerenders, without adding history entries", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    function Form() {
      const [value, setValue] = useState("");
      return <><State /><MobileModal isOpen onClose={() => {}} title="New job">
        <input aria-label="Job name" value={value} onChange={(event) => setValue(event.target.value)} />
      </MobileModal></>;
    }
    render(<ModalProvider><Form /></ModalProvider>);
    expect(screen.getByRole("dialog", { name: "New job" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Job name" }), { target: { value: "Kitchen repaint" } });
    expect(screen.getByLabelText("Open dialog count")).toHaveTextContent("1");
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  it("keeps scroll locked until the final nested dialog closes, then restores it and focus", () => {
    document.body.style.overflow = "auto";
    document.body.style.height = "75vh";
    function Form() {
      const [open, setOpen] = useState(false);
      const [nested, setNested] = useState(false);
      return <><State /><button onClick={() => setOpen(true)}>Open job</button>
        <MobileModal isOpen={open} title="Job" onClose={() => setOpen(false)}>
          <button onClick={() => setNested(true)}>Add photo</button>
          <MobileModal isOpen={nested} title="Photo" onClose={() => setNested(false)}><input aria-label="Caption" /></MobileModal>
        </MobileModal></>;
    }
    render(<ModalProvider><Form /></ModalProvider>);
    const trigger = screen.getByRole("button", { name: "Open job" });
    trigger.focus();
    fireEvent.click(trigger);
    const nestedTrigger = screen.getByRole("button", { name: "Add photo" });
    nestedTrigger.focus();
    fireEvent.click(nestedTrigger);
    expect(screen.getByLabelText("Open dialog count")).toHaveTextContent("2");
    fireEvent(screen.getByRole("dialog", { name: "Photo" }), new Event("cancel", { cancelable: true, bubbles: false }));
    expect(screen.getByLabelText("Open dialog count")).toHaveTextContent("1");
    expect(document.body.style.overflow).toBe("hidden");
    expect(nestedTrigger).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByLabelText("Open dialog count")).toHaveTextContent("0");
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.height).toBe("75vh");
    expect(trigger).toHaveFocus();
  });
});
